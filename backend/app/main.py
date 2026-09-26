"""
Compatibility shim.

Vercel FastAPI auto-detect looks for app/main.py. Loading that path as a raw
file breaks package imports unless backend/ is on sys.path first.
"""

from __future__ import annotations

import sys
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from app.server import app  # noqa: E402, F401
