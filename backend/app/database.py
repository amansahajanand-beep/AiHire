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
    raw = (url or "").strip().strip('"').strip("'")
    if raw.upper().startswith("DATABASE_URL="):
        raw = raw.split("=", 1)[1].strip().strip('"').strip("'")
    if not raw:
        return "sqlite:////tmp/hireai.db"
    lower = raw.lower()
    if lower.startswith("http://") or lower.startswith("https://"):
        raise ValueError(
            "DATABASE_URL must be a Postgres URI (postgresql://...), not an https:// URL"
        )
    if raw.startswith("postgres://"):
        raw = "postgresql://" + raw[len("postgres://") :]
    if raw.startswith("sqlite:///./"):
        raw = "sqlite:////tmp/" + raw[len("sqlite:///./") :]
    return raw


def _resolve_database_url() -> str:
    settings = get_settings()
    for candidate in (
        settings.database_url,
        os.getenv("DATABASE_URL", ""),
        os.getenv("POSTGRES_URL", ""),
    ):
        if candidate and str(candidate).strip():
            return _normalize_database_url(str(candidate))
    return _normalize_database_url("")


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    database_url = _resolve_database_url()
    connect_args: dict = {}
    kwargs: dict = {"pool_pre_ping": True}
    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    else:
        kwargs["poolclass"] = NullPool
        connect_args["connect_timeout"] = 15
    logger.info("DB engine ready")
    return create_engine(database_url, connect_args=connect_args, **kwargs)


@lru_cache(maxsize=1)
def _session_factory():
    return sessionmaker(autocommit=False, autoflush=False, bind=get_engine())


class _EngineProxy:
    def __getattr__(self, name):
        return getattr(get_engine(), name)

    def begin(self):
        return get_engine().begin()

    def connect(self):
        return get_engine().connect()


engine = _EngineProxy()


def SessionLocal():
    return _session_factory()()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
