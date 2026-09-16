from collections import defaultdict
from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user
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
    apply_screening_payload,
    parse_score_value,
    parse_timestamp,
    screened_to_candidate_dict,
)
from app.storage import StorageError, refresh_resume_url, upload_resume_bytes

router = APIRouter(prefix="/api", tags=["Screening & Candidates"])
settings = get_settings()


def _candidate_out_from_dict(data: dict) -> CandidateOut:
    return CandidateOut(**data)


def _candidate_out_legacy(c: Candidate, job_title: str | None = None) -> CandidateOut:
    resume_url = refresh_resume_url(c.file_path, c.resume_url)
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
        remarks=c.remarks,
        summary=c.remarks,
        risk=c.risk,
        growth_pattern=None,
        interview_questions=None,
        ai_confidence=None,
        human_evaluation=c.human_evaluation,
        human_note=c.human_note,
        availability=c.availability,
        screened_on=c.screened_on,
        created_at=c.created_at,
    )


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


def _mark_candidate_screened(candidate: Candidate, *, ended_at: datetime, profile: ScreenedProfile | None = None) -> None:
    candidate.screening_status = "completed"
    candidate.screened_on = ended_at
    if profile is not None:
        candidate.score = parse_score_value(profile.total_score)
        candidate.name = profile.candidate_name or candidate.name
        candidate.email = profile.email or candidate.email
        candidate.risk = profile.risk_flag or candidate.risk
        candidate.remarks = profile.summary or candidate.remarks
        if profile.my_recommendation:
            candidate.status = profile.my_recommendation


