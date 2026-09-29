"""Attach Screened profile rows to the right job when n8n wrote a wrong/missing Job code."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models import Candidate, Job, ScreenedProfile
from app.screening_profiles import _is_placeholder

# n8n writes the profile a few seconds after the upload; allow slow workflows.
_UPLOAD_WINDOW_BEFORE = timedelta(minutes=30)
_UPLOAD_WINDOW_AFTER = timedelta(minutes=2)


def is_real_profile(row: ScreenedProfile) -> bool:
    """Empty n8n items (no name / email) should not count as screened candidates."""
    for value in (row.candidate_name, row.email):
        if value and not _is_placeholder(str(value)):
            return True
    return False


def _profile_time_utc(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).strip().replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def _job_from_upload(ts: datetime | None, uploads: list[Candidate], jobs_by_id: dict[str, Job]) -> Job | None:
    if ts is None:
        return None
    best: Candidate | None = None
    for upload in uploads:
        if not upload.created_at or upload.job_id not in jobs_by_id:
            continue
        if not (ts - _UPLOAD_WINDOW_BEFORE <= upload.created_at <= ts + _UPLOAD_WINDOW_AFTER):
            continue
        if best is None or abs(ts - upload.created_at) < abs(ts - best.created_at):
            best = upload
    return jobs_by_id[best.job_id] if best else None


def _job_from_role(role: str | None, jobs: list[Job]) -> Job | None:
    wanted = (role or "").strip().lower()
    if not wanted or _is_placeholder(wanted):
        return None
    matches = [j for j in jobs if (j.title or "").strip().lower() == wanted]
    return matches[0] if len(matches) == 1 else None


def repair_profile_job_codes(db: Session, client_id: str | None) -> int:
    """
    Fix profiles whose Job code is missing or not one of this client's job codes
    (n8n has been writing the Client ID there). Returns the number of rows fixed.
    """
    if not client_id:
        return 0
    jobs = db.query(Job).filter(Job.client_id == client_id).all()
    if not jobs:
        return 0
    known_codes = {j.job_code for j in jobs}

    orphans = (
        db.query(ScreenedProfile)
        .filter(
            ScreenedProfile.client_id == client_id,
            or_(ScreenedProfile.job_code.is_(None), ScreenedProfile.job_code.notin_(known_codes)),
        )
        .all()
    )
    orphans = [p for p in orphans if is_real_profile(p)]
    if not orphans:
        return 0

    jobs_by_id = {j.id: j for j in jobs}
    uploads = db.query(Candidate).filter(Candidate.client_id == client_id).all()

    fixed = 0
    for profile in orphans:
        job = _job_from_upload(_profile_time_utc(profile.timestamp), uploads, jobs_by_id) or _job_from_role(
            profile.applied_role, jobs
        )
        if job:
            profile.job_code = job.job_code
            fixed += 1

    if fixed:
        db.commit()
    return fixed
