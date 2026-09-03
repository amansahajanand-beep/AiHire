from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user
from app.models import Candidate, Job, User
from app.schemas import (
    CandidateOut,
    CandidateWorkflowUpdate,
    DashboardTotals,
    UploadResponse,
)

router = APIRouter(prefix="/api", tags=["Screening & Candidates"])
settings = get_settings()


def _candidate_out(c: Candidate, job_title: str | None = None) -> CandidateOut:
    return CandidateOut(
        id=c.id,
        job_id=c.job_id,
        client_id=c.client_id,
        name=c.name,
        email=c.email,
        phone=c.phone,
        job=job_title,
        score=c.score,
        status=c.status,
        screening_status=c.screening_status,
        resume_filename=c.resume_filename,
        strengths=c.strengths,
        weaknesses=c.weaknesses,
        breakdown=c.breakdown,
        remarks=c.remarks,
        risk=c.risk,
        human_evaluation=c.human_evaluation,
        human_note=c.human_note,
        availability=c.availability,
        screened_on=c.screened_on,
        created_at=c.created_at,
    )


@router.get("/dashboard/totals", response_model=DashboardTotals)
def dashboard_totals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    jobs_count = db.query(func.count(Job.id)).filter(Job.user_id == current_user.id).scalar() or 0
    screened = (
        db.query(func.count(Candidate.id))
        .filter(Candidate.user_id == current_user.id, Candidate.screening_status == "completed")
        .scalar()
        or 0
    )
    awaiting = (
        db.query(func.count(Candidate.id))
        .filter(
            Candidate.user_id == current_user.id,
            Candidate.status.in_(["Pending", "Human Review", "Review"]),
        )
        .scalar()
        or 0
    )
    avg = (
        db.query(func.avg(Candidate.score))
        .filter(Candidate.user_id == current_user.id, Candidate.score.isnot(None))
        .scalar()
    )
    return DashboardTotals(
        jobsAdded=int(jobs_count),
        candidatesScreened=int(screened),
        awaitingReview=int(awaiting),
        averageMatchScore=round(float(avg or 0), 1),
    )


@router.get("/candidates", response_model=list[CandidateOut])
def list_candidates(
    job_id: str | None = None,
    status_filter: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Candidate).filter(Candidate.user_id == current_user.id)
    if job_id:
        q = q.filter(Candidate.job_id == job_id)
    if status_filter and status_filter.lower() != "all":
        q = q.filter(Candidate.status == status_filter)

    rows = q.order_by(Candidate.created_at.desc()).all()
    job_map = {
        j.id: j.title
        for j in db.query(Job).filter(Job.user_id == current_user.id).all()
    }
    return [_candidate_out(c, job_map.get(c.job_id)) for c in rows]


@router.get("/candidates/{candidate_id}", response_model=CandidateOut)
def get_candidate(
    candidate_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    c = (
        db.query(Candidate)
        .filter(Candidate.id == candidate_id, Candidate.user_id == current_user.id)
        .first()
    )
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    job = db.get(Job, c.job_id)
    return _candidate_out(c, job.title if job else None)


@router.patch("/candidates/{candidate_id}/workflow", response_model=CandidateOut)
def update_candidate_workflow(
    candidate_id: str,
    payload: CandidateWorkflowUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    c = (
        db.query(Candidate)
        .filter(Candidate.id == candidate_id, Candidate.user_id == current_user.id)
        .first()
    )
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    eval_value = payload.humanEvaluation or payload.human_evaluation
    note_value = payload.humanNote or payload.human_note
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
    return _candidate_out(c, job.title if job else None)


@router.post("/screening/upload", response_model=UploadResponse)
async def upload_resumes_for_screening(
    job_id: str = Form(...),
    files: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Client must select Job before uploading.
    Dashboard stores queued candidates, then POSTs Client ID + Job ID + resumes to n8n.
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

        uploaded_meta.append(
            {
                "candidate_id": candidate.id,
                "resume_filename": filename,
                "size": len(content),
            }
        )
        multipart_files.append(
            ("files", (filename, content, f.content_type or "application/pdf"))
        )

    db.commit()

    # Always forward to the REAL n8n resume-upload webhook
    n8n_status = "calling"
    n8n_response = None
    form_data = {
        "client_id": current_user.client_id,
        "job_id": job.id,
        "job_code": job.job_code,
        "job_title": job.title,
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Also send candidate_ids so n8n can write results back against dashboard rows
            form_data["candidate_ids"] = ",".join(item["candidate_id"] for item in uploaded_meta)
            resp = await client.post(
                settings.n8n_resume_webhook_url,
                data=form_data,
                files=multipart_files,
            )
            n8n_status = f"http_{resp.status_code}"
            try:
                n8n_response = resp.json()
            except Exception:
                n8n_response = {"raw": resp.text[:2000]}

            # If n8n already returned inline results, persist them
            if resp.is_success and isinstance(n8n_response, dict):
                results = n8n_response.get("results") or n8n_response.get("candidates") or []
                if isinstance(results, list):
                    for item in results:
                        cid = item.get("candidate_id")
                        if not cid:
                            continue
                        c = db.get(Candidate, cid)
                        if not c or c.user_id != current_user.id:
                            continue
                        c.name = item.get("name") or c.name
                        c.email = item.get("email") or c.email
                        c.score = item.get("score")
                        c.status = item.get("status") or c.status
                        c.strengths = item.get("strengths")
                        c.weaknesses = item.get("weaknesses")
                        c.breakdown = item.get("breakdown")
                        c.remarks = item.get("remarks")
                        c.risk = item.get("risk")
                        c.raw_result = item
                        c.screening_status = "completed"
                        c.screened_on = datetime.utcnow()
                    db.commit()
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
        message="Resumes accepted and sent for AI screening",
        client_id=current_user.client_id,
        job_id=job.id,
        job_code=job.job_code,
        uploaded=uploaded_meta,
        n8n_status=n8n_status,
        n8n_response=n8n_response,
    )
