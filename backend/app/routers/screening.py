from collections import defaultdict
from datetime import datetime, timedelta, timezone

import re
from urllib.parse import quote

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, Response, UploadFile
from pydantic import RootModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import job_queue
from app.cache import cached_model, invalidate_client
from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user
from app.job_linking import repair_profile_job_codes
from app.models import Candidate, Job, ScreenedProfile, User
from app.schemas import (
    CandidateOut,
    CandidateWorkflowUpdate,
    DashboardTotals,
    HiringActivityItem,
    HiringActivityResponse,
    PipelineResponse,
    PipelineStage,
    ScreeningChartPoint,
    ScreeningOverviewResponse,
    UploadResponse,
)
from app.screening_profiles import (
    build_profile_details,
    parse_score_value,
    parse_timestamp,
    screened_to_candidate_dict,
    split_summary_markers,
)
from app.storage import StorageError, refresh_resume_url, upload_resume_bytes

router = APIRouter(prefix="/api", tags=["Screening & Candidates"])
settings = get_settings()


def _candidate_out_from_dict(data: dict) -> CandidateOut:
    return CandidateOut(**data)


def _profile_details_from_candidate(c: Candidate) -> dict:
    raw = c.raw_result if isinstance(c.raw_result, dict) else {}
    return build_profile_details(
        summary=c.remarks,
        growth_pattern=(raw.get("growth_pattern") if isinstance(raw, dict) else None),
        applied_role=None,
        payload=raw,
        fallback_skills=c.skills,
        fallback_education=c.education,
        fallback_experience=c.experience_history,
    )


def _candidate_out_legacy(c: Candidate, job_title: str | None = None) -> CandidateOut:
    resume_url = refresh_resume_url(c.file_path, c.resume_url)
    details = _profile_details_from_candidate(c)
    return CandidateOut(
        id=c.id,
        job_id=c.job_id,
        job_code=None,
        client_id=c.client_id,
        name=c.name,
        email=c.email,
        phone=c.phone,
        job=job_title,
        location=None,
        score=c.score,
        status=c.status,
        screening_status=c.screening_status,
        resume_filename=c.resume_filename,
        resume_url=resume_url,
        strengths=c.strengths,
        weaknesses=c.weaknesses,
        breakdown=c.breakdown,
        score_details=None,
        skills=details["skills"],
        education=details["education"],
        experience_history=details["experience_history"],
        remarks=c.remarks,
        summary=c.remarks,
        risk=c.risk,
        growth_pattern=(c.raw_result or {}).get("growth_pattern") if isinstance(c.raw_result, dict) else None,
        interview_questions=None,
        ai_confidence=None,
        human_evaluation=c.human_evaluation,
        human_note=c.human_note,
        availability=c.availability,
        screened_on=c.screened_on,
        created_at=c.created_at,
    )


def _merge_stored_profile_details(
    db: Session, data: dict, client_id: str, uploads: list[Candidate] | None = None
) -> dict:
    """Fill skills/education/experience missing from the screened row with the local Candidate's copy.

    Pass `uploads` (this client's Candidate rows, newest first) to match in memory instead of querying per row.
    """
    if data.get("skills") and data.get("education") and data.get("experience_history"):
        return data
    email = (data.get("email") or "").strip().lower()
    name = (data.get("name") or "").strip().lower()

    if uploads is not None:
        matched = next((c for c in uploads if email and (c.email or "").strip().lower() == email), None)
        if matched is None and name:
            matched = next((c for c in uploads if (c.name or "").strip().lower() == name), None)
    else:
        q = db.query(Candidate).filter(Candidate.client_id == client_id)
        matched = None
        if email:
            matched = q.filter(Candidate.email.ilike(email)).order_by(Candidate.updated_at.desc()).first()
        if matched is None and name:
            matched = q.filter(Candidate.name.ilike(name)).order_by(Candidate.updated_at.desc()).first()

    if matched is None:
        return data

    details = _profile_details_from_candidate(matched)
    for key in ("skills", "education", "experience_history"):
        if not data.get(key) and details[key]:
            data[key] = details[key]
    return data


