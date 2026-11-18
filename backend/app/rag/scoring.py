"""Deterministic match scoring from vector similarity. Same weights as the old LLM scoring:
Skills 40, Experience 30, Education 15, Stability 15 (total 100).

The LLM never decides these numbers. Tune SIM_LOW / SIM_HIGH against real resumes: raw cosine similarity
sits in a narrow band, so it is mapped linearly from [SIM_LOW, SIM_HIGH] to [0, 1].
"""

from __future__ import annotations

import re
from datetime import date

SIM_LOW = 0.55   # at or below this a requirement counts as not covered
SIM_HIGH = 0.80  # at or above this a requirement counts as fully covered

MAX_SKILLS, MAX_EXPERIENCE, MAX_EDUCATION, MAX_STABILITY = 40, 30, 15, 15
COVERED_AT = 0.5  # calibrated score at which a requirement is reported as "matched"

_MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], start=1)}
_PRESENT = ("present", "current", "till date", "to date", "now", "ongoing")
_LEVELS = [("phd", 4), ("doctor", 4), ("master", 3), ("m.tech", 3), ("mtech", 3), ("mba", 3), ("m.sc", 3),
           ("msc", 3), ("m.e", 3), ("bachelor", 2), ("b.tech", 2), ("btech", 2), ("b.e", 2), ("b.sc", 2),
           ("bsc", 2), ("bca", 2), ("b.com", 2), ("bcom", 2), ("diploma", 1)]


def calibrate(sim: float) -> float:
    return max(0.0, min(1.0, (sim - SIM_LOW) / (SIM_HIGH - SIM_LOW)))


def parse_month(value: str, today: date, *, end: bool = False) -> date | None:
    """'Jan 2023', '03/2022', '2021' or 'Present' -> a date; None when it cannot be read."""
    v = (value or "").strip().lower()
    if not v or v in {"not available", "n/a", "-"}:
        return None
    if any(p in v for p in _PRESENT):
        return today
    year_m = re.search(r"(19|20)\d{2}", v)
    if not year_m:
        return None
    year = int(year_m.group(0))
    month = None
    for name, num in _MONTHS.items():
        if name in v:
            month = num
            break
    if month is None:
        num_m = re.search(r"\b(0?[1-9]|1[0-2])\s*[/-]\s*(19|20)\d{2}", v)
        month = int(num_m.group(1)) if num_m else (12 if end else 1)
    return date(year, month, 1)


def _intervals(experience: list[dict], today: date) -> list[tuple[date, date]]:
    out = []
    for e in experience or []:
        start = parse_month(e.get("start", ""), today)
        end = parse_month(e.get("end", ""), today, end=True)
        if start and end and end >= start:
            out.append((start, end))
    return sorted(out)


def _months_between(a: date, b: date) -> int:
    return (b.year - a.year) * 12 + (b.month - a.month)


def total_years(experience: list[dict], today: date) -> float | None:
    """Years of experience with overlapping jobs merged; None when no dates could be read."""
    ivs = _intervals(experience, today)
    if not ivs:
        return None
    months, (cur_s, cur_e) = 0, ivs[0]
    for s, e in ivs[1:]:
        if s <= cur_e:
            cur_e = max(cur_e, e)
        else:
            months += _months_between(cur_s, cur_e)
            cur_s, cur_e = s, e
    months += _months_between(cur_s, cur_e)
    return round(months / 12, 1)


def _by_section(matches: list[dict], *sections: str) -> list[dict]:
    return [m for m in matches if m["section"] in sections]


def _best(item: dict) -> tuple[float, str]:
    top = item["matches"][0] if item["matches"] else None
    return (top["sim"], top["content"]) if top else (0.0, "")


def _evidence(item: dict) -> dict:
    sim, content = _best(item)
    return {"requirement": item["content"], "similarity": round(sim, 3), "score": round(calibrate(sim), 3),
            "evidence": content}


def score_skills(matches: list[dict]) -> tuple[float, list[dict]]:
    skills = _by_section(matches, "skill")
    items = skills or _by_section(matches, "role")  # no listed skills: fall back to overall role similarity
    if not items:
        return MAX_SKILLS * 0.0, []
    evid = [_evidence(i) for i in items]
    return MAX_SKILLS * (sum(e["score"] for e in evid) / len(evid)), evid


