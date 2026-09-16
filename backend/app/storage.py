"""Supabase Storage helper for resume uploads (bucket: Resume)."""

from __future__ import annotations

import re
import uuid
from typing import Any

import httpx

from app.config import get_settings


class StorageError(RuntimeError):
    pass


def _headers(content_type: str | None = None) -> dict[str, str]:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise StorageError(
            "Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env"
        )
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
    }
    if content_type:
        headers["Content-Type"] = content_type
    return headers


def _safe_filename(filename: str) -> str:
    name = filename.strip().replace("\\", "_").replace("/", "_")
    name = re.sub(r"[^\w.\- ()+]+", "_", name, flags=re.UNICODE)
    return name[:180] or "resume.pdf"


def build_object_path(client_id: str, job_code: str, candidate_id: str, filename: str) -> str:
    safe = _safe_filename(filename)
    return f"{client_id}/{job_code}/{candidate_id}_{safe}"


def upload_resume_bytes(
    *,
    content: bytes,
    filename: str,
    client_id: str,
    job_code: str,
    candidate_id: str,
    content_type: str | None = None,
) -> dict[str, str]:
    """
    Upload resume to the Resume bucket.
    Returns {file_path, resume_url, bucket}.
    """
    settings = get_settings()
    bucket = settings.supabase_resume_bucket
    object_path = build_object_path(client_id, job_code, candidate_id, filename)
    mime = content_type or _guess_mime(filename)

    url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{bucket}/{object_path}"
    headers = _headers(mime)
    headers["x-upsert"] = "true"

    with httpx.Client(timeout=60.0) as client:
        resp = client.post(url, headers=headers, content=content)
        if resp.status_code >= 400:
            raise StorageError(f"Resume upload failed ({resp.status_code}): {resp.text[:500]}")

    resume_url = create_signed_url(object_path, expires_in=60 * 60 * 24 * 365) or public_object_url(object_path)
    return {
        "bucket": bucket,
        "file_path": object_path,
        "resume_url": resume_url,
    }


def public_object_url(object_path: str) -> str:
    settings = get_settings()
    bucket = settings.supabase_resume_bucket
    return f"{settings.supabase_url.rstrip('/')}/storage/v1/object/public/{bucket}/{object_path}"


def create_signed_url(object_path: str, expires_in: int = 60 * 60 * 24 * 7) -> str | None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None
    bucket = settings.supabase_resume_bucket
    url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/sign/{bucket}/{object_path}"
    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, headers=_headers("application/json"), json={"expiresIn": expires_in})
            if resp.status_code >= 400:
                return None
            data: Any = resp.json()
            signed = data.get("signedURL") or data.get("signedUrl") or data.get("url")
            if not signed:
                return None
            if str(signed).startswith("http"):
                return str(signed)
            return f"{settings.supabase_url.rstrip('/')}/storage/v1{signed}"
    except Exception:
        return None


def refresh_resume_url(file_path: str | None, current_url: str | None = None) -> str | None:
    if not file_path:
        return current_url
    # If file_path looks like a full URL already, keep it
    if str(file_path).startswith("http"):
        return str(file_path)
    signed = create_signed_url(file_path)
    return signed or current_url or public_object_url(file_path)


def _guess_mime(filename: str) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return "application/pdf"
    if lower.endswith(".doc"):
        return "application/msword"
    if lower.endswith(".docx"):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return "application/octet-stream"


def new_upload_id() -> str:
    return str(uuid.uuid4())