def _apply_details_to_candidate(candidate: Candidate, payload: dict | None, profile: ScreenedProfile | None = None) -> None:
    details = build_profile_details(
        summary=(profile.summary if profile else None) or candidate.remarks,
        growth_pattern=profile.growth_pattern if profile else None,
        applied_role=profile.applied_role if profile else None,
        payload=payload,
        fallback_skills=candidate.skills,
        fallback_education=candidate.education,
        fallback_experience=candidate.experience_history,
    )
    if details["skills"]:
        candidate.skills = details["skills"]
    if details["education"]:
        candidate.education = details["education"]
    if details["experience_history"]:
        candidate.experience_history = details["experience_history"]
    if payload:
        existing = candidate.raw_result if isinstance(candidate.raw_result, dict) else {}
        candidate.raw_result = {**existing, **payload}


def _enrich_screened_out(data: dict, row: ScreenedProfile) -> dict:
    data["resume_url"] = refresh_resume_url(row.file_path, row.resume_url or data.get("resume_url"))
    return data


def _job_code_title_map(db: Session, client_id: str) -> dict[str, str]:
    return {
        j.job_code: j.title
        for j in db.query(Job).filter(Job.client_id == client_id).all()
        if j.job_code
    }


def _job_id_to_code(db: Session, user_id: str, job_id: str | None) -> str | None:
    if not job_id:
        return None
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == user_id).first()
    return job.job_code if job else None


def _effective_status(row: ScreenedProfile) -> str | None:
    """A human decision, when present, takes precedence over the AI recommendation for stats."""
    return row.human_evaluation or row.my_recommendation


def _norm_status(value: str | None) -> str:
    return (value or "").strip().lower()


def _is_shortlisted(status: str | None) -> bool:
    s = _norm_status(status)
    return any(k in s for k in ("shortlist", "highly recommended", "recommended", "interview"))


def _is_hired(status: str | None) -> bool:
    s = _norm_status(status)
    return any(k in s for k in ("hired", "selected", "offer", "joined"))


def _is_rejected(status: str | None) -> bool:
    s = _norm_status(status)
    return any(k in s for k in ("reject", "not recommended", "low match"))


def _is_review(status: str | None) -> bool:
    s = _norm_status(status)
    return s in {"", "pending", "human review", "review"} or "review" in s


def _decision(row: ScreenedProfile) -> str:
    """Recruiter decision only: shortlisted | rejected | review | pending.

    The AI recommendation is deliberately ignored, so dashboard counts match what a human actually did.
    """
    s = _norm_status(row.human_evaluation)
    if not s:
        return "pending"
    if _is_rejected(s):
        return "rejected"
    if "shortlist" in s:
        return "shortlisted"
    if "review" in s:
        return "review"
    return "pending"


_PERIODS = {"day", "week", "month", "year"}
_BUCKET_COUNT = {"day": 14, "week": 8, "month": 12, "year": 5}


def _local_now(tz_offset: int) -> datetime:
    """Current time in the viewer's timezone (tz_offset is JS getTimezoneOffset(): UTC minus local, minutes)."""
    return datetime.utcnow() - timedelta(minutes=tz_offset)


def _period_start(now: datetime, period: str) -> datetime:
    """Start of the day / week (Mon) / month / year containing `now`."""
    day = datetime(now.year, now.month, now.day)
    if period == "day":
        return day
    if period == "week":
        return day - timedelta(days=day.weekday())
    if period == "month":
        return datetime(now.year, now.month, 1)
    return datetime(now.year, 1, 1)


