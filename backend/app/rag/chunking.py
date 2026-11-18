"""Turn parsed jobs / resumes into small, separately embedded chunks. Each chunk is (section, content)."""

from __future__ import annotations

Chunk = tuple[str, str]


def job_chunks(title: str, parsed: dict) -> list[Chunk]:
    chunks: list[Chunk] = []
    if title or parsed.get("summary"):
        chunks.append(("role", f"{title}. {parsed.get('summary') or ''}".strip()))
    for skill in parsed.get("required_skills") or []:
        chunks.append(("skill", f"Skill: {skill}"))
    for item in parsed.get("responsibilities") or []:
        chunks.append(("responsibility", item))
    for item in parsed.get("qualifications") or []:
        chunks.append(("education", f"Qualification: {item}"))
    return chunks


def resume_chunks(parsed: dict) -> list[Chunk]:
    chunks: list[Chunk] = []
    if parsed.get("summary"):
        chunks.append(("summary", parsed["summary"]))
    skills = parsed.get("skills") or []
    for skill in skills:
        chunks.append(("skill", f"Skill: {skill}"))
    if skills:
        chunks.append(("skills_all", "Skills: " + ", ".join(skills)))
    for e in parsed.get("experience") or []:
        period = " - ".join(x for x in (e.get("start"), e.get("end")) if x)
        head = " at ".join(x for x in (e.get("designation"), e.get("company")) if x)
        text = ". ".join(x for x in (head, period, e.get("summary")) if x)
        if text:
            chunks.append(("experience", text))
    for item in parsed.get("education") or []:
        chunks.append(("education", f"Education: {item}"))
    return chunks
