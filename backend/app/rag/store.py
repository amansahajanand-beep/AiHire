"""pgvector storage + similarity search (Postgres only; every helper is a no-op on SQLite).

Resume sets are tiny (a few dozen chunks per candidate), so searches use an exact scan filtered by
candidate_id / job_id. An approximate HNSW index would only add the risk of missing rows under a filter.
"""

from __future__ import annotations

import json
import logging

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_engine

logger = logging.getLogger("hireai.rag")


def _is_postgres(db: Session) -> bool:
    return db.get_bind().dialect.name == "postgresql"


def _vec(values: list[float]) -> str:
    return "[" + ",".join(f"{v:.6f}" for v in values) + "]"


def ensure_tables() -> None:
    """Called at startup. Safe to run repeatedly; skipped silently if pgvector is unavailable."""
    engine = get_engine()
    if engine.dialect.name != "postgresql":
        return
    dim = int(get_settings().embed_dim)
    statements = [
        "CREATE EXTENSION IF NOT EXISTS vector",
        f"""CREATE TABLE IF NOT EXISTS job_chunks (
            id BIGSERIAL PRIMARY KEY,
            client_id TEXT,
            job_id VARCHAR(36) NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
            section TEXT NOT NULL,
            content TEXT NOT NULL,
            embedding vector({dim}) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now())""",
        "CREATE INDEX IF NOT EXISTS job_chunks_job_idx ON job_chunks (job_id)",
        f"""CREATE TABLE IF NOT EXISTS resume_chunks (
            id BIGSERIAL PRIMARY KEY,
            client_id TEXT,
            candidate_id VARCHAR(36) NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
            section TEXT NOT NULL,
            content TEXT NOT NULL,
            embedding vector({dim}) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now())""",
        "CREATE INDEX IF NOT EXISTS resume_chunks_candidate_idx ON resume_chunks (candidate_id)",
        # Parsed once, reused for every job: the parsed resume per distinct file, and the parsed job per job.
        """CREATE TABLE IF NOT EXISTS resume_profiles (
            client_id TEXT NOT NULL,
            content_hash TEXT NOT NULL,
            parsed JSONB NOT NULL,
            source_candidate_id VARCHAR(36),
            created_at TIMESTAMPTZ DEFAULT now(),
            PRIMARY KEY (client_id, content_hash))""",
        """CREATE TABLE IF NOT EXISTS job_profiles (
            job_id VARCHAR(36) PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
            parsed JSONB NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT now())""",
    ]
    with engine.begin() as conn:
        for sql in statements:
            try:
                conn.execute(text(sql))
            except Exception:  # noqa: BLE001
                logger.warning("pgvector setup step failed: %s", sql.split("\n")[0][:80], exc_info=True)


def _replace(db: Session, table: str, owner_col: str, owner_id: str, client_id: str | None, rows) -> int:
    db.execute(text(f"DELETE FROM {table} WHERE {owner_col} = :o"), {"o": owner_id})
    for section, content, vector in rows:
        db.execute(
            text(
                f"INSERT INTO {table} (client_id, {owner_col}, section, content, embedding) "
                "VALUES (:c, :o, :s, :t, CAST(:e AS vector))"
            ),
            {"c": client_id, "o": owner_id, "s": section, "t": content, "e": _vec(vector)},
        )
    db.commit()
    return len(rows)


def replace_job_chunks(db: Session, job_id: str, client_id: str | None, rows) -> int:
    """rows = [(section, content, vector)]; replaces every chunk of the job."""
    if not _is_postgres(db):
        return 0
    return _replace(db, "job_chunks", "job_id", job_id, client_id, rows)


def replace_resume_chunks(db: Session, candidate_id: str, client_id: str | None, rows) -> int:
    if not _is_postgres(db):
        return 0
    return _replace(db, "resume_chunks", "candidate_id", candidate_id, client_id, rows)


def job_has_chunks(db: Session, job_id: str) -> bool:
    if not _is_postgres(db):
        return False
    return bool(db.execute(text("SELECT 1 FROM job_chunks WHERE job_id = :j LIMIT 1"), {"j": job_id}).first())