def score_experience(matches: list[dict], parsed_resume: dict, min_years: float | None, today: date) -> tuple[float, list[dict], float | None]:
    items = _by_section(matches, "responsibility", "role")
    evid = [_evidence(i) for i in items]
    relevance = (sum(e["score"] for e in evid) / len(evid)) if evid else 0.0
    years = total_years(parsed_resume.get("experience", []), today)
    factor = 1.0
    if min_years and min_years > 0:
        if years is None:
            factor = 0.6  # dates unreadable: do not punish fully, do not reward fully
        else:
            factor = max(0.25 if years > 0 else 0.0, min(1.0, years / min_years))
    return MAX_EXPERIENCE * relevance * factor, evid, years


def _level(texts: list[str]) -> int:
    best = 0
    for t in texts:
        low = t.lower()
        for key, lvl in _LEVELS:
            if key in low:
                best = max(best, lvl)
    return best


def score_education(matches: list[dict], parsed_resume: dict, parsed_job: dict) -> tuple[float, list[dict]]:
    resume_edu = parsed_resume.get("education") or []
    items = _by_section(matches, "education")
    if not items:  # job lists no qualification: reward having one, don't invent a requirement
        return MAX_EDUCATION * (0.8 if resume_edu else 0.3), []
    evid = [_evidence(i) for i in items]
    ratio = sum(e["score"] for e in evid) / len(evid)
    need, have = _level(parsed_job.get("qualifications") or []), _level(resume_edu)
    if need and have >= need:
        ratio = max(ratio, 0.75)
    elif need and have < need:
        ratio = min(ratio, 0.5)
    if not resume_edu:
        ratio = 0.0
    return MAX_EDUCATION * ratio, evid


def score_stability(experience: list[dict], today: date) -> tuple[float, str]:
    """Rule based on tenure and gaps from the parsed dates; returns (score, short reason)."""
    ivs = _intervals(experience, today)
    if not ivs:
        return MAX_STABILITY * 0.5, "Employment dates not available"
    tenures = [_months_between(s, e) for s, e in ivs]
    avg = sum(tenures) / len(tenures)
    score = 15.0 if avg >= 24 else 12.0 if avg >= 12 else 8.0
    short = sum(1 for t in tenures if t < 9)
    if len(ivs) > 1:
        score -= 2 * min(short, 3)
    gaps = sum(1 for (_, e1), (s2, _) in zip(ivs, ivs[1:]) if _months_between(e1, s2) > 6)
    score -= 2 * min(gaps, 2)
    if len(ivs) == 1 and tenures[0] < 12:
        score = min(score, 10.0)  # a single short stint is only early-career, not unstable
    return max(0.0, min(float(MAX_STABILITY), score)), f"Average tenure {avg / 12:.1f} yrs, {short} short stints, {gaps} gaps"


def recommendation(total: float) -> str:
    if total >= 90:
        return "Highly Recommended"
    if total >= 75:
        return "Recommended"
    if total >= 60:
        return "Consider after Technical Interview"
    return "Not Recommended"


def score_candidate(matches: list[dict], parsed_job: dict, parsed_resume: dict, today: date | None = None) -> dict:
    today = today or date.today()
    skills, skill_ev = score_skills(matches)
    exp, exp_ev, years = score_experience(matches, parsed_resume, parsed_job.get("min_years"), today)
    edu, edu_ev = score_education(matches, parsed_resume, parsed_job)
    stab, stab_note = score_stability(parsed_resume.get("experience", []), today)
    r = lambda x: int(round(x))  # noqa: E731
    parts = {"skills": r(skills), "experience": r(exp), "education": r(edu), "stability": r(stab)}
    total = sum(parts.values())
    return {
        **parts,
        "total": total,
        "recommendation": recommendation(total),
        "years_experience": years,
        "stability_note": stab_note,
        "skill_evidence": skill_ev,
        "experience_evidence": exp_ev,
        "education_evidence": edu_ev,
    }
