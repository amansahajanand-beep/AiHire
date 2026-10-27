import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app import job_queue
from app.database import get_db

router = APIRouter(prefix="/api/internal", tags=["Screening Worker"])
logger = logging.getLogger("hireai.worker")


@router.post("/screen-resume")
async def screen_resume(request: Request, db: Session = Depends(get_db)):
    """QStash delivers one message per uploaded resume here. Auth = QStash signature (no JWT / API key).

    200 = done or permanently failed (do not retry); 503 = transient error, QStash redelivers.
    """
    from app.rag import pipeline

    body = await request.body()
    if not job_queue.verify_signature(request.headers.get("Upstash-Signature"), body):
        raise HTTPException(status_code=401, detail="Invalid signature")
    try:
        candidate_id = str(json.loads(body)["candidate_id"])
    except (ValueError, KeyError, TypeError):
        raise HTTPException(status_code=400, detail="candidate_id is required")

    try:
        return await run_in_threadpool(pipeline.screen_candidate, db, candidate_id)
    except pipeline.PermanentScreeningError as exc:
        db.rollback()
        pipeline.mark_failed(db, candidate_id, str(exc))
        return {"status": "failed", "reason": str(exc)}
    except Exception as exc:  # noqa: BLE001 - transient: let QStash retry, give up after the last attempt
        db.rollback()
        logger.exception("Screening %s failed", candidate_id)
        retried = int(request.headers.get("Upstash-Retried", "0") or 0)
        if retried >= job_queue.MAX_RETRIES:
            pipeline.mark_failed(db, candidate_id, f"{type(exc).__name__}: {exc}")
            return {"status": "failed", "reason": str(exc)}
        raise HTTPException(status_code=503, detail="Temporary failure, retrying")
