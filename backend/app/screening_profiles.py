"""Helpers for Screened profile_Multitenent Profile screening rows."""

from __future__ import annotations

import json
import re
from datetime import datetime
from typing import Any

from app.models import ScreenedProfile


def parse_score_value(value: Any) -> float | None:
    """Parse '91', '27/100', '26/30' into a 0–100 style float when possible."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip()
    if not s or s.upper() in {"#ERROR!", "N/A", "NA", "NONE"}:
        return None
    if "/" in s:
        left, right = s.split("/", 1)
        try:
            num = float(left.strip())
            den = float(right.strip())
        except ValueError:
            return None
        if den == 0:
            return 0.0
        if den == 100:
            return num
        return round((num / den) * 100, 1)
    try:
        return float(s)
    except ValueError:
        return None


def parse_interview_questions(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(x) for x in value if x is not None]
    text = str(value).strip()
    if not text:
        return []
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return [str(x) for x in parsed]
    except (json.JSONDecodeError, TypeError):
        pass
    return [line.strip("- •").strip() for line in text.splitlines() if line.strip()]


def extract_strengths_weaknesses(summary: str | None) -> tuple[list[str], list[str]]:
    if not summary:
        return [], []
    strengths: list[str] = []
    weaknesses: list[str] = []

    strength_match = re.search(
        r"\*\*Strengths?\*\*\s*(.*?)(?=\*\*|Risk Flags?|$)",
        summary,
        flags=re.IGNORECASE | re.DOTALL,
    )
    risk_match = re.search(
        r"\*\*Risk Flags?\*\*\s*(.*?)(?=\*\*|$)",
        summary,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if strength_match:
        strengths = [
            line.strip("•-* \t")
            for line in strength_match.group(1).splitlines()
            if line.strip("•-* \t")
        ]
    if risk_match:
        weaknesses = [
            line.strip("•-* \t")
            for line in risk_match.group(1).splitlines()
            if line.strip("•-* \t")
        ]
    return strengths, weaknesses


def parse_timestamp(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    text = str(value).strip()
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


def screened_to_candidate_dict(row: ScreenedProfile, job_title: str | None = None) -> dict[str, Any]:
    total = parse_score_value(row.total_score)
    experience = parse_score_value(row.experience_score)
    skill = parse_score_value(row.skill_score)
    stability = parse_score_value(row.stability_score)
    education = parse_score_value(row.education_score)
    strengths, weaknesses = extract_strengths_weaknesses(row.summary)
    screened_on = parse_timestamp(row.timestamp)
    phone = row.mobile_number
    if phone and str(phone).upper() in {"#ERROR!", "N/A", "NA"}:
        phone = None

    recommendation = row.my_recommendation or "Pending"
    return {
        "id": str(row.row_id),
        "job_id": None,
        "job_code": row.job_code,
        "client_id": row.client_id,
        "name": row.candidate_name,
        "email": row.email,
        "phone": phone,
        "job": job_title or row.applied_role,
        "location": row.current_location,
        "score": total,
        "status": recommendation,
        "screening_status": "completed",
        "resume_filename": (row.file_path.split("/")[-1] if row.file_path else None),
        "resume_url": row.resume_url,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "breakdown": {
            "skills": skill if skill is not None else 0,
            "experience": experience if experience is not None else 0,
            "education": education if education is not None else 0,
            "stability": stability if stability is not None else 0,
            "overall": total if total is not None else 0,
        },
        "score_details": {
            "experience_score": row.experience_score,
            "skill_score": row.skill_score,
            "stability_score": row.stability_score,
            "education_score": row.education_score,
            "total_score": row.total_score,
        },
        "remarks": row.summary,
        "summary": row.summary,
        "risk": row.risk_flag,
        "growth_pattern": row.growth_pattern,
        "interview_questions": parse_interview_questions(row.interview_questions),
        "ai_confidence": row.ai_confident,
        "human_evaluation": recommendation,
        "human_note": None,
        "availability": None,
        "screened_on": screened_on,
        "created_at": screened_on or datetime.utcnow(),
    }


def apply_screening_payload(row: ScreenedProfile, payload: dict[str, Any]) -> ScreenedProfile:
    """Map flexible n8n / API payload keys onto a ScreenedProfile row."""

    def pick(*keys: str, default: Any = None) -> Any:
        for key in keys:
            if key in payload and payload[key] is not None:
                return payload[key]
        return default

    row.client_id = _as_text(pick("client_id", "Client ID", default=row.client_id))
    row.timestamp = _as_text(
        pick("timestamp", "Timestamp", default=row.timestamp) or datetime.utcnow().isoformat()
    )
    row.job_code = _as_text(pick("job_code", "Job code", "Job Code", default=row.job_code))
    row.candidate_name = _as_text(pick("name", "candidate_name", "Candidate name", default=row.candidate_name))
    row.applied_role = _as_text(pick("applied_role", "Applied role", "job_title", default=row.applied_role))
    row.mobile_number = _as_text(pick("phone", "mobile_number", "Mobile number", default=row.mobile_number))
    row.email = _as_text(pick("email", "Email", default=row.email))
    row.current_location = _as_text(
        pick("location", "current_location", "Current location", default=row.current_location)
    )
    row.experience_score = _as_text(
        pick("experience_score", "Experience Score", default=row.experience_score)
    )
    row.skill_score = _as_text(pick("skill_score", "Skill Score", default=row.skill_score))
    row.stability_score = _as_text(
        pick("stability_score", "Stability Score", default=row.stability_score)
    )
    row.education_score = _as_text(
        pick("education_score", "Education score", "Education Score", default=row.education_score)
    )
    row.total_score = _as_text(pick("total_score", "Total Score", "score", default=row.total_score))
    row.growth_pattern = _as_text(pick("growth_pattern", "Growth Pattern", default=row.growth_pattern))
    # "Projected availability" is not present on the live Supabase table — ignore if sent.
    row.risk_flag = _as_text(pick("risk_flag", "Risk Flag", "risk", default=row.risk_flag))
    row.my_recommendation = _as_text(
        pick("my_recommendation", "My Recommendation", "status", default=row.my_recommendation)
    )
    row.summary = _as_text(pick("summary", "Summary", "remarks", default=row.summary))
    questions = pick("interview_questions", "Interview Questions", default=row.interview_questions)
    if isinstance(questions, list):
        row.interview_questions = json.dumps(questions)
    elif questions is not None:
        row.interview_questions = str(questions)
    row.ai_confident = _as_text(pick("ai_confident", "AI confident", "ai_confidence", default=row.ai_confident))
    row.file_path = _as_text(pick("file_path", "resume_filename", default=row.file_path))
    row.resume_url = _as_text(pick("resume_url", "Resume URL", default=row.resume_url))

    breakdown = pick("breakdown")
    if isinstance(breakdown, dict):
        if row.skill_score is None and breakdown.get("skills") is not None:
            row.skill_score = str(breakdown.get("skills"))
        if row.experience_score is None and breakdown.get("experience") is not None:
            row.experience_score = str(breakdown.get("experience"))
        if row.education_score is None and breakdown.get("education") is not None:
            row.education_score = str(breakdown.get("education"))
        if row.stability_score is None and breakdown.get("stability") is not None:
            row.stability_score = str(breakdown.get("stability"))
        if row.total_score is None and breakdown.get("overall") is not None:
            row.total_score = str(breakdown.get("overall"))

    return row


def _as_text(value: Any) -> str | None:
    if value is None:
        return None
    return str(value)
