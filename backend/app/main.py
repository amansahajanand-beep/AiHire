from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_settings
from app.database import Base, get_engine
from app import models  # noqa: F401 — register ORM models
from app.routers import auth, jobs, screening, internal

logger = logging.getLogger("hireai")
settings = get_settings()


def _ensure_candidate_storage_columns() -> None:
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
                pass


def _init_db() -> None:
    Base.metadata.create_all(bind=get_engine())
    _ensure_candidate_storage_columns()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        _init_db()
    except Exception:
        logger.exception("Database init failed at startup")
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
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(_request: Request, exc: SQLAlchemyError):
    logger.exception("Database error: %s", exc)
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Database unavailable. Check DATABASE_URL on Vercel "
            "(must be postgresql://... from Supabase, not an https:// URL).",
            "error": str(exc.__class__.__name__),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)[:400]},
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
