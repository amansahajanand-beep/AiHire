"""Embed every existing job for RAG screening (run once after enabling it).

    cd backend
    python scripts/backfill_job_embeddings.py            # only jobs without vectors
    python scripts/backfill_job_embeddings.py --all      # rebuild every job
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal  # noqa: E402
from app.models import Job  # noqa: E402
from app.rag import pipeline, store  # noqa: E402


def main() -> None:
    rebuild_all = "--all" in sys.argv
    store.ensure_tables()
    db = SessionLocal()
    try:
        jobs = db.query(Job).order_by(Job.created_at).all()
        done = skipped = failed = 0
        for job in jobs:
            if not rebuild_all and store.job_has_chunks(db, job.id):
                skipped += 1
                continue
            try:
                count = pipeline.index_job(db, job)
                print(f"{job.job_code}  {job.title}: {count} chunks")
                done += 1
            except Exception as exc:  # noqa: BLE001
                db.rollback()
                print(f"{job.job_code}  {job.title}: FAILED ({type(exc).__name__}: {exc})")
                failed += 1
        print(f"\nindexed {done}, skipped {skipped}, failed {failed}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
