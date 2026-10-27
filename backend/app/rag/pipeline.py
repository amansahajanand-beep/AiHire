"""RAG screening pipeline.

index_job(job)            parse the job, embed its requirement chunks, store them in pgvector
screen_candidate(id)      parse + embed one resume, score it by vector similarity, write the report row

The payload written to the Screened profile table keeps the exact formats the original flow produced
(scores as "x/max", newline-joined lists, bulleted risk flags), so every existing page and the PDF
report read it unchanged.
"""

from __future__ import annotations

import hashlib
import logging
import time
import uuid
from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from app.cache import invalidate_client
from app.models import Candidate, Job, ScreenedProfile
from app.rag import chunking, gemini, parsing, report, scoring, store
from app.screening_profiles import apply_screening_payload
from app.storage import download_resume_bytes

logger = logging.getLogger("hireai.rag")


class PermanentScreeningError(RuntimeError):
    """The resume or job cannot be processed (retrying will not help)."""


def index_job(db: Session, job: Job) -> int:
    """(Re)build the job's requirement vectors. Returns the number of chunks stored."""
    parsed = parsing.parse_job(job)
    chunks = chunking.job_chunks(job.title, parsed)
    if not chunks:
        return 0
    vectors = gemini.embed_texts([c for _, c in chunks], task_type="RETRIEVAL_QUERY")
    rows = [(section, content, vec) for (section, content), vec in zip(chunks, vectors)]
    count = store.replace_job_chunks(db, job.id, job.client_id, rows)
    store.save_job_profile(db, job.id, parsed)  # screening reads this instead of re-parsing the job
    return count


def _fmt_experience(parsed_resume: dict) -> str:
    lines = []
    for e in parsed_resume.get("experience") or []:
        duration = " - ".join(x for x in (e.get("start"), e.get("end")) if x)
        lines.append(f"{e['company']} | {e['designation']} | {duration} | {e['summary']}")
    return "\n".join(lines)


def _build_payload(job: Job, candidate: Candidate, parsed_resume: dict, scores: dict, rep: dict) -> dict:
    return {
        "client_id": candidate.client_id,
        "job_code": job.job_code,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "candidate_name": parsed_resume["candidate_name"] or candidate.name,
        "applied_role": parsed_resume["applied_role"] or job.title,
        "mobile_number": parsed_resume["phone"],
        "email": parsed_resume["email"],
        "current_location": parsed_resume["location"] or "Not Available",
        "experience_score": f"{scores['experience']}/{scoring.MAX_EXPERIENCE}",
        "skill_score": f"{scores['skills']}/{scoring.MAX_SKILLS}",
        "stability_score": f"{scores['stability']}/{scoring.MAX_STABILITY}",
        "education_score": f"{scores['education']}/{scoring.MAX_EDUCATION}",
        "total_score": scores["total"],
        "growth_pattern": rep["career_progression"],
        "risk_flag": "\n".join(f"• {r}" for r in rep["risk_flags"]),
        "my_recommendation": scores["recommendation"],
        "summary": rep["candidate_summary"],
        "interview_questions": "\n".join(rep["interview_questions"]),
        "ai_confidence": rep["ai_confidence"],
        "file_path": candidate.file_path,
        "resume_url": candidate.resume_url,
        "experience": _fmt_experience(parsed_resume),
        "education": "\n".join(parsed_resume["education"]),
        "skills": ", ".join(parsed_resume["skills"]),
        "strengths": "\n".join(rep["strengths"]),
    }


