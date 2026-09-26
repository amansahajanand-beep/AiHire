from __future__ import annotations

import logging
import os
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool

from app.config import get_settings

logger = logging.getLogger("hireai.db")


class Base(DeclarativeBase):
    pass


def _normalize_database_url(url: str) -> str:
    """
    Clean env-pasted values and map to a SQLAlchemy-compatible URL.
    Common Vercel mistakes: wrapping quotes, pasting an https API URL, relative sqlite.
    """
    raw = (url or "").strip().strip('"').strip("'")
    # Someone pasted "DATABASE_URL=postgresql://..." into the value field
    if raw.upper().startswith("DATABASE_URL="):
        raw = raw.split("=", 1)[1].strip().strip('"').strip("'")

    if not raw:
        return "sqlite:////tmp/hireai.db"

    lower = raw.lower()
    if lower.startswith("http://") or lower.startswith("https://"):
        raise ValueError(
            "DATABASE_URL looks like an HTTP(S) URL. "
            "Use a Postgres connection string, e.g. "
            "postgresql://user:pass@host:5432/postgres?sslmode=require"
        )

    if raw.startswith("postgres://"):
        raw = "postgresql://" + raw[len("postgres://") :]

    # Serverless filesystem is read-only except /tmp
    if raw.startswith("sqlite:///./"):
        raw = "sqlite:////tmp/" + raw[len("sqlite:///./") :]
    elif raw == "sqlite:///./hireai.db":
        raw = "sqlite:////tmp/hireai.db"

    return raw


def _resolve_database_url() -> str:
    settings = get_settings()
    candidates = [
        settings.database_url,
        os.getenv("DATABASE_URL", ""),
        os.getenv("POSTGRES_URL", ""),
        os.getenv("POSTGRES_PRISMA_URL", ""),
        os.getenv("SUPABASE_DB_URL", ""),
    ]
    for candidate in candidates:
        if candidate and str(candidate).strip():
            return _normalize_database_url(str(candidate))
    return _normalize_database_url("")


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    database_url = _resolve_database_url()
    logger.info("Creating DB engine (%s...)", database_url.split("@")[-1][:80])

    connect_args: dict = {}
    kwargs: dict = {"pool_pre_ping": True}

    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    else:
        # Vercel serverless: avoid persistent connection pools
        kwargs["poolclass"] = NullPool
        connect_args["connect_timeout"] = 15

    return create_engine(database_url, connect_args=connect_args, **kwargs)


@lru_cache(maxsize=1)
def get_session_factory():
    return sessionmaker(autocommit=False, autoflush=False, bind=get_engine())


# Back-compat for `from app.database import engine`
class _EngineProxy:
    def __getattr__(self, name):
        return getattr(get_engine(), name)

    def begin(self):
        return get_engine().begin()

    def connect(self):
        return get_engine().connect()

    def dispose(self):
        return get_engine().dispose()


engine = _EngineProxy()


def SessionLocal():
    return get_session_factory()()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
