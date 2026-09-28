"""Vercel / local ASGI entrypoint (project root = backend/)."""

import sys
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from app.server import app  # noqa: E402

__all__ = ["app"]
