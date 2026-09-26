"""
Vercel entrypoint for the backend service (root = backend/).

IMPORTANT: Do not put the FastAPI instance in app/main.py — Vercel auto-detects
that path and imports it as a file, which breaks `from app...` package imports
and causes FUNCTION_INVOCATION_FAILED.
"""

from __future__ import annotations

_BOOT_ERROR: str | None = None

try:
    from app.server import app  # noqa: F401
except Exception as exc:  # pragma: no cover - deployed diagnostics only
    import traceback

    _BOOT_ERROR = f"{exc.__class__.__name__}: {exc}\n{traceback.format_exc()}"
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="HireAI Boot Error")

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
    async def boot_error(full_path: str = ""):
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Backend failed to import. See boot_error.",
                "boot_error": _BOOT_ERROR[:4000],
            },
        )
