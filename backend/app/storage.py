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


def normalize_object_path(object_path: str | None) -> str | None:
    """
    Turn stored paths/URLs into a bucket-relative object key.

    Handles common mistakes:
    - leading bucket name duplicated as a folder (Resume/file.pdf)
    - full storage URLs pasted into file_path / resume_url
    """
    if not object_path:
        return None
    path = str(object_path).strip()
    if not path:
        return None

    settings = get_settings()
    bucket = (settings.supabase_resume_bucket or "Resume").strip("/")

    # Full URL → extract object key after /object/{public|sign|authenticated}/{bucket}/
    if path.startswith("http"):
        marker = f"/storage/v1/object/"
        idx = path.find(marker)
        if idx >= 0:
            rest = path[idx + len(marker) :]
            # rest = public|sign|authenticated / bucket / key...
            parts = rest.split("/", 2)
            if len(parts) >= 3:
                path = parts[2].split("?", 1)[0]
            else:
                return path  # unknown shape; keep original URL for caller
        else:
            return path

    path = path.lstrip("/")
    # Strip duplicated bucket prefix: Resume/foo.pdf → foo.pdf
    prefix = f"{bucket}/"
    while path.startswith(prefix):
        path = path[len(prefix) :]
    return path or None


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

    The Resume bucket is private, so resume_url is always a signed URL
    (not /object/public/..., which returns NoSuchBucket for private buckets).
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

    resume_url = create_signed_url(object_path, expires_in=60 * 60 * 24 * 365)
    if not resume_url:
        raise StorageError("Resume uploaded but signed URL could not be created")
    return {
        "bucket": bucket,
        "file_path": object_path,
        "resume_url": resume_url,
    }


def public_object_url(object_path: str) -> str:
    """Build a public object URL. Only works if the bucket is marked public in Supabase."""
    settings = get_settings()
    bucket = settings.supabase_resume_bucket
    key = normalize_object_path(object_path) or object_path
    return f"{settings.supabase_url.rstrip('/')}/storage/v1/object/public/{bucket}/{key}"


def create_signed_url(object_path: str, expires_in: int = 60 * 60 * 24 * 7) -> str | None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None
    bucket = settings.supabase_resume_bucket
    key = normalize_object_path(object_path)
    if not key:
        return None
    url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/sign/{bucket}/{key}"
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
    """
    Prefer a fresh signed URL. Never fall back to /object/public/ for this private bucket —
    that endpoint returns a misleading NoSuchBucket error.
    """
    candidates: list[str] = []
    if file_path:
        candidates.append(str(file_path))
    if current_url:
        candidates.append(str(current_url))

    for raw in candidates:
        key = normalize_object_path(raw)
        if not key:
            continue
        # If normalize left a full http URL (unknown shape), return it as-is only if signed
        if key.startswith("http"):
            if "/object/sign/" in key:
                return key
            # Try to re-sign from a broken public URL path if we can extract it
            continue
        signed = create_signed_url(key)
        if signed:
            return signed

    # Keep an existing signed URL if we could not mint a new one
    if current_url and "/object/sign/" in str(current_url):
        return current_url
    return None


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
