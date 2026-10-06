"""
Optional Redis (Upstash) cache. Fail-open by design: with no REDIS_URL, with CACHE_ENABLED=false, or when
Redis is unreachable, every helper quietly does nothing and callers fall back to the database / Supabase.
Used for caching only (not sessions, auth, queues or workers).
"""

import hashlib
import logging
import time
from collections.abc import Callable
from typing import TypeVar

from pydantic import BaseModel

from app.config import get_settings

logger = logging.getLogger("hireai.cache")

T = TypeVar("T", bound=BaseModel)

_client = None
_down_until = 0.0
_COOLDOWN_SECONDS = 15.0  # after a Redis error, skip Redis for a bit instead of paying a timeout per request


def _enabled() -> bool:
    s = get_settings()
    return bool(s.cache_enabled and (s.redis_url or "").strip())


def _fail(exc: Exception) -> None:
    global _down_until
    _down_until = time.monotonic() + _COOLDOWN_SECONDS
    logger.warning("Redis unavailable, falling back to the database (%s)", type(exc).__name__)


def _redis():
    global _client
    if not _enabled() or time.monotonic() < _down_until:
        return None
    if _client is None:
        try:
            import redis  # imported lazily so a missing package can never break startup

            _client = redis.Redis.from_url(
                get_settings().redis_url.strip(),
                socket_connect_timeout=1.5,
                socket_timeout=1.5,
                decode_responses=True,
            )
        except Exception as exc:  # noqa: BLE001
            _fail(exc)
            return None
    return _client


def _key(*parts: str) -> str:
    return get_settings().redis_key_prefix + ":".join(parts)


def cache_get(key: str) -> str | None:
    client = _redis()
    if client is None:
        return None
    try:
        return client.get(key)
    except Exception as exc:  # noqa: BLE001
        _fail(exc)
        return None


def cache_set(key: str, value: str, ttl: int) -> None:
    client = _redis()
    if client is None or ttl <= 0:
        return
    try:
        client.set(key, value, ex=ttl)
    except Exception as exc:  # noqa: BLE001
        _fail(exc)


def ping() -> bool:
    """True when Redis is configured and answering (used by the startup log and health checks)."""
    client = _redis()
    if client is None:
        return False
    try:
        return bool(client.ping())
    except Exception as exc:  # noqa: BLE001
        _fail(exc)
        return False


# ---- Dashboard / activity responses, cached per client_id ---------------------------------------
# Each client has a version counter that is part of every key; bumping it invalidates all of that client's
# cached responses at once (one cheap INCR, no key scanning).

def _client_version(client_id: str) -> str:
    return cache_get(_key("ver", client_id)) or "0"


def invalidate_client(client_id: str | None) -> None:
    """Call after anything that changes a client's dashboard data (uploads, jobs, human review...)."""
    if not client_id:
        return
    client = _redis()
    if client is None:
        return
    try:
        client.incr(_key("ver", client_id))
    except Exception as exc:  # noqa: BLE001
        _fail(exc)


def cached_model(kind: str, client_id: str, model: type[T], compute: Callable[[], T], *, extra: str = "") -> T:
    """Return compute()'s result, served from Redis for CACHE_TTL_DASHBOARD seconds when possible."""
    if not _enabled():
        return compute()
    key = _key("dash", kind, client_id, f"v{_client_version(client_id)}", extra)
    raw = cache_get(key)
    if raw:
        try:
            return model.model_validate_json(raw)
        except Exception:  # noqa: BLE001 - stale/incompatible entry: recompute
            logger.warning("Ignoring unreadable cache entry for %s", kind)
    result = compute()
    try:
        cache_set(key, result.model_dump_json(), get_settings().cache_ttl_dashboard)
    except Exception:  # noqa: BLE001
        pass
    return result


# ---- Signed Supabase resume URLs ---------------------------------------------------------------

def signed_url_get(object_path: str) -> str | None:
    return cache_get(_key("signed", hashlib.sha1(object_path.encode("utf-8")).hexdigest()))


def signed_url_set(object_path: str, url: str) -> None:
    cache_set(
        _key("signed", hashlib.sha1(object_path.encode("utf-8")).hexdigest()),
        url,
        get_settings().cache_ttl_signed_url,
    )