def screen_candidate(db: Session, candidate_id: str) -> dict:
    """Run the whole pipeline for one uploaded resume. Raises PermanentScreeningError for unusable input;
    any other exception is treated as transient by the caller."""
    from app.routers.screening import _mark_candidate_screened  # lazy: avoids a circular import

    started = time.monotonic()
    gemini.reset_usage()
    candidate = db.get(Candidate, candidate_id)
    if candidate is None:
        raise PermanentScreeningError("Candidate not found")
    if candidate.screening_status == "completed":
        return {"status": "already_completed"}  # queue redelivery
    job = db.get(Job, candidate.job_id)
    if job is None:
        raise PermanentScreeningError("Job not found")
    if not candidate.file_path:
        raise PermanentScreeningError("Resume file is missing")

    candidate.screening_status = "processing"
    db.commit()
    today = date.today()

    # 1. read the file; its hash tells us whether this exact resume was already parsed (for any job)
    data = download_resume_bytes(candidate.file_path)
    content_hash = hashlib.sha256(data).hexdigest()

    # 2. job vectors + parsed requirements are built once per job (on create / edit)
    if not store.job_has_chunks(db, job.id):
        index_job(db, job)
    parsed_job = store.get_job_profile(db, job.id) or parsing.parse_job(job)

    # 3. parse + embed the resume ONCE; the same resume used for another job reuses it
    reused = False
    cached = store.get_resume_profile(db, candidate.client_id, content_hash)
    if cached is not None:
        parsed_resume, source_id = cached
        if store.resume_chunk_count(db, candidate.id) > 0:
            reused = True  # a retry of this same candidate: its vectors are already stored
        elif source_id and store.copy_resume_chunks(db, source_id, candidate.id, candidate.client_id) > 0:
            reused = True
        else:
            # the first candidate (and its vectors) was deleted: re-embed from the parsed profile, no re-parse
            chunks = chunking.resume_chunks(parsed_resume)
            vectors = gemini.embed_texts([c for _, c in chunks], task_type="RETRIEVAL_DOCUMENT")
            store.replace_resume_chunks(
                db, candidate.id, candidate.client_id, [(s, c, v) for (s, c), v in zip(chunks, vectors)]
            )
            store.save_resume_profile(db, candidate.client_id, content_hash, parsed_resume, candidate.id)
    else:
        try:
            text = parsing.extract_text(candidate.resume_filename or candidate.file_path, data)
        except ValueError as exc:
            raise PermanentScreeningError(str(exc)) from exc
        parsed_resume = parsing.parse_resume(text, today)
        chunks = chunking.resume_chunks(parsed_resume)
        if not chunks:
            raise PermanentScreeningError("Nothing could be extracted from this resume")
        vectors = gemini.embed_texts([c for _, c in chunks], task_type="RETRIEVAL_DOCUMENT")
        store.replace_resume_chunks(
            db, candidate.id, candidate.client_id, [(s, c, v) for (s, c), v in zip(chunks, vectors)]
        )
        store.save_resume_profile(db, candidate.client_id, content_hash, parsed_resume, candidate.id)

    # 4. similarity search + scoring (deterministic)
    matches = store.match_job_to_resume(db, job.id, candidate.id)
    scores = scoring.score_candidate(matches, parsed_job, parsed_resume, today)

    # 5. grounded report text
    rep = report.generate_report(job, parsed_job, parsed_resume, scores, today)

    # 6. write the report row (reusing the row on a retry) and finish the candidate
    payload = _build_payload(job, candidate, parsed_resume, scores, rep)
    raw = candidate.raw_result if isinstance(candidate.raw_result, dict) else {}
    row = db.get(ScreenedProfile, raw["profile_row_id"]) if raw.get("profile_row_id") else None
    if row is None:
        row = ScreenedProfile(row_id=str(uuid.uuid4()))
        db.add(row)
    apply_screening_payload(row, payload)
    candidate.raw_result = {
        **payload,
        "engine": "rag",
        "resume_reused": reused,
        "token_usage": gemini.get_usage(),
        "resume_hash": content_hash,
        "profile_row_id": row.row_id,
        "years_experience": scores["years_experience"],
        "stability_note": scores["stability_note"],
        "skill_evidence": scores["skill_evidence"],
        "experience_evidence": scores["experience_evidence"],
        "education_evidence": scores["education_evidence"],
    }
    _mark_candidate_screened(candidate, ended_at=datetime.utcnow(), profile=row, payload=payload)
    db.commit()
    invalidate_client(candidate.client_id)
    logger.info("Screened %s in %.1fs: total %s (resume %s) tokens %s", candidate.id, time.monotonic() - started,
                scores["total"], "reused" if reused else "parsed", gemini.get_usage())
    return {"status": "completed", "total": scores["total"]}


def mark_failed(db: Session, candidate_id: str, reason: str) -> None:
    candidate = db.get(Candidate, candidate_id)
    if candidate is None or candidate.screening_status == "completed":
        return
    candidate.screening_status = "failed"
    candidate.remarks = f"Screening failed: {reason}"[:1000]
    db.commit()
    invalidate_client(candidate.client_id)