def match_job_to_resume(db: Session, job_id: str, candidate_id: str, top_k: int = 3) -> list[dict]:
    """For every job chunk, the top_k most similar chunks of this resume (cosine similarity, via pgvector).

    Returns [{section, content, matches: [{section, content, sim}]}] in job-chunk order.
    """
    rows = db.execute(
        text(
            """
            SELECT j.id AS jid, j.section AS jsection, j.content AS jcontent,
                   m.section AS rsection, m.content AS rcontent, m.sim AS sim
            FROM job_chunks j
            CROSS JOIN LATERAL (
                SELECT r.section, r.content, 1 - (r.embedding <=> j.embedding) AS sim
                FROM resume_chunks r
                WHERE r.candidate_id = :c
                ORDER BY r.embedding <=> j.embedding
                LIMIT :k
            ) m
            WHERE j.job_id = :j
            ORDER BY j.id, m.sim DESC
            """
        ),
        {"c": candidate_id, "j": job_id, "k": top_k},
    ).all()
    out: dict[int, dict] = {}
    for r in rows:
        item = out.setdefault(r.jid, {"section": r.jsection, "content": r.jcontent, "matches": []})
        item["matches"].append({"section": r.rsection, "content": r.rcontent, "sim": float(r.sim)})
    return list(out.values())


# ---- parse-once caches -------------------------------------------------------------------------

def get_resume_profile(db: Session, client_id: str | None, content_hash: str) -> tuple[dict, str | None] | None:
    """The already-parsed resume for this exact file (and the candidate whose vectors hold it), if any."""
    if not _is_postgres(db):
        return None
    row = db.execute(
        text("SELECT parsed, source_candidate_id FROM resume_profiles WHERE client_id = :c AND content_hash = :h"),
        {"c": client_id, "h": content_hash},
    ).first()
    return (row.parsed, row.source_candidate_id) if row else None


def save_resume_profile(db: Session, client_id: str | None, content_hash: str, parsed: dict, candidate_id: str) -> None:
    if not _is_postgres(db):
        return
    db.execute(
        text(
            "INSERT INTO resume_profiles (client_id, content_hash, parsed, source_candidate_id) "
            "VALUES (:c, :h, CAST(:p AS jsonb), :s) "
            "ON CONFLICT (client_id, content_hash) DO UPDATE SET parsed = EXCLUDED.parsed, "
            "source_candidate_id = EXCLUDED.source_candidate_id"
        ),
        {"c": client_id, "h": content_hash, "p": json.dumps(parsed), "s": candidate_id},
    )
    db.commit()


def resume_chunk_count(db: Session, candidate_id: str) -> int:
    if not _is_postgres(db):
        return 0
    return db.execute(
        text("SELECT count(*) FROM resume_chunks WHERE candidate_id = :c"), {"c": candidate_id}
    ).scalar() or 0


def copy_resume_chunks(db: Session, from_candidate: str, to_candidate: str, client_id: str | None) -> int:
    """Give a new candidate row the vectors of an already-embedded identical resume (no Gemini call)."""
    if not _is_postgres(db) or from_candidate == to_candidate:
        return 0
    db.execute(text("DELETE FROM resume_chunks WHERE candidate_id = :t"), {"t": to_candidate})
    result = db.execute(
        text(
            "INSERT INTO resume_chunks (client_id, candidate_id, section, content, embedding) "
            "SELECT :c, :t, section, content, embedding FROM resume_chunks WHERE candidate_id = :f"
        ),
        {"c": client_id, "t": to_candidate, "f": from_candidate},
    )
    db.commit()
    return result.rowcount or 0


def save_job_profile(db: Session, job_id: str, parsed: dict) -> None:
    if not _is_postgres(db):
        return
    db.execute(
        text(
            "INSERT INTO job_profiles (job_id, parsed) VALUES (:j, CAST(:p AS jsonb)) "
            "ON CONFLICT (job_id) DO UPDATE SET parsed = EXCLUDED.parsed, updated_at = now()"
        ),
        {"j": job_id, "p": json.dumps(parsed)},
    )
    db.commit()


def get_job_profile(db: Session, job_id: str) -> dict | None:
    if not _is_postgres(db):
        return None
    row = db.execute(text("SELECT parsed FROM job_profiles WHERE job_id = :j"), {"j": job_id}).first()
    return row.parsed if row else None
