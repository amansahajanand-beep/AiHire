"""
Vercel / local ASGI entrypoint.

Vercel FastAPI runtime looks for `app` in main.py (project root = backend/).
Keeping this file thin avoids import-time DB crashes blocking discovery.
"""

from app.main import app  # noqa: F401
