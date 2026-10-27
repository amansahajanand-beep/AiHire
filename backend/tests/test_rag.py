"""Offline tests for the RAG screening pieces (no Gemini / database needed)."""

import base64
import hashlib
import time
from datetime import date
from types import SimpleNamespace

from jose import jwt

from app import job_queue
from app.config import get_settings
from app.models import Candidate, Job, ScreenedProfile
from app.rag import chunking, pipeline, scoring
from app.screening_profiles import apply_screening_payload, screened_to_candidate_dict

TODAY = date(2026, 10, 27)


def item(section, content, sim):
    return {"section": section, "content": content, "matches": [{"section": "skill", "content": "ev", "sim": sim}]}


def test_calibrate_bounds():
    assert scoring.calibrate(0.2) == 0.0
    assert scoring.calibrate(0.95) == 1.0
    assert 0.0 < scoring.calibrate(0.65) < 1.0


def test_strong_match_scores_high_and_weak_scores_low():
    resume = {"experience": [{"start": "Jan 2018", "end": "Present"}], "education": ["B.Tech Computer Science"]}
    job = {"min_years": 5, "qualifications": ["Bachelor degree"]}

    def matches(sim):
        return [
            item("skill", "Skill: Python", sim),
            item("skill", "Skill: SQL", sim),
            item("responsibility", "Build APIs", sim),
            item("education", "Qualification: Bachelor degree", sim),
        ]

    strong = scoring.score_candidate(matches(0.85), job, resume, TODAY)
    weak = scoring.score_candidate(matches(0.40), job, resume, TODAY)
    assert strong["total"] >= 85 and strong["recommendation"] in {"Highly Recommended", "Recommended"}
    assert weak["total"] < 60 and weak["recommendation"] == "Not Recommended"
    assert strong["skills"] == 40 and weak["skills"] == 0


def test_present_end_date_counts_up_to_today():
    years = scoring.total_years([{"start": "Jan 2025", "end": "Present"}], TODAY)
    assert 1.5 <= years <= 2.0  # Jan 2025 -> Oct 2026, not "less than a year"


def test_overlapping_jobs_are_not_double_counted():
    exp = [{"start": "Jan 2020", "end": "Dec 2022"}, {"start": "Jun 2021", "end": "Dec 2022"}]
    assert scoring.total_years(exp, TODAY) == 2.9


def test_experience_factor_penalises_too_few_years():
    resume = {"experience": [{"start": "Jan 2025", "end": "Present"}]}
    matches = [item("responsibility", "x", 0.85)]
    full, _, _ = scoring.score_experience(matches, resume, None, TODAY)
    short, _, years = scoring.score_experience(matches, resume, 6, TODAY)
    assert full == 30 and short < 12 and years is not None


def test_stability_penalises_short_stints_and_gaps():
    stable = [{"start": "Jan 2018", "end": "Dec 2021"}, {"start": "Jan 2022", "end": "Present"}]
    hopper = [
        {"start": "Jan 2024", "end": "Jun 2024"},
        {"start": "Jan 2025", "end": "Apr 2025"},
        {"start": "Jan 2026", "end": "Mar 2026"},
    ]
    assert scoring.score_stability(stable, TODAY)[0] > scoring.score_stability(hopper, TODAY)[0]
    assert scoring.score_stability([], TODAY)[0] == 7.5  # unknown dates: neutral


def test_recommendation_bands():
    assert [scoring.recommendation(x) for x in (95, 80, 65, 40)] == [
        "Highly Recommended", "Recommended", "Consider after Technical Interview", "Not Recommended"]


def test_chunking_makes_one_chunk_per_requirement():
    job = chunking.job_chunks("Dev", {"summary": "Builds", "required_skills": ["Python", "SQL"],
                                      "responsibilities": ["Write APIs"], "qualifications": ["B.Tech"]})
    assert [s for s, _ in job] == ["role", "skill", "skill", "responsibility", "education"]
    resume = chunking.resume_chunks({"summary": "s", "skills": ["Python"], "education": ["B.Tech"],
                                     "experience": [{"company": "Acme", "designation": "Dev", "start": "2020", "end": "2022", "summary": "api"}]})
    assert {"summary", "skill", "skills_all", "experience", "education"} == {s for s, _ in resume}


def test_payload_round_trips_through_existing_report_code():
    """The worker output must read back through the unchanged report / candidate code in the existing stored format."""
    job = Job(job_code="JOB-1", title="Full Stack Developer")
    cand = Candidate(id="c1", client_id="CL1", job_id="j1", name="x", file_path="p.pdf", resume_url="u")
    parsed = {"candidate_name": "Asha", "applied_role": "", "email": "a@b.com", "phone": "999", "location": "Pune",
              "skills": ["Python", "React"], "education": ["B.Tech"], "summary": "s",
              "experience": [{"company": "Acme", "designation": "Dev", "start": "Jan 2020", "end": "Present", "summary": "built apis"}]}
    scores = {"experience": 20, "skills": 30, "stability": 12, "education": 10, "total": 72,
              "recommendation": "Consider after Technical Interview"}
    rep = {"career_progression": "Junior to mid", "risk_flags": ["No React depth"], "candidate_summary": "Solid dev",
           "interview_questions": ["q1", "q2"], "ai_confidence": "High", "strengths": ["APIs", "Python"]}
    payload = pipeline._build_payload(job, cand, parsed, scores, rep)

    row = ScreenedProfile(row_id="r1")
    apply_screening_payload(row, payload)
    data = screened_to_candidate_dict(row)
    assert data["score"] == 72 and data["status"] == "Consider after Technical Interview"
    assert data["breakdown"]["skills"] == 75.0 and data["breakdown"]["stability"] == 80.0  # stored as % of max (30/40, 12/15)
    assert data["strengths"] == ["APIs", "Python"]
    assert data["weaknesses"] == ["No React depth"]
    assert [s.lower() for s in data["skills"]][:2] == ["python", "react"]
    assert data["experience_history"][0]["company"] == "Acme"
    assert row.job_code == "JOB-1"  # the real job code, not the client id


def test_queue_signature_verification():
    s = get_settings()
    s.qstash_current_signing_key = "current-key"
    s.backend_public_url = "https://api.example.com"
    body = b'{"candidate_id": "c1"}'
    body_hash = base64.urlsafe_b64encode(hashlib.sha256(body).digest()).decode().rstrip("=")
    claims = {"iss": "Upstash", "sub": job_queue.worker_url(), "body": body_hash, "exp": int(time.time()) + 60,
              "nbf": int(time.time()) - 5, "iat": int(time.time())}
    token = jwt.encode(claims, "current-key", algorithm="HS256")
    assert job_queue.verify_signature(token, body)
    assert not job_queue.verify_signature(token, b'{"candidate_id": "other"}')
    assert not job_queue.verify_signature(jwt.encode(claims, "wrong", algorithm="HS256"), body)
    assert not job_queue.verify_signature(None, body)
