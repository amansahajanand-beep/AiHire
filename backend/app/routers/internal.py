from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_n8n_api_key
from app.models import Candidate, Job, User
from app.schemas import JobRequirementOut, ScreeningResultIn, CandidateOut

router = APIRouter(prefix="/api/internal", tags=["n8n Internal"])


@router.get(
    "/jobs/{job_id}/requirements",
    response_model=JobRequirementOut,
    dependencies=[Depends(require_n8n_api_key)],
)
def n8n_get_job_requirements(job_id: str, db: Session = Depends(get_db)):
    """
    n8n calls this after resume-upload webhook to fetch Job Title + Description + Requirements
    using Job ID (and validates client ownership via returned client_id).
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        # also allow lookup by job_code
        job = db.query(Job).filter(Job.job_code == job_id).first()
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


@router.post(
    "/screening-results",
    response_model=CandidateOut,
    dependencies=[Depends(require_n8n_api_key)],
)
def n8n_save_screening_result(payload: ScreeningResultIn, db: Session = Depends(get_db)):
    """
    n8n posts LLM screening result back into dashboard DB.
    Prefer updating an existing candidate_id created at upload time.
    """
    job = db.query(Job).filter(Job.id == payload.job_id, Job.client_id == payload.client_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found for this client_id")

    user = db.query(User).filter(User.client_id == payload.client_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Client not found")

    candidate = None
    if payload.candidate_id:
        candidate = (
            db.query(Candidate)
            .filter(
                Candidate.id == payload.candidate_id,
                Candidate.client_id == payload.client_id,
                Candidate.job_id == job.id,
            )
            .first()
        )

    if not candidate:
        candidate = Candidate(
            user_id=user.id,
            client_id=payload.client_id,
            job_id=job.id,
        )
        db.add(candidate)

    candidate.name = payload.name or candidate.name
    candidate.email = payload.email or candidate.email
    candidate.phone = payload.phone or candidate.phone
    candidate.resume_filename = payload.resume_filename or candidate.resume_filename
    candidate.score = payload.score
    candidate.status = payload.status or candidate.status or "Pending"
    candidate.strengths = payload.strengths
    candidate.weaknesses = payload.weaknesses
    candidate.breakdown = payload.breakdown
    candidate.remarks = payload.remarks
    candidate.risk = payload.risk
    candidate.raw_result = payload.raw_result
    candidate.screening_status = payload.screening_status or "completed"
    candidate.screened_on = datetime.utcnow()

    db.commit()
    db.refresh(candidate)

    return CandidateOut(
        id=candidate.id,
        job_id=candidate.job_id,
        client_id=candidate.client_id,
        name=candidate.name,
        email=candidate.email,
        phone=candidate.phone,
        job=job.title,
        score=candidate.score,
        status=candidate.status,
        screening_status=candidate.screening_status,
        resume_filename=candidate.resume_filename,
        strengths=candidate.strengths,
        weaknesses=candidate.weaknesses,
        breakdown=candidate.breakdown,
        remarks=candidate.remarks,
        risk=candidate.risk,
        human_evaluation=candidate.human_evaluation,
        human_note=candidate.human_note,
        availability=candidate.availability,
        screened_on=candidate.screened_on,
        created_at=candidate.created_at,
    )
