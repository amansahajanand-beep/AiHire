from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_n8n_api_key
from app.models import Candidate, Job, ScreenedProfile, User
from app.schemas import CandidateOut, JobRequirementOut, ScreeningResultIn
from app.screening_profiles import (
    apply_screening_payload,
    build_profile_details,
    parse_score_value,
    screened_to_candidate_dict,
)

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
    n8n posts LLM screening result into Screened profile_Multitenent Profile screening.
    """
    data = payload.as_profile_payload()
    client_id = data.get("client_id")
    if not client_id:
        raise HTTPException(status_code=400, detail="client_id is required")

    user = db.query(User).filter(User.client_id == client_id).first()

    job = None
    if payload.job_id:
        job = db.query(Job).filter(Job.id == payload.job_id, Job.client_id == client_id).first()
    if not job and data.get("job_code"):
        job = db.query(Job).filter(Job.job_code == data["job_code"], Job.client_id == client_id).first()
    if job and not data.get("job_code"):
        data["job_code"] = job.job_code
    if job and not data.get("applied_role"):
        data["applied_role"] = job.title

    profile = None
    if payload.row_id:
        profile = db.query(ScreenedProfile).filter(ScreenedProfile.row_id == payload.row_id).first()

    if not profile:
        profile = ScreenedProfile()
        db.add(profile)

    if not data.get("timestamp"):
        data["timestamp"] = datetime.utcnow().isoformat()

    apply_screening_payload(profile, data)
    db.commit()
    db.refresh(profile)

    # Mark matching queued Candidate as completed when candidate_id provided
    if payload.candidate_id:
        candidate = db.query(Candidate).filter(Candidate.id == payload.candidate_id).first()
        if candidate:
            candidate.screening_status = payload.screening_status or "completed"
            candidate.name = profile.candidate_name or candidate.name
            candidate.email = profile.email or candidate.email
            candidate.phone = profile.mobile_number or candidate.phone
            candidate.score = parse_score_value(profile.total_score)
            candidate.risk = profile.risk_flag
            candidate.remarks = profile.summary
            candidate.status = profile.my_recommendation or candidate.status
            candidate.screened_on = datetime.utcnow()
            # Prefer already-stored bucket path/url from upload time
            if not profile.file_path and candidate.file_path:
                profile.file_path = candidate.file_path
            if not profile.resume_url and candidate.resume_url:
                profile.resume_url = candidate.resume_url
            if candidate.file_path is None and profile.file_path:
                candidate.file_path = profile.file_path
            if candidate.resume_url is None and profile.resume_url:
                candidate.resume_url = profile.resume_url

            details = build_profile_details(
                summary=profile.summary,
                growth_pattern=profile.growth_pattern,
                applied_role=profile.applied_role,
                payload=data,
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
            existing_raw = candidate.raw_result if isinstance(candidate.raw_result, dict) else {}
            candidate.raw_result = {**existing_raw, **data}

            db.commit()
            db.refresh(profile)

    out = screened_to_candidate_dict(profile, job.title if job else None)
    if job:
        out["job_id"] = job.id
        out["job"] = job.title
    if user and not out.get("client_id"):
        out["client_id"] = user.client_id
    # Prefer structured details just saved on the candidate row
    if payload.candidate_id:
        candidate = db.query(Candidate).filter(Candidate.id == payload.candidate_id).first()
        if candidate:
            if candidate.skills:
                out["skills"] = candidate.skills
            if candidate.education:
                out["education"] = candidate.education
            if candidate.experience_history:
                out["experience_history"] = candidate.experience_history
    return CandidateOut(**out)