def _reconcile_screening_completions(db: Session, user: User) -> int:
    """
    Link processing uploads to Screened profile rows written by n8n.
    Sets screened_on so productivity can use created_at → screened_on.
    """
    pending = (
        db.query(Candidate)
        .filter(
            Candidate.user_id == user.id,
            Candidate.screening_status.in_(["queued", "processing"]),
        )
        .order_by(Candidate.created_at.asc())
        .all()
    )
    if not pending:
        return 0

    jobs = {j.id: j for j in db.query(Job).filter(Job.user_id == user.id).all()}
    profiles = (
        db.query(ScreenedProfile)
        .filter(ScreenedProfile.client_id == user.client_id)
        .all()
    )
    usable = []
    for p in profiles:
        if not (p.candidate_name or p.email or p.total_score):
            continue
        usable.append(p)

    used: set[str] = set()
    updated = 0

    for candidate in pending:
        job = jobs.get(candidate.job_id)
        job_code = job.job_code if job else None
        c_name = _norm_person_name(candidate.name)
        best: ScreenedProfile | None = None
        best_score = -1

        for profile in usable:
            pid = str(profile.row_id)
            if pid in used:
                continue
            pts = parse_timestamp(profile.timestamp)
            if candidate.created_at and pts and pts < candidate.created_at - timedelta(minutes=5):
                continue
            if candidate.created_at and pts and pts > candidate.created_at + timedelta(hours=6):
                continue

            score = 0
            if job_code and profile.job_code and profile.job_code == job_code:
                score += 3
            p_name = _norm_person_name(profile.candidate_name)
            if c_name and p_name and (c_name in p_name or p_name in c_name or c_name[:12] == p_name[:12]):
                score += 5
            if candidate.email and profile.email and candidate.email.lower() == profile.email.lower():
                score += 5
            if score > best_score:
                best_score = score
                best = profile

        # Require at least a name/email match or same job_code inside the time window
        if not best or best_score < 3:
            continue

        used.add(str(best.row_id))
        ended = parse_timestamp(best.timestamp) or datetime.utcnow()
        if candidate.created_at and ended < candidate.created_at:
            ended = datetime.utcnow()
        _mark_candidate_screened(candidate, ended_at=ended, profile=best)
        updated += 1

    if updated:
        db.commit()
    return updated


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
    # Finish any uploads whose Screened profile rows arrived without updating Candidate
    _reconcile_screening_completions(db, current_user)

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

    awaiting = sum(
        1
        for r in screened_rows
        if (r.my_recommendation or "").lower() in {"", "pending", "human review", "review"}
    )
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
    weeks: int = Query(default=5, ge=1, le=26),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate screened / shortlisted / hired counts by week for the chart."""
    now = datetime.utcnow()
    start = _week_bucket_start(now) - timedelta(weeks=weeks - 1)

    buckets: dict[datetime, dict[str, int]] = {
        start + timedelta(weeks=i): {"screened": 0, "shortlisted": 0, "hired": 0}
        for i in range(weeks)
    }

    rows = (
        db.query(ScreenedProfile)
        .filter(ScreenedProfile.client_id == current_user.client_id)
        .all()
    )
    for row in rows:
        dt = parse_timestamp(row.timestamp) or now
        if dt < start:
            continue
        key = _week_bucket_start(dt)
        if key not in buckets:
            continue
        buckets[key]["screened"] += 1
        if _is_hired(row.my_recommendation):
            buckets[key]["hired"] += 1
        elif _is_shortlisted(row.my_recommendation):
            buckets[key]["shortlisted"] += 1

    points = [
        ScreeningChartPoint(
            month=_week_label(week),
            screened=counts["screened"],
            shortlisted=counts["shortlisted"],
            hired=counts["hired"],
        )
        for week, counts in sorted(buckets.items(), key=lambda item: item[0])
    ]
    return ScreeningOverviewResponse(points=points)


@router.get("/dashboard/pipeline", response_model=PipelineResponse)
def hiring_pipeline(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    screened_rows = (
        db.query(ScreenedProfile)
        .filter(ScreenedProfile.client_id == current_user.client_id)
        .all()
    )
    pending = (
        db.query(func.count(Candidate.id))
        .filter(
            Candidate.user_id == current_user.id,
            Candidate.screening_status.in_(["queued", "processing", "failed"]),
        )
        .scalar()
        or 0
    )

    applied = len(screened_rows) + int(pending)
    screened = len(screened_rows)
    interviewed = 0
    shortlisted = 0
    hired = 0

    for row in screened_rows:
        status = row.my_recommendation
        if _is_hired(status):
            hired += 1
        elif _is_shortlisted(status):
            shortlisted += 1
        elif _is_review(status):
            interviewed += 1

    stages = [
        PipelineStage(stage="Applied", count=applied, color="#6366F1"),
        PipelineStage(stage="Screened", count=screened, color="#60A5FA"),
        PipelineStage(stage="Human Review", count=interviewed, color="#34D399"),
        PipelineStage(stage="Shortlisted", count=shortlisted, color="#FBBF24"),
        PipelineStage(stage="Hired", count=hired, color="#FB7185"),
    ]
    return PipelineResponse(stages=stages)


@router.get("/hiring-activity", response_model=HiringActivityResponse)
def hiring_activity(
    type_filter: str | None = Query(default=None, alias="type"),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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
                    timestamp=(job.created_at or datetime.utcnow()).isoformat(),
                    icon="FileText",
                )
            )
        elif status in {"closed", "archived"}:
            activities.append(
                HiringActivityItem(
                    id=f"job-closed-{job.id}",
                    type="rejected",
                    title="Job closed",
                    description=f"{job.title} position {status}",
                    user=actor,
                    timestamp=(job.updated_at or job.created_at or datetime.utcnow()).isoformat(),
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
                    timestamp=(job.created_at or datetime.utcnow()).isoformat(),
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
                timestamp=(latest.created_at or datetime.utcnow()).isoformat(),
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
        ts = parse_timestamp(row.timestamp) or datetime.utcnow()
        ts_iso = ts.isoformat()
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

        status = row.my_recommendation or ""
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
    job_code = _job_id_to_code(db, current_user.id, job_id)
    title_map = _job_code_title_map(db, current_user.client_id)

    q = db.query(ScreenedProfile).filter(ScreenedProfile.client_id == current_user.client_id)
    if job_code:
        q = q.filter(ScreenedProfile.job_code == job_code)
    rows = q.all()

    # Newest first by timestamp text when possible
    rows.sort(key=lambda r: r.timestamp or "", reverse=True)

    results: list[CandidateOut] = []
    for row in rows:
        data = screened_to_candidate_dict(row, title_map.get(row.job_code or ""))
        data = _enrich_screened_out(data, row)
        if status_filter and status_filter.lower() != "all":
            if (data.get("status") or "").lower() != status_filter.lower():
                continue
        # Attach local job_id when job_code matches
        job = (
            db.query(Job)
            .filter(Job.client_id == current_user.client_id, Job.job_code == row.job_code)
            .first()
        )
        if job:
            data["job_id"] = job.id
            data["job"] = job.title
        results.append(_candidate_out_from_dict(data))

    # Include pending upload placeholders not yet written to Screened profile
    pending_q = db.query(Candidate).filter(
        Candidate.user_id == current_user.id,
        Candidate.screening_status.in_(["queued", "processing", "failed"]),
    )
    if job_id:
        pending_q = pending_q.filter(Candidate.job_id == job_id)
    for c in pending_q.order_by(Candidate.created_at.desc()).all():
        job = db.get(Job, c.job_id)
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


@router.patch("/candidates/{candidate_id}/workflow", response_model=CandidateOut)
def update_candidate_workflow(
    candidate_id: str,
    payload: CandidateWorkflowUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    eval_value = payload.humanEvaluation or payload.human_evaluation
    note_value = payload.humanNote or payload.human_note

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
            row.my_recommendation = eval_value
        # Live Screened profile table has no "Projected availability" column.
        if note_value is not None:
            existing = row.summary or ""
            marker = "\n\n[Human note]\n"
            if marker in existing:
                existing = existing.split(marker, 1)[0]
            row.summary = f"{existing.rstrip()}{marker}{note_value}".strip()
        if payload.availability is not None:
            existing = row.summary or ""
            marker = "\n\n[Availability]\n"
            if marker in existing:
                existing = existing.split(marker, 1)[0]
            row.summary = f"{existing.rstrip()}{marker}{payload.availability}".strip()
        db.commit()
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
    db.refresh(c)
    job = db.get(Job, c.job_id)
    return _candidate_out_legacy(c, job.title if job else None)


@router.post("/screening/upload", response_model=UploadResponse)
async def upload_resumes_for_screening(
    job_id: str = Form(...),
    files: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Client must select Job before uploading.
    Resumes are stored in Supabase Storage bucket `Resume`, then sent to n8n.
    n8n writes final rows into Screened profile_Multitenent Profile screening.
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

    n8n_status = "calling"
    n8n_response = None
    form_data = {
        "client_id": current_user.client_id,
        "job_id": job.id,
        "job_code": job.job_code,
        "job_title": job.title,
        "resume_urls": ",".join(item["resume_url"] for item in uploaded_meta if item.get("resume_url")),
        "file_paths": ",".join(item["file_path"] for item in uploaded_meta if item.get("file_path")),
    }

    ai_started_at = datetime.utcnow()
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            form_data["candidate_ids"] = ",".join(item["candidate_id"] for item in uploaded_meta)
            resp = await client.post(
                settings.n8n_resume_webhook_url,
                data=form_data,
                files=multipart_files,
            )
            ai_ended_at = datetime.utcnow()
            n8n_status = f"http_{resp.status_code}"
            try:
                n8n_response = resp.json()
            except Exception:
                n8n_response = {"raw": resp.text[:2000]}

            if resp.is_success and isinstance(n8n_response, dict):
                results = n8n_response.get("results") or n8n_response.get("candidates") or []
                if not isinstance(results, list):
                    results = []

                matched_ids: set[str] = set()
                for index, item in enumerate(results):
                    if not isinstance(item, dict):
                        continue
                    cid = item.get("candidate_id")
                    matched = next((m for m in uploaded_meta if m["candidate_id"] == cid), None)
                    if matched is None and index < len(uploaded_meta):
                        # n8n often returns results in upload order without candidate_id
                        matched = uploaded_meta[index]
                        cid = matched["candidate_id"]
                    profile = ScreenedProfile()
                    payload = {
                        **item,
                        "client_id": current_user.client_id,
                        "job_code": item.get("job_code") or job.job_code,
                        "applied_role": item.get("applied_role") or job.title,
                        "timestamp": item.get("timestamp") or ai_ended_at.isoformat(),
                        "file_path": item.get("file_path")
                        or (matched["file_path"] if matched else None),
                        "resume_url": item.get("resume_url")
                        or item.get("Resume URL")
                        or (matched["resume_url"] if matched else None),
                    }
                    apply_screening_payload(profile, payload)
                    db.add(profile)

                    if cid:
                        c = db.get(Candidate, cid)
                        if c and c.user_id == current_user.id:
                            _mark_candidate_screened(c, ended_at=ai_ended_at, profile=profile)
                            matched_ids.add(cid)

                # If webhook succeeded but returned no per-file payload, still record AI wait time
                if not results:
                    for item in uploaded_meta:
                        c = db.get(Candidate, item["candidate_id"])
                        if c and c.user_id == current_user.id and not c.screened_on:
                            # Keep processing until Screened profile arrives; stamp start/end for productivity
                            c.screened_on = ai_ended_at
                            c.remarks = (c.remarks or "") + (
                                f"\n[AI wait] {(ai_ended_at - (c.created_at or ai_started_at)).total_seconds():.1f}s"
                            )
                            # Treat webhook round-trip as completed AI timing sample
                            c.screening_status = "completed"
                db.commit()

            # Link any profiles n8n wrote directly into Supabase
            _reconcile_screening_completions(db, current_user)
    except httpx.HTTPError as exc:
        n8n_status = "error"
        n8n_response = {"error": str(exc)}
        for item in uploaded_meta:
            c = db.get(Candidate, item["candidate_id"])
            if c:
                c.screening_status = "failed"
                c.remarks = f"n8n webhook failed: {exc}"
        db.commit()

    return UploadResponse(
        message="Resumes stored in Resume bucket and sent for AI screening",
        client_id=current_user.client_id,
        job_id=job.id,
        job_code=job.job_code,
        uploaded=uploaded_meta,
        n8n_status=n8n_status,
        n8n_response=n8n_response,
    )
