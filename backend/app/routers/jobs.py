from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import generate_job_code
from app.database import get_db
from app.deps import get_current_user
from app.models import Job, ScreenedProfile, User
from app.schemas import JobCreate, JobOut, JobRequirementOut, JobUpdate
from app.screening_profiles import parse_score_value

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


def _job_out(job: Job, db: Session) -> JobOut:
    rows = (
        db.query(ScreenedProfile)
        .filter(
            ScreenedProfile.client_id == job.client_id,
            ScreenedProfile.job_code == job.job_code,
        )
        .all()
    )
    scores = [parse_score_value(r.total_score) for r in rows]
    scores = [s for s in scores if s is not None]
    avg = round(sum(scores) / len(scores), 1) if scores else 0.0
    return JobOut(
        id=job.id,
        job_code=job.job_code,
        client_id=job.client_id,
        title=job.title,
        department=job.department,
        location=job.location,
        employment_type=job.employment_type,
        experience=job.experience,
        description=job.description,
        skills=job.skills,
        responsibilities=job.responsibilities,
        qualifications=job.qualifications,
        status=job.status,
        candidates=len(rows),
        avgScore=avg,
        created_at=job.created_at,
    )


@router.get("", response_model=list[JobOut])
def list_jobs(
    status_filter: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Job).filter(Job.user_id == current_user.id)
    if status_filter and status_filter.lower() not in {"all", "all jobs"}:
        q = q.filter(Job.status == status_filter)
    jobs = q.order_by(Job.created_at.desc()).all()
    return [_job_out(j, db) for j in jobs]


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job_code = generate_job_code()
    while db.query(Job).filter(Job.job_code == job_code).first():
        job_code = generate_job_code()

    job = Job(
        job_code=job_code,
        user_id=current_user.id,
        client_id=current_user.client_id,
        title=payload.title.strip(),
        department=payload.department,
        location=payload.location,
        employment_type=payload.employment_type,
        experience=payload.experience,
        description=payload.description,
        skills=payload.skills,
        responsibilities=payload.responsibilities,
        qualifications=payload.qualifications,
        status=payload.status or "Published",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _job_out(job, db)


@router.get("/{job_id}", response_model=JobOut)
def get_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_out(job, db)


@router.get("/{job_id}/requirements", response_model=JobRequirementOut)
def get_job_requirements(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Authenticated client view of job requirements used for screening."""
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobRequirementOut(
        job_id=job.id,
        job_code=job.job_code,
        client_id=job.client_id,
        title=job.title,
        description=job.description,
        skills=job.skills,
        responsibilities=job.responsibilities,
        qualifications=job.qualifications,
        experience=job.experience,
        location=job.location,
        employment_type=job.employment_type,
        department=job.department,
    )


@router.patch("/{job_id}", response_model=JobOut)
def update_job(
    job_id: str,
    payload: JobUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    data = payload.model_dump(exclude_unset=True)
    if "employmentType" in data:
        job.employment_type = data.pop("employmentType")
    for key, value in data.items():
        setattr(job, key, value)

    db.commit()
    db.refresh(job)
    return _job_out(job, db)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return None
