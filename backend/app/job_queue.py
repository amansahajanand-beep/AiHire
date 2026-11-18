"""Upstash QStash: publish one message per resume and verify the signature on delivery.

QStash calls POST {BACKEND_PUBLIC_URL}/api/internal/screen-resume with retries, so every resume runs in its
own function invocation and survives a timeout or a transient Gemini / database error.
"""

from __future__ import annotations

import base64
import hashlib
import logging

import httpx
from jose import JWTError, jwt

from app.config import get_settings

logger = logging.getLogger("hireai.queue")

WORKER_PATH = "/api/internal/screen-resume"
MAX_RETRIES = 3


def configured() -> bool:
    s = get_settings()
    return bool(s.qstash_token.strip() and s.backend_public_url.strip())


def worker_url() -> str:
    return get_settings().backend_public_url.strip().rstrip("/") + WORKER_PATH


def publish_screening(candidate_id: str) -> None:
    """Queue one resume. Raises httpx.HTTPError if QStash rejects or is unreachable."""
    s = get_settings()
    resp = httpx.post(
        f"{s.qstash_url.rstrip('/')}/v2/publish/{worker_url()}",
        headers={
            "Authorization": f"Bearer {s.qstash_token.strip()}",
            "Content-Type": "application/json",
            "Upstash-Retries": str(MAX_RETRIES),
        },
        json={"candidate_id": candidate_id},
        timeout=15.0,
    )
    resp.raise_for_status()


def verify_signature(signature: str | None, body: bytes) -> bool:
    """Check Upstash-Signature (a JWT signed with the current or next signing key) against url and body."""
    if not signature:
        return False
    s = get_settings()
    body_hash = base64.urlsafe_b64encode(hashlib.sha256(body).digest()).decode().rstrip("=")
    for key in (s.qstash_current_signing_key.strip(), s.qstash_next_signing_key.strip()):
        if not key:
            continue
        try:
            claims = jwt.decode(
                signature,
                key,
                algorithms=["HS256"],
                issuer="Upstash",
                options={"verify_aud": False, "verify_sub": False},
            )
        except JWTError:
            continue
        if claims.get("sub") == worker_url() and str(claims.get("body", "")).rstrip("=") == body_hash:
            return True
    return False
