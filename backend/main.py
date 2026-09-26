"""
Vercel / local ASGI entrypoint (service root = backend/).

Adds the backend folder to sys.path so package imports work whether Vercel
loads this file as `main:app` or via framework auto-detect.
"""

from __future__ import annotations

import sys
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

_BOOT_ERROR: str | None = None

try:
    from app.server import app  # noqa: F401
except Exception as exc:  # pragma: no cover
    import traceback

    _BOOT_ERROR = f"{exc.__class__.__name__}: {exc}\n{traceback.format_exc()}"
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI(title="HireAI Boot Error")

    @app.api_route(
        "/{full_path:path}",
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    )
    async def boot_error(full_path: str = ""):
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Backend failed to import. See boot_error.",
                "boot_error": (_BOOT_ERROR or "")[:4000],
            },
        )
