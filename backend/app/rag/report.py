"""Grounded report text. The scores are already fixed by scoring.py; the LLM only writes the narrative
(strengths, risk flags, summary, career progression, interview questions, confidence) using the same
rules as the original screening prompt, plus the matched / missing requirement evidence."""

from __future__ import annotations

import json
from datetime import date

from app.rag import gemini

NO_RISK = "No significant risk identified from the profile."

_SYSTEM = """You are an AI-powered resume screening assistant writing the evaluation report for a candidate.
The scores have ALREADY been calculated from semantic similarity between the Job Requirement and the Candidate
Resume. Do not change, recompute or contradict them.

Rules:
- Use only information in the Candidate Resume and Job Requirement. Never assume. Use "Not Available" only when
  information is genuinely missing.
- Ignore communication, attitude, confidence, personality and other soft skills unless the Job Requirement or
  Resume explicitly mentions them.
- Strengths: specific, evidence-based, relevant to the job. No personality traits.
- Risk flags: specific risks supported by the resume and job (missing mandatory skills, experience gaps, role
  mismatch, stability concerns, qualification or location mismatch, unclear information). Judge them
  independently of the score: a high score does not mean there are no risks. If none is identified return exactly
  one flag: "No significant risk identified from the profile." Never combine that sentence with real risks, and
  do not use one generic risk for every candidate.
- Career progression: starting position, promotions, highest position, increased responsibility; maximum 30 words;
  "Not Available" if there is not enough information.
- Candidate summary: concise and factual, in relation to the job.
- Interview questions: exactly 5 practical, role-specific technical questions, from basic to advanced, based on
  missing mandatory skills, experience gaps, the candidate's projects and technologies. No generic HR questions.
- Experience, summary, career progression and risk flags must be consistent with the calculated years of
  experience and with the requirement evidence provided.
Return ONLY valid JSON."""


def _evidence_block(scores: dict) -> str:
    def fmt(items: list[dict]) -> list[dict]:
        return [
            {"requirement": e["requirement"], "match_strength": e["score"], "closest_resume_evidence": e["evidence"][:240]}
            for e in items
        ]

    return json.dumps(
        {
            "skills": fmt(scores["skill_evidence"]),
            "responsibilities": fmt(scores["experience_evidence"]),
            "education": fmt(scores["education_evidence"]),
        },
        ensure_ascii=False,
    )


def generate_report(job, parsed_job: dict, parsed_resume: dict, scores: dict, today: date | None = None) -> dict:
    today = today or date.today()
    prompt = (
        f"Current screening date: {today.isoformat()}\n\n"
        f"JOB TITLE: {job.title}\n"
        f"REQUIRED EXPERIENCE: {job.experience or 'Not Available'}\n"
        f"MANDATORY SKILLS: {', '.join(parsed_job.get('required_skills') or []) or 'Not Available'}\n"
        f"JOB SUMMARY: {parsed_job.get('summary') or 'Not Available'}\n\n"
        f"CANDIDATE (parsed from resume):\n{json.dumps(parsed_resume, ensure_ascii=False)}\n\n"
        "CALCULATED SCORES (fixed): "
        f"Skills {scores['skills']}/40, Experience {scores['experience']}/30, Education {scores['education']}/15, "
        f"Stability {scores['stability']}/15, Total {scores['total']}/100 -> {scores['recommendation']}.\n"
        f"Calculated total experience: {scores['years_experience'] if scores['years_experience'] is not None else 'Not Available'} years. "
        f"Stability note: {scores['stability_note']}.\n\n"
        "REQUIREMENT EVIDENCE (match_strength 0 = not found in resume, 1 = clearly demonstrated):\n"
        f"{_evidence_block(scores)}\n\n"
        'Return JSON: {"candidate_summary": "", "strengths": ["", "", ""], "risk_flags": [""], '
        '"career_progression": "", "interview_questions": ["", "", "", "", ""], '
        '"ai_confidence": "High|Medium|Low"}'
    )
    data = gemini.generate_json(prompt, system=_SYSTEM, label="report")

    def lst(key: str) -> list[str]:
        value = data.get(key) or []
        if isinstance(value, str):
            value = [value]
        return [str(v).strip() for v in value if str(v).strip()]

    risks = lst("risk_flags")
    real = [r for r in risks if r.rstrip(".").lower() != NO_RISK.rstrip(".").lower()]
    confidence = str(data.get("ai_confidence") or "").strip().title()
    return {
        "candidate_summary": str(data.get("candidate_summary") or "").strip() or "Not Available",
        "strengths": lst("strengths"),
        "risk_flags": real or [NO_RISK],
        "career_progression": str(data.get("career_progression") or "").strip() or "Not Available",
        "interview_questions": lst("interview_questions")[:5],
        "ai_confidence": confidence if confidence in {"High", "Medium", "Low"} else "Medium",
    }