def _shift_period(start: datetime, period: str, n: int) -> datetime:
    """`start` moved by n periods (negative = back)."""
    if period == "day":
        return start + timedelta(days=n)
    if period == "week":
        return start + timedelta(weeks=n)
    if period == "month":
        idx = start.year * 12 + (start.month - 1) + n
        return datetime(idx // 12, idx % 12 + 1, 1)
    return datetime(start.year + n, 1, 1)


def _bucket_label(start: datetime, period: str) -> str:
    if period == "month":
        return start.strftime("%b %Y")
    if period == "year":
        return start.strftime("%Y")
    return start.strftime("%b %d")


def _week_bucket_start(dt: datetime) -> datetime:
    monday = dt - timedelta(days=dt.weekday())
    return datetime(monday.year, monday.month, monday.day)


def _week_label(dt: datetime) -> str:
    return dt.strftime("%b %d")


# Assumed minutes a human would spend reviewing one resume (for "time saved").
_MANUAL_MINUTES_PER_CANDIDATE = 15.0
# Ignore impossible / corrupted durations (e.g. clock skew).
_MAX_AI_SECONDS_PER_CANDIDATE = 2 * 60 * 60  # 2 hours


def _norm_person_name(value: str | None) -> str:
    if not value:
        return ""
    return " ".join("".join(ch if ch.isalnum() else " " for ch in value.lower()).split())


def _risk_level(risk_flag: str | None) -> str | None:
    """candidates.risk is a short column (50 chars): keep a level there, the full text lives on the profile row."""
    text = (risk_flag or "").strip()
    if not text:
        return None
    first = text.splitlines()[0].strip("• -").strip()
    if first.lower() in {"low", "medium", "high", "none"}:
        return first.title()[:50]
    if "no significant risk" in text.lower():
        return "Low"
    flags = [ln for ln in text.splitlines() if ln.strip()]
    return "High" if len(flags) >= 3 else "Medium"


def _mark_candidate_screened(
    candidate: Candidate,
    *,
    ended_at: datetime,
    profile: ScreenedProfile | None = None,
    payload: dict | None = None,
) -> None:
    candidate.screening_status = "completed"
    candidate.screened_on = ended_at
    if profile is not None:
        candidate.score = parse_score_value(profile.total_score)
        candidate.name = profile.candidate_name or candidate.name
        candidate.email = profile.email or candidate.email
        candidate.risk = _risk_level(profile.risk_flag) or candidate.risk
        candidate.remarks = profile.summary or candidate.remarks
        if profile.my_recommendation:
            candidate.status = profile.my_recommendation[:50]
    _apply_details_to_candidate(candidate, payload, profile)


def _compute_ai_productivity(db: Session, user_id: str) -> dict[str, float | int]:
    """AI time = screened_on − created_at for completed candidates."""
    rows = (
        db.query(Candidate)
        .filter(
            Candidate.user_id == user_id,
            Candidate.screened_on.isnot(None),
            Candidate.created_at.isnot(None),
        )
        .all()
    )

    durations: list[float] = []
    for c in rows:
        seconds = (c.screened_on - c.created_at).total_seconds()
        if seconds < 0 or seconds > _MAX_AI_SECONDS_PER_CANDIDATE:
            continue
        durations.append(seconds)

    timed = len(durations)
    total_seconds = sum(durations) if durations else 0.0
    avg_seconds = (total_seconds / timed) if timed else 0.0
    total_hours = total_seconds / 3600.0
    avg_minutes = avg_seconds / 60.0
    manual_hours = (timed * _MANUAL_MINUTES_PER_CANDIDATE) / 60.0
    saved_hours = max(0.0, manual_hours - total_hours)

    return {
        "timedCandidates": timed,
        "totalAiSeconds": round(total_seconds, 1),
        "avgAiSeconds": round(avg_seconds, 1),
        "totalAiHours": round(total_hours, 3),
        "avgAiMinutes": round(avg_minutes, 2),
        "timeSavedHours": round(saved_hours, 3),
    }


@router.get("/dashboard/totals", response_model=DashboardTotals)
def dashboard_totals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return cached_model(
        "totals", current_user.client_id, DashboardTotals, lambda: _dashboard_totals_uncached(db, current_user)
    )


def _dashboard_totals_uncached(db: Session, current_user: User) -> DashboardTotals:
    jobs_count = db.query(func.count(Job.id)).filter(Job.user_id == current_user.id).scalar() or 0

    screened_rows = (
        db.query(ScreenedProfile)
        .filter(ScreenedProfile.client_id == current_user.client_id)
        .all()
    )
    screened = len(screened_rows)
    scores = [parse_score_value(r.total_score) for r in screened_rows]
    scores = [s for s in scores if s is not None]
    avg = round(sum(scores) / len(scores), 1) if scores else 0.0

    # Awaiting = no final human decision yet (undecided, or explicitly moved to review)
    awaiting = sum(1 for r in screened_rows if _decision(r) in {"pending", "review"})
    # Include still-processing uploads
    awaiting += (
        db.query(func.count(Candidate.id))
        .filter(
            Candidate.user_id == current_user.id,
            Candidate.screening_status.in_(["queued", "processing"]),
        )
        .scalar()
        or 0
    )

    productivity = _compute_ai_productivity(db, current_user.id)

    return DashboardTotals(
        jobsAdded=int(jobs_count),
        candidatesScreened=int(screened),
        awaitingReview=int(awaiting),
        humanReviewed=int(sum(1 for r in screened_rows if _decision(r) != "pending")),
        averageMatchScore=avg,
        timedCandidates=int(productivity["timedCandidates"]),
        totalAiSeconds=float(productivity["totalAiSeconds"]),
        avgAiSeconds=float(productivity["avgAiSeconds"]),
        totalAiHours=float(productivity["totalAiHours"]),
        avgAiMinutes=float(productivity["avgAiMinutes"]),
        timeSavedHours=float(productivity["timeSavedHours"]),
    )


@router.get("/dashboard/screening-overview", response_model=ScreeningOverviewResponse)
def screening_overview(
    period: str = Query(default="week"),
    tz_offset: int = Query(default=0, ge=-840, le=840),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    period = period if period in _PERIODS else "week"
    return cached_model(
        "overview",
        current_user.client_id,
        ScreeningOverviewResponse,
        lambda: _screening_overview_uncached(db, current_user, period, tz_offset),
        extra=f"{period}:{tz_offset}",
    )


def _screening_overview_uncached(
    db: Session, current_user: User, period: str, tz_offset: int
) -> ScreeningOverviewResponse:
    """Screened / shortlisted / review / rejected counts per day, week, month or year.

    Each candidate is counted in the bucket of their screening date; the decision columns show what the
    recruiter later did with the candidates screened in that bucket.
    """
    now = _local_now(tz_offset)
    count = _BUCKET_COUNT[period]
    first = _shift_period(_period_start(now, period), period, -(count - 1))
    starts = [_shift_period(first, period, i) for i in range(count)]
    buckets = {st: {"screened": 0, "shortlisted": 0, "review": 0, "rejected": 0} for st in starts}

    rows = (
        db.query(ScreenedProfile)
        .filter(ScreenedProfile.client_id == current_user.client_id)
        .all()
    )
    for row in rows:
        dt = (parse_timestamp(row.timestamp) or datetime.utcnow()) - timedelta(minutes=tz_offset)
        if dt < first:
            continue
        key = _period_start(dt, period)
        if key not in buckets:
            continue
        buckets[key]["screened"] += 1
        decision = _decision(row)
        if decision in buckets[key]:
            buckets[key][decision] += 1

    return ScreeningOverviewResponse(
        points=[ScreeningChartPoint(month=_bucket_label(st, period), **buckets[st]) for st in starts]
    )


@router.get("/dashboard/pipeline", response_model=PipelineResponse)
def hiring_pipeline(
    period: str = Query(default="all"),
    tz_offset: int = Query(default=0, ge=-840, le=840),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    period = period if period in _PERIODS else "all"
    return cached_model(
        "pipeline",
        current_user.client_id,
        PipelineResponse,
        lambda: _hiring_pipeline_uncached(db, current_user, period, tz_offset),
        extra=f"{period}:{tz_offset}",
    )


def _hiring_pipeline_uncached(db: Session, current_user: User, period: str, tz_offset: int) -> PipelineResponse:
    """Pipeline for the current day / week / month / year (or everything when period is "all")."""
    since = None
    if period != "all":
        since = _period_start(_local_now(tz_offset), period) + timedelta(minutes=tz_offset)  # back to UTC

    screened_rows = [
        r
        for r in db.query(ScreenedProfile).filter(ScreenedProfile.client_id == current_user.client_id).all()
        if since is None or (parse_timestamp(r.timestamp) or datetime.utcnow()) >= since
    ]
    pending_q = db.query(func.count(Candidate.id)).filter(
        Candidate.user_id == current_user.id,
        Candidate.screening_status.in_(["queued", "processing", "failed"]),
    )
    if since is not None:
        pending_q = pending_q.filter(Candidate.created_at >= since)
    pending = pending_q.scalar() or 0

    counts = {"shortlisted": 0, "review": 0, "rejected": 0}
    for row in screened_rows:
        decision = _decision(row)
        if decision in counts:
            counts[decision] += 1

    stages = [
        PipelineStage(stage="Profile Run", count=len(screened_rows) + int(pending), color="#6366F1"),
        PipelineStage(stage="Screened", count=len(screened_rows), color="#60A5FA"),
        PipelineStage(stage="Human Review", count=counts["review"], color="#F59E0B"),
        PipelineStage(stage="Shortlisted", count=counts["shortlisted"], color="#34D399"),
        PipelineStage(stage="Rejected", count=counts["rejected"], color="#FB7185"),
    ]
    return PipelineResponse(stages=stages)


def _utc_iso(value: datetime | None) -> str:
    """
    ISO-8601 in UTC with a trailing Z, e.g. 2026-10-06T12:24:35.280Z.
    Naive datetimes (our own created_at / updated_at columns) are UTC by definition; aware ones are converted.
    Every activity uses this one format so the browser can convert it to the viewer's/IST time exactly once.
    """
    dt = value or datetime.utcnow()
    dt = dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)
    return dt.isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _utc_iso_from_text(text: str | None) -> str:
    """
    Parse a 'Timestamp' string such as 2026-10-06T17:54:55.077+05:30 keeping its offset, then return UTC.
    A value with no offset is treated as UTC; an unreadable value falls back to now.
    """
    raw = (text or "").strip()
    if raw:
        try:
            return _utc_iso(datetime.fromisoformat(raw.replace("Z", "+00:00")))
        except ValueError:
            pass
    return _utc_iso(None)


@router.get("/hiring-activity", response_model=HiringActivityResponse)
def hiring_activity(
    type_filter: str | None = Query(default=None, alias="type"),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return cached_model(
        "activity",
        current_user.client_id,
        HiringActivityResponse,
        lambda: _hiring_activity_uncached(db, current_user, type_filter, limit),
        extra=f"{type_filter or 'all'}:{limit}",
    )


def _hiring_activity_uncached(
    db: Session, current_user: User, type_filter: str | None, limit: int
) -> HiringActivityResponse:
    activities: list[HiringActivityItem] = []
    actor = current_user.name or "You"
    title_map = _job_code_title_map(db, current_user.client_id)

    jobs = (
        db.query(Job)
        .filter(Job.user_id == current_user.id)
        .order_by(Job.created_at.desc())
        .limit(100)
        .all()
    )
    for job in jobs:
        status = (job.status or "").lower()
        if status == "draft":
            activities.append(
                HiringActivityItem(
                    id=f"job-draft-{job.id}",
                    type="job",
                    title="Job saved as draft",
                    description=f"{job.title} saved as draft",
                    user=actor,
                    timestamp=_utc_iso(job.created_at),
                    icon="FileText",
                )
            )
        elif status in {"closed", "archived", "on hold"}:
            activities.append(
                HiringActivityItem(
                    id=f"job-closed-{job.id}",
                    type="rejected",
                    title="Job put on hold" if status == "on hold" else "Job closed",
                    description=f"{job.title} position {status}",
                    user=actor,
                    timestamp=_utc_iso(job.updated_at or job.created_at),
                    icon="XCircle",
                )
            )
        else:
            activities.append(
                HiringActivityItem(
                    id=f"job-{job.id}",
                    type="job",
                    title="New job published",
                    description=f"{job.title} job published",
                    user=actor,
                    timestamp=_utc_iso(job.created_at),
                    icon="Briefcase",
                )
            )

    uploads = (
        db.query(Candidate)
        .filter(Candidate.user_id == current_user.id)
        .order_by(Candidate.created_at.desc())
        .limit(100)
        .all()
    )
    # Group uploads by job + day for cleaner feed
    upload_groups: dict[tuple[str, str], list[Candidate]] = defaultdict(list)
    for c in uploads:
        day = (c.created_at or datetime.utcnow()).strftime("%Y-%m-%d")
        upload_groups[(c.job_id, day)].append(c)

    for (job_id, _day), group in upload_groups.items():
        job = db.get(Job, job_id)
        job_title = job.title if job else "a job"
        latest = max(group, key=lambda x: x.created_at or datetime.min)
        activities.append(
            HiringActivityItem(
                id=f"upload-{job_id}-{_day}",
                type="upload",
                title="Resumes uploaded",
                description=f"{len(group)} resume{'s' if len(group) != 1 else ''} uploaded for {job_title}",
                user=actor,
                timestamp=_utc_iso(latest.created_at),
                icon="Upload",
            )
        )

    screened_rows = (
        db.query(ScreenedProfile)
        .filter(ScreenedProfile.client_id == current_user.client_id)
        .all()
    )
    for row in screened_rows:
        name = row.candidate_name or "Candidate"
        role = title_map.get(row.job_code or "") or row.applied_role or "a role"
        ts_iso = _utc_iso_from_text(row.timestamp)
        rid = str(row.row_id)

        activities.append(
            HiringActivityItem(
                id=f"screened-{rid}",
                type="screened",
                title="Resume screened",
                description=f"{name} analyzed for {role}",
                user="AI System",
                timestamp=ts_iso,
                icon="FileSearch",
            )
        )

        status = _effective_status(row) or ""
        if _is_hired(status) or _is_shortlisted(status):
            activities.append(
                HiringActivityItem(
                    id=f"shortlisted-{rid}",
                    type="shortlisted",
                    title="Candidate shortlisted",
                    description=f"{name} shortlisted for {role}",
                    user=actor,
                    timestamp=ts_iso,
                    icon="UserCheck",
                )
            )
        elif _is_review(status) and _norm_status(status) not in {"", "pending"}:
            activities.append(
                HiringActivityItem(
                    id=f"review-{rid}",
                    type="review",
                    title="Candidate moved to human review",
                    description=f"{name} moved to human review for {role}",
                    user=actor,
                    timestamp=ts_iso,
                    icon="Eye",
                )
            )
        elif _is_rejected(status):
            activities.append(
                HiringActivityItem(
                    id=f"rejected-{rid}",
                    type="rejected",
                    title="Candidate rejected",
                    description=f"{name} rejected for {role}",
                    user=actor,
                    timestamp=ts_iso,
                    icon="XCircle",
                )
            )

    activities.sort(key=lambda a: a.timestamp, reverse=True)

    if type_filter and type_filter.lower() != "all":
        wanted = type_filter.lower()
        activities = [a for a in activities if a.type == wanted]

    return HiringActivityResponse(activities=activities[:limit])


@router.get("/candidates", response_model=list[CandidateOut])
def list_candidates(
    job_id: str | None = None,
    status_filter: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Served from Redis when possible; uploads, jobs and human actions bump the client's cache version.
    cached = cached_model(
        "candidates",
        current_user.client_id,
        _CandidateList,
        lambda: _CandidateList(_list_candidates_uncached(db, current_user, job_id, status_filter)),
        extra=f"{current_user.id}:{job_id or ''}:{(status_filter or '').lower()}",
    )
    return cached.root


class _CandidateList(RootModel[list[CandidateOut]]):
    pass


def _list_candidates_uncached(
    db: Session, current_user: User, job_id: str | None, status_filter: str | None
) -> list[CandidateOut]:
    repair_profile_job_codes(db, current_user.client_id)

    # One query each for jobs and uploads, instead of several queries (and a signed-URL call) per candidate.
    jobs = db.query(Job).filter(Job.client_id == current_user.client_id).all()
    jobs_by_code = {j.job_code: j for j in jobs if j.job_code}
    title_map = {code: j.title for code, j in jobs_by_code.items()}
    job_code = next((j.job_code for j in jobs if j.id == job_id and j.user_id == current_user.id), None) if job_id else None
    uploads = (
        db.query(Candidate)
        .filter(Candidate.client_id == current_user.client_id)
        .order_by(Candidate.updated_at.desc())
        .all()
    )

    q = db.query(ScreenedProfile).filter(ScreenedProfile.client_id == current_user.client_id)
    if job_code:
        q = q.filter(ScreenedProfile.job_code == job_code)
    rows = q.all()

    # Newest first by timestamp text when possible
    rows.sort(key=lambda r: r.timestamp or "", reverse=True)

    results: list[CandidateOut] = []
    for row in rows:
        data = screened_to_candidate_dict(row, title_map.get(row.job_code or ""))
        # The list doesn't need a signed resume link; the details endpoint mints one when a candidate is opened.
        data["resume_url"] = None
        if status_filter and status_filter.lower() != "all":
            if (data.get("status") or "").lower() != status_filter.lower():
                continue
        job = jobs_by_code.get(row.job_code or "")
        if job:
            data["job_id"] = job.id
            data["job"] = job.title
        data = _merge_stored_profile_details(db, data, current_user.client_id, uploads)
        results.append(_candidate_out_from_dict(data))

    # Include pending upload placeholders not yet written to Screened profile
    pending_q = db.query(Candidate).filter(
        Candidate.user_id == current_user.id,
        Candidate.screening_status.in_(["queued", "processing", "failed"]),
    )
    if job_id:
        pending_q = pending_q.filter(Candidate.job_id == job_id)
    jobs_by_id = {j.id: j for j in jobs}
    for c in pending_q.order_by(Candidate.created_at.desc()).all():
        job = jobs_by_id.get(c.job_id)
        results.append(_candidate_out_legacy(c, job.title if job else None))

    return results


@router.get("/candidates/{candidate_id}", response_model=CandidateOut)
def get_candidate(
    candidate_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = (
        db.query(ScreenedProfile)
        .filter(
            ScreenedProfile.row_id == candidate_id,
            ScreenedProfile.client_id == current_user.client_id,
        )
        .first()
    )
    if row:
        data = screened_to_candidate_dict(row)
        data = _enrich_screened_out(data, row)
        job = (
            db.query(Job)
            .filter(Job.client_id == current_user.client_id, Job.job_code == row.job_code)
            .first()
        )
        if job:
            data["job_id"] = job.id
            data["job"] = job.title
        data = _merge_stored_profile_details(db, data, current_user.client_id)
        return _candidate_out_from_dict(data)

    c = (
        db.query(Candidate)
        .filter(Candidate.id == candidate_id, Candidate.user_id == current_user.id)
        .first()
    )
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    job = db.get(Job, c.job_id)
    return _candidate_out_legacy(c, job.title if job else None)


@router.get("/candidates/{candidate_id}/resume")
def download_candidate_resume(
    candidate_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Stream the candidate's stored resume file as an attachment (the bucket is private)."""
    row = (
        db.query(ScreenedProfile)
        .filter(
            ScreenedProfile.row_id == candidate_id,
            ScreenedProfile.client_id == current_user.client_id,
        )
        .first()
    )
    if row:
        name, file_path, stored_url = row.candidate_name, row.file_path, row.resume_url
    else:
        c = (
            db.query(Candidate)
            .filter(Candidate.id == candidate_id, Candidate.user_id == current_user.id)
            .first()
        )
        if not c:
            raise HTTPException(status_code=404, detail="Candidate not found")
        name, file_path, stored_url = c.name, c.file_path, c.resume_url

    url = refresh_resume_url(file_path, stored_url)
    if not url:
        raise HTTPException(status_code=404, detail="No resume file is available for this candidate")

    try:
        with httpx.Client(timeout=60.0, follow_redirects=True) as client:
            upstream = client.get(url)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Could not fetch the resume file") from exc
    if upstream.status_code == 404:
        raise HTTPException(status_code=404, detail="Resume file was not found in storage")
    if upstream.status_code >= 400 or not upstream.content:
        raise HTTPException(status_code=502, detail="Could not fetch the resume file")

    source_name = (file_path or "").split("/")[-1]
    ext = source_name.rsplit(".", 1)[-1].lower() if "." in source_name else "pdf"
    if ext not in {"pdf", "doc", "docx"}:
        ext = "pdf"
    base = re.sub(r"[^A-Za-z0-9 _.-]+", "", name or "").strip().replace(" ", "_") or "resume"
    filename = f"{base}.{ext}"
    media_type = upstream.headers.get("content-type", "application/pdf" if ext == "pdf" else "application/octet-stream")
    return Response(
        content=upstream.content,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\"; filename*=UTF-8''{quote(filename)}"},
    )


@router.patch("/candidates/{candidate_id}/workflow", response_model=CandidateOut)
def update_candidate_workflow(
    candidate_id: str,
    payload: CandidateWorkflowUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    eval_value = payload.humanEvaluation or payload.human_evaluation
    note_value = payload.humanNote if payload.humanNote is not None else payload.human_note

    row = (
        db.query(ScreenedProfile)
        .filter(
            ScreenedProfile.row_id == candidate_id,
            ScreenedProfile.client_id == current_user.client_id,
        )
        .first()
    )
    if row:
        if eval_value is not None:
            row.human_evaluation = eval_value
        # Live Screened profile table has no note / availability column, so both ride along in the summary.
        if note_value is not None or payload.availability is not None:
            base, cur_note, cur_avail = split_summary_markers(row.summary)
            note = cur_note if note_value is None else note_value.strip()
            avail = cur_avail if payload.availability is None else payload.availability.strip()
            parts = [(base or "").rstrip()]
            if note:
                parts.append(f"[Human note]\n{note}")
            if avail:
                parts.append(f"[Availability]\n{avail}")
            row.summary = "\n\n".join(x for x in parts if x).strip()
        db.commit()
        invalidate_client(current_user.client_id)
        db.refresh(row)
        data = screened_to_candidate_dict(row)
        data = _enrich_screened_out(data, row)
        job = (
            db.query(Job)
            .filter(Job.client_id == current_user.client_id, Job.job_code == row.job_code)
            .first()
        )
        if job:
            data["job_id"] = job.id
            data["job"] = job.title
        return _candidate_out_from_dict(data)

    c = (
        db.query(Candidate)
        .filter(Candidate.id == candidate_id, Candidate.user_id == current_user.id)
        .first()
    )
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if eval_value is not None:
        c.human_evaluation = eval_value
        c.status = eval_value
    if note_value is not None:
        c.human_note = note_value
    if payload.availability is not None:
        c.availability = payload.availability

    db.commit()
    invalidate_client(current_user.client_id)
    db.refresh(c)
    job = db.get(Job, c.job_id)
    return _candidate_out_legacy(c, job.title if job else None)


def _queue_screening(
    db: Session, background_tasks: BackgroundTasks, current_user: User, job: Job, uploaded_meta: list[dict]
) -> UploadResponse:
    """Hand each resume to the queue and return at once; the UI polls the candidate list."""
    mode = "queued"
    for item in uploaded_meta:
        cid = item["candidate_id"]
        if job_queue.configured():
            try:
                job_queue.publish_screening(cid)
            except httpx.HTTPError as exc:
                c = db.get(Candidate, cid)
                if c:
                    c.screening_status = "failed"
                    c.remarks = f"Could not queue screening: {exc}"[:1000]
            continue
        # No queue configured (local development): run after the response in this process.
        mode = "background"
        background_tasks.add_task(_run_screening_task, cid)
    db.commit()
    invalidate_client(current_user.client_id)
    return UploadResponse(
        message="Resumes stored and queued for AI screening",
        client_id=current_user.client_id,
        job_id=job.id,
        job_code=job.job_code,
        uploaded=uploaded_meta,
        status=mode,
    )


def _run_screening_task(candidate_id: str) -> None:
    from app.database import SessionLocal
    from app.rag import pipeline

    db = SessionLocal()
    try:
        pipeline.screen_candidate(db, candidate_id)
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        pipeline.mark_failed(db, candidate_id, str(exc))
    finally:
        db.close()


@router.post("/screening/upload", response_model=UploadResponse)
async def upload_resumes_for_screening(
    background_tasks: BackgroundTasks,
    job_id: str = Form(...),
    files: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Client must select Job before uploading.
    Resumes are stored in Supabase Storage bucket `Resume`, then screened one by one by the RAG worker,
    which writes the final row into Screened profile_Multitenent Profile screening.
    """
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found. Select a valid job before uploading.")

    if not files:
        raise HTTPException(status_code=400, detail="At least one resume is required")

    if len(files) > settings.max_resume_uploads:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {settings.max_resume_uploads} resumes allowed per upload",
        )

    uploaded_meta: list[dict] = []
    multipart_files = []

    for f in files:
        filename = f.filename or "resume.pdf"
        lower = filename.lower()
        if not (lower.endswith(".pdf") or lower.endswith(".doc") or lower.endswith(".docx")):
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {filename}")

        content = await f.read()
        if not content:
            raise HTTPException(status_code=400, detail=f"Empty file: {filename}")

        candidate = Candidate(
            user_id=current_user.id,
            client_id=current_user.client_id,
            job_id=job.id,
            name=filename.rsplit(".", 1)[0].replace("_", " ").title(),
            resume_filename=filename,
            status="Pending",
            screening_status="processing",
        )
        db.add(candidate)
        db.flush()

        try:
            stored = upload_resume_bytes(
                content=content,
                filename=filename,
                client_id=current_user.client_id,
                job_code=job.job_code,
                candidate_id=candidate.id,
                content_type=f.content_type,
            )
        except StorageError as exc:
            db.rollback()
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        candidate.file_path = stored["file_path"]
        candidate.resume_url = stored["resume_url"]

        uploaded_meta.append(
            {
                "candidate_id": candidate.id,
                "resume_filename": filename,
                "file_path": stored["file_path"],
                "resume_url": stored["resume_url"],
                "size": len(content),
            }
        )
        multipart_files.append(
            ("files", (filename, content, f.content_type or "application/pdf"))
        )

    db.commit()
    invalidate_client(current_user.client_id)

    return _queue_screening(db, background_tasks, current_user, job, uploaded_meta)
