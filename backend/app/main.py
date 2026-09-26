from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import get_settings
from app.database import Base, get_engine
from app import models  # noqa: F401 — register ORM models
from app.routers import auth, jobs, screening, internal

logger = logging.getLogger("hireai")
settings = get_settings()


def _ensure_candidate_storage_columns() -> None:
    """Add resume/profile columns to candidates if missing (Postgres)."""
    statements = [
        "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS file_path TEXT",
        "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS resume_url TEXT",
        "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills JSONB",
        "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS education JSONB",
        "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS experience_history JSONB",
    ]
    with get_engine().begin() as conn:
        for sql in statements:
            try:
                conn.execute(text(sql))
            except Exception:
                # sqlite / older engines may not support IF NOT EXISTS the same way
                pass


def _init_db() -> None:
    Base.metadata.create_all(bind=get_engine())
    _ensure_candidate_storage_columns()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Never crash the whole ASGI app on DB warmup — that surfaces as a blank
    # FUNCTION_INVOCATION_FAILED / fake CORS error on Vercel.
    try:
        _init_db()
    except Exception:
        logger.exception("Database init failed; API will start and retry on requests")
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="HireAI Dashboard API — Auth, Jobs, Screening orchestration with n8n",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    # Production + preview: https://ai-hire-9or8.vercel.app, https://ai-hire-9or8-git-....vercel.app
    allow_origin_regex=r"https://ai-hire-9or8([\w-]*)\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(screening.router)
app.include_router(internal.router)


@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "status": "ok",
        "docs": "/docs",
        "flow": [
            "POST /api/auth/register",
            "POST /api/auth/login",
            "POST /api/jobs",
            "POST /api/screening/upload (job_id + resumes) → n8n webhook",
            "GET /api/internal/jobs/{job_id}/requirements (n8n)",
            "POST /api/internal/screening-results (n8n)",
            "GET /api/candidates",
        ],
    }


@app.get("/health")
def health():
    db_ok = False
    db_error = None
    try:
        with get_engine().connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception as exc:
        db_error = str(exc)[:300]
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "ok" if db_ok else "error",
        "database_error": db_error,
    }
