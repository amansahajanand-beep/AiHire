"""The same resume used for a second job must not be parsed or embedded again."""

import uuid

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models  # noqa: F401 - register tables
from app.database import Base
from app.models import Candidate, Job, User
from app.rag import pipeline

PARSED = {
    "candidate_name": "Asha", "applied_role": "Dev", "email": "a@b.com", "phone": "1", "location": "Pune",
    "skills": ["Python"], "education": ["B.Tech"], "summary": "s",
    "experience": [{"company": "Acme", "designation": "Dev", "start": "Jan 2020", "end": "Present", "summary": "api"}],
}
MATCHES = [{"section": "skill", "content": "Skill: Python", "matches": [{"section": "skill", "content": "Skill: Python", "sim": 0.9}]}]
REPORT = {"candidate_summary": "ok", "strengths": ["a"], "risk_flags": ["No significant risk identified from the profile."],
          "career_progression": "x", "interview_questions": ["q"] * 5, "ai_confidence": "High"}


@pytest.fixture()
def env(monkeypatch):
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    user = User(id=str(uuid.uuid4()), email="u@x.com", name="U", hashed_password="x", client_id="CL1")
    db.add(user)
    jobs = [Job(id=str(uuid.uuid4()), job_code=f"JOB-{i}", user_id=user.id, client_id="CL1", title=f"Role {i}") for i in (1, 2)]
    db.add_all(jobs)
    db.flush()
    cands = [Candidate(id=str(uuid.uuid4()), user_id=user.id, client_id="CL1", job_id=j.id, name="x",
                       resume_filename="cv.pdf", file_path=f"CL1/cv{i}.pdf", screening_status="processing")
             for i, j in enumerate(jobs)]
    db.add_all(cands)
    db.commit()

    calls = {"parse": 0, "embed": 0, "copy": 0}
    profiles = {}
    chunks = {}

    monkeypatch.setattr(pipeline, "download_resume_bytes", lambda path: b"same-bytes")
    monkeypatch.setattr(pipeline.parsing, "extract_text", lambda name, data: "resume text " * 20)
    monkeypatch.setattr(pipeline.parsing, "parse_resume", lambda text, today: (calls.__setitem__("parse", calls["parse"] + 1), PARSED)[1])
    monkeypatch.setattr(pipeline.gemini, "embed_texts", lambda texts, task_type="": (calls.__setitem__("embed", calls["embed"] + 1), [[0.0]] * len(texts))[1])
    monkeypatch.setattr(pipeline.report, "generate_report", lambda *a, **k: REPORT)
    monkeypatch.setattr(pipeline.store, "job_has_chunks", lambda db, jid: True)
    monkeypatch.setattr(pipeline.store, "get_job_profile", lambda db, jid: {"required_skills": ["Python"], "min_years": None, "qualifications": [], "responsibilities": [], "summary": ""})
    monkeypatch.setattr(pipeline.store, "get_resume_profile", lambda db, c, h: profiles.get((c, h)))
    monkeypatch.setattr(pipeline.store, "save_resume_profile", lambda db, c, h, parsed, cid: profiles.__setitem__((c, h), (parsed, cid)))
    monkeypatch.setattr(pipeline.store, "resume_chunk_count", lambda db, cid: len(chunks.get(cid, [])))
    monkeypatch.setattr(pipeline.store, "replace_resume_chunks", lambda db, cid, c, rows: chunks.__setitem__(cid, rows) or len(rows))

    def copy(db, src, dst, client):
        calls["copy"] += 1
        chunks[dst] = chunks.get(src, [])
        return len(chunks[dst])

    monkeypatch.setattr(pipeline.store, "copy_resume_chunks", copy)
    monkeypatch.setattr(pipeline.store, "match_job_to_resume", lambda db, jid, cid, top_k=3: MATCHES)
    monkeypatch.setattr(pipeline, "invalidate_client", lambda c: None)
    return db, cands, calls


def test_same_resume_for_second_job_is_not_parsed_or_embedded_again(env):
    db, (first, second), calls = env

    assert pipeline.screen_candidate(db, first.id)["status"] == "completed"
    assert calls == {"parse": 1, "embed": 1, "copy": 0}

    assert pipeline.screen_candidate(db, second.id)["status"] == "completed"
    assert calls == {"parse": 1, "embed": 1, "copy": 1}  # nothing parsed or embedded; vectors copied

    db.refresh(first)
    db.refresh(second)
    assert first.raw_result["resume_reused"] is False
    assert second.raw_result["resume_reused"] is True
    assert first.raw_result["resume_hash"] == second.raw_result["resume_hash"]
    assert first.job_id != second.job_id and second.score is not None  # still scored for its own job


def test_long_risk_text_fits_the_short_candidate_columns(env):
    """Regression: candidates.risk is 50 chars; the bulleted risk list used to overflow it on commit."""
    db, (first, _), _ = env
    long_risks = "\n".join(f"• risk number {i} with a fairly long description of the concern" for i in range(4))
    rep = {**REPORT, "risk_flags": long_risks.split("\n")}
    pipeline.report.generate_report = lambda *a, **k: rep
    pipeline.screen_candidate(db, first.id)
    db.refresh(first)
    assert first.risk == "High" and len(first.risk) <= 50
