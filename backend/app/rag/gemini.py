"""Thin Gemini REST client (embeddings + JSON generation) over httpx; no SDK needed."""

from __future__ import annotations

import base64
import json
import math
import re
import threading
import time

import httpx

from app.config import get_settings

_BASE = "https://generativelanguage.googleapis.com/v1beta"
_RETRY_STATUS = {429, 500, 502, 503, 504}
_EMBED_BATCH = 100


class GeminiError(RuntimeError):
    pass


# Token usage of the current screening run (per thread): {"parse_in": .., "parse_out": .., "embed_chars": ..}
_usage = threading.local()


def reset_usage() -> None:
    _usage.data = {}


def get_usage() -> dict:
    return dict(getattr(_usage, "data", {}))


def _track(key: str, amount: int) -> None:
    data = getattr(_usage, "data", None)
    if data is not None:
        data[key] = data.get(key, 0) + int(amount or 0)


def _key() -> str:
    key = get_settings().gemini_api_key.strip()
    if not key:
        raise GeminiError("GEMINI_API_KEY is not set")
    return key


def _post(path: str, body: dict, timeout: float = 90.0, attempts: int = 4) -> dict:
    last = ""
    for attempt in range(attempts):
        try:
            resp = httpx.post(
                f"{_BASE}/{path}",
                headers={"x-goog-api-key": _key(), "Content-Type": "application/json"},
                json=body,
                timeout=timeout,
            )
        except httpx.HTTPError as exc:
            last = f"{type(exc).__name__}: {exc}"
        else:
            if resp.status_code < 400:
                return resp.json()
            last = f"{resp.status_code}: {resp.text[:300]}"
            if resp.status_code not in _RETRY_STATUS:
                break
        time.sleep(1.5 * (2**attempt))
    raise GeminiError(f"Gemini request failed ({last})")


def _normalize(vec: list[float]) -> list[float]:
    # Gemini only returns unit-length vectors at full size; truncated (e.g. 768-d) ones must be normalised.
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]


def embed_texts(texts: list[str], task_type: str = "RETRIEVAL_DOCUMENT") -> list[list[float]]:
    """Embed texts; task_type is RETRIEVAL_QUERY for job requirements, RETRIEVAL_DOCUMENT for resume chunks."""
    settings = get_settings()
    model = settings.gemini_embed_model
    out: list[list[float]] = []
    for i in range(0, len(texts), _EMBED_BATCH):
        batch = texts[i : i + _EMBED_BATCH]
        data = _post(
            f"models/{model}:batchEmbedContents",
            {
                "requests": [
                    {
                        "model": f"models/{model}",
                        "content": {"parts": [{"text": t[:8000]}]},
                        "taskType": task_type,
                        "outputDimensionality": settings.embed_dim,
                    }
                    for t in batch
                ]
            },
        )
        embeddings = data.get("embeddings") or []
        if len(embeddings) != len(batch):
            raise GeminiError("Gemini returned an unexpected number of embeddings")
        _track("embed_chars", sum(len(t[:8000]) for t in batch))
        out.extend(_normalize(e["values"]) for e in embeddings)
    return out


def _generate(parts: list[dict], system: str | None, json_mode: bool, label: str = "llm") -> str:
    body: dict = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {"temperature": 0, "maxOutputTokens": 8192},
    }
    if json_mode:
        body["generationConfig"]["responseMimeType"] = "application/json"
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}
    data = _post(f"models/{get_settings().gemini_chat_model}:generateContent", body, timeout=120.0)
    usage = data.get("usageMetadata") or {}
    _track(f"{label}_in", usage.get("promptTokenCount", 0))
    _track(f"{label}_out", (usage.get("candidatesTokenCount", 0) or 0) + (usage.get("thoughtsTokenCount", 0) or 0))
    try:
        return "".join(p.get("text", "") for p in data["candidates"][0]["content"]["parts"])
    except (KeyError, IndexError, TypeError) as exc:
        raise GeminiError(f"Gemini returned no content: {str(data)[:300]}") from exc


def generate_json(prompt: str, system: str | None = None, label: str = "llm") -> dict:
    text = _generate([{"text": prompt}], system, json_mode=True, label=label).strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
    try:
        value = json.loads(text)
    except json.JSONDecodeError as exc:
        raise GeminiError(f"Gemini returned invalid JSON: {text[:200]}") from exc
    if not isinstance(value, dict):
        raise GeminiError("Gemini JSON was not an object")
    return value


def ocr_pdf(data: bytes) -> str:
    """Read a scanned / image-only PDF with Gemini's multimodal input."""
    parts = [
        {"inline_data": {"mime_type": "application/pdf", "data": base64.b64encode(data).decode()}},
        {"text": "Transcribe all text in this resume exactly as written. Return plain text only."},
    ]
    return _generate(parts, None, json_mode=False, label="ocr").strip()
