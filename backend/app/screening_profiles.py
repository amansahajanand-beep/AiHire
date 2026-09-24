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


def _section_lines(summary: str, headings: list[str]) -> list[str]:
    pattern = (
        r"(?:\*\*|#+)\s*(?:"
        + "|".join(re.escape(h) for h in headings)
        + r")\s*(?:\*\*)?\s*\n(.*?)(?=(?:\*\*|#+)\s*[A-Za-z]|$)"
    )
    match = re.search(pattern, summary, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        return []
    return [
        line.strip("•-* \t")
        for line in match.group(1).splitlines()
        if line.strip("•-* \t")
    ]


def normalize_skills(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        # JSON list string?
        text = value.strip()
        if text.startswith("["):
            try:
                parsed = json.loads(text)
                return normalize_skills(parsed)
            except (json.JSONDecodeError, TypeError):
                pass
        return [part.strip() for part in re.split(r"[,;\n|/]+", text) if part.strip()]
    if isinstance(value, list):
        out: list[str] = []
        for item in value:
            if item is None:
                continue
            if isinstance(item, dict):
                name = item.get("name") or item.get("skill") or item.get("title")
                if name:
                    out.append(str(name).strip())
            else:
                text = str(item).strip()
                if text:
                    out.append(text)
        return out
    return []


def normalize_education(value: Any) -> list[dict[str, str]]:
    if value is None:
        return []
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return []
        if text.startswith("["):
            try:
                return normalize_education(json.loads(text))
            except (json.JSONDecodeError, TypeError):
                pass
        return [{"degree": text, "school": "", "year": ""}]
    if not isinstance(value, list):
        return []
    out: list[dict[str, str]] = []
    for item in value:
        if item is None:
            continue
        if isinstance(item, str):
            text = item.strip()
            if text:
                out.append({"degree": text, "school": "", "year": ""})
            continue
        if isinstance(item, dict):
            degree = str(item.get("degree") or item.get("title") or item.get("name") or "").strip()
            school = str(item.get("school") or item.get("institution") or item.get("university") or "").strip()
            year = str(item.get("year") or item.get("duration") or item.get("dates") or "").strip()
            if degree or school:
                out.append({"degree": degree or "Education", "school": school, "year": year})
    return out


def normalize_experience(value: Any) -> list[dict[str, str]]:
    if value is None:
        return []
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return []
        if text.startswith("["):
            try:
                return normalize_experience(json.loads(text))
            except (json.JSONDecodeError, TypeError):
                pass
        return [{"title": "Experience", "company": "", "duration": "", "description": text}]
    if not isinstance(value, list):
        return []
    out: list[dict[str, str]] = []
    for item in value:
        if item is None:
            continue
        if isinstance(item, str):
            text = item.strip()
            if text:
                out.append({"title": text, "company": "", "duration": "", "description": ""})
            continue
        if isinstance(item, dict):
            title = str(item.get("title") or item.get("role") or item.get("position") or "").strip()
            company = str(item.get("company") or item.get("organization") or item.get("employer") or "").strip()
            duration = str(item.get("duration") or item.get("dates") or item.get("period") or "").strip()
            description = str(item.get("description") or item.get("summary") or item.get("details") or "").strip()
            if title or company or description:
                out.append(
                    {
                        "title": title or "Role",
                        "company": company,
                        "duration": duration,
                        "description": description,
                    }
                )
    return out


def extract_profile_sections(summary: str | None) -> dict[str, list]:
    """Pull skills / education / experience lists from markdown-ish summary sections."""
    if not summary:
        return {"skills": [], "education": [], "experience_history": []}

    skill_lines = _section_lines(summary, ["Skills", "Key Skills", "Technical Skills"])
    education_lines = _section_lines(summary, ["Education", "Academic Background"])
    experience_lines = _section_lines(
        summary, ["Experience", "Work Experience", "Professional Experience", "Employment History"]
    )

    education: list[dict[str, str]] = []
    for line in education_lines:
        # "B.S. Computer Science — Stanford University (2017)" or "Degree, School, Year"
        degree, school, year = line, "", ""
        if "—" in line or " - " in line:
            parts = re.split(r"\s+[—-]\s+", line, maxsplit=1)
            degree = parts[0].strip()
            rest = parts[1].strip() if len(parts) > 1 else ""
            year_match = re.search(r"\(([^)]+)\)\s*$", rest)
            if year_match:
                year = year_match.group(1).strip()
                school = rest[: year_match.start()].strip(" ,")
            else:
                school = rest
        elif "," in line:
            bits = [b.strip() for b in line.split(",")]
            degree = bits[0] if bits else line
            school = bits[1] if len(bits) > 1 else ""
            year = bits[2] if len(bits) > 2 else ""
        education.append({"degree": degree, "school": school, "year": year})

    experience_history: list[dict[str, str]] = []
    for line in experience_lines:
        title, company, duration, description = line, "", "", ""
        # "Senior Engineer at Acme (2021 - Present): built APIs"
        at_match = re.match(
            r"^(?P<title>.+?)\s+at\s+(?P<company>.+?)(?:\s*\((?P<duration>[^)]+)\))?(?:\s*[:\-–]\s*(?P<desc>.+))?$",
            line,
            flags=re.IGNORECASE,
        )
        if at_match:
            title = at_match.group("title").strip()
            company = at_match.group("company").strip()
            duration = (at_match.group("duration") or "").strip()
            description = (at_match.group("desc") or "").strip()
        experience_history.append(
            {"title": title, "company": company, "duration": duration, "description": description}
        )

    return {
        "skills": skill_lines,
        "education": education,
        "experience_history": experience_history,
    }


def extract_structured_from_payload(payload: dict[str, Any] | None) -> dict[str, list]:
    payload = payload or {}
    skills = normalize_skills(
        payload.get("skills")
        or payload.get("Skills")
        or payload.get("key_skills")
        or payload.get("technical_skills")
    )
    education = normalize_education(
        payload.get("education")
        or payload.get("Education")
        or payload.get("education_history")
    )
    experience_history = normalize_experience(
        payload.get("experience_history")
        or payload.get("experienceHistory")
        or payload.get("experience")
        or payload.get("work_experience")
        or payload.get("Work Experience")
        or payload.get("Experience")
    )
    return {
        "skills": skills,
        "education": education,
        "experience_history": experience_history,
    }


def build_profile_details(
    *,
    summary: str | None = None,
    growth_pattern: str | None = None,
    applied_role: str | None = None,
    payload: dict[str, Any] | None = None,
    fallback_skills: list | None = None,
    fallback_education: list | None = None,
    fallback_experience: list | None = None,
) -> dict[str, list]:
    """Merge structured payload, summary sections, and stored fallbacks."""
    from_payload = extract_structured_from_payload(payload)
    from_summary = extract_profile_sections(summary)

    skills = (
        from_payload["skills"]
        or normalize_skills(fallback_skills)
        or from_summary["skills"]
    )
    education = (
        from_payload["education"]
        or normalize_education(fallback_education)
        or from_summary["education"]
    )
    experience_history = (
        from_payload["experience_history"]
        or normalize_experience(fallback_experience)
        or from_summary["experience_history"]
    )

    # Soft fallback: growth pattern / summary as a single experience entry
    if not experience_history and (growth_pattern or summary):
        experience_history = [
            {
                "title": applied_role or "Professional Background",
                "company": "",
                "duration": "",
                "description": (growth_pattern or summary or "").strip(),
            }
        ]

    if not skills:
        skills = _infer_skills_from_text(growth_pattern, summary)

    if not education:
        education = _infer_education_from_text(summary, growth_pattern)

    return {
        "skills": skills,
        "education": education,
        "experience_history": experience_history,
    }


def _infer_skills_from_text(*texts: str | None) -> list[str]:
    blob = " ".join(t for t in texts if t)
    if not blob:
        return []
    found: list[str] = []
    for match in re.finditer(
        r"(?:experience in|focusing on|skills? in|acquisition in|background in|expertise in)\s+([^.]+)",
        blob,
        flags=re.IGNORECASE,
    ):
        chunk = match.group(1)
        for part in re.split(r",| and ", chunk):
            skill = part.strip(" .;:")
            skill = re.sub(r"\b(the|a|an|required|mandatory)\b", "", skill, flags=re.I).strip()
            if 3 < len(skill) < 48:
                found.append(skill)
    for match in re.finditer(
        r"\b(Data Science|Software Development|Machine Learning|Artificial Intelligence|React|Python|TypeScript|Node\.?js|AWS|Kubernetes|GenAI|DevOps)\b",
        blob,
        flags=re.IGNORECASE,
    ):
        token = match.group(1).strip()
        if token and token.lower() not in {s.lower() for s in found}:
            found.append(token)
    out: list[str] = []
    seen: set[str] = set()
    for item in found:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            out.append(item)
    return out[:12]


def _infer_education_from_text(*texts: str | None) -> list[dict[str, str]]:
    blob = " ".join(t for t in texts if t)
    if not blob:
        return []
    pattern = re.compile(
        r"\b((?:B\.?\s*S\.?|B\.?\s*Tech|B\.?\s*E\.?|M\.?\s*S\.?|M\.?\s*Tech|MBA|Ph\.?\s*D\.?|Bachelor(?:'s)?|Master(?:'s)?|Diploma)[^,.\n]{0,60})",
        flags=re.IGNORECASE,
    )
    out: list[dict[str, str]] = []
    for match in pattern.finditer(blob):
        degree = match.group(1).strip(" ,;")
        if degree:
            out.append({"degree": degree, "school": "", "year": ""})
    return out


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

    details = build_profile_details(
        summary=row.summary,
        growth_pattern=row.growth_pattern,
        applied_role=job_title or row.applied_role,
    )

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
        "skills": details["skills"],
        "education": details["education"],
        "experience_history": details["experience_history"],
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
