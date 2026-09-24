import uuid
from datetime import datetime

from sqlalchemy import String, Text, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    client_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    jobs: Mapped[list["Job"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    candidates: Mapped[list["Candidate"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    job_code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    client_id: Mapped[str] = mapped_column(String(32), index=True)

    title: Mapped[str] = mapped_column(String(255))
    department: Mapped[str | None] = mapped_column(String(120), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    employment_type: Mapped[str] = mapped_column(String(50), default="Full-time")
    experience: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    skills: Mapped[str | None] = mapped_column(Text, nullable=True)
    responsibilities: Mapped[str | None] = mapped_column(Text, nullable=True)
    qualifications: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Published")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="jobs")
    candidates: Mapped[list["Candidate"]] = relationship(back_populates="job", cascade="all, delete-orphan")


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    client_id: Mapped[str] = mapped_column(String(32), index=True)
    job_id: Mapped[str] = mapped_column(ForeignKey("jobs.id"), index=True)

    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    resume_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    resume_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Pending")
    screening_status: Mapped[str] = mapped_column(String(50), default="queued")  # queued|processing|completed|failed

    strengths: Mapped[list | None] = mapped_column(JSON, nullable=True)
    weaknesses: Mapped[list | None] = mapped_column(JSON, nullable=True)
    breakdown: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    skills: Mapped[list | None] = mapped_column(JSON, nullable=True)
    education: Mapped[list | None] = mapped_column(JSON, nullable=True)
    experience_history: Mapped[list | None] = mapped_column(JSON, nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    risk: Mapped[str | None] = mapped_column(String(50), nullable=True)
    raw_result: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    human_evaluation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    human_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    availability: Mapped[str | None] = mapped_column(String(120), nullable=True)

    screened_on: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="candidates")
    job: Mapped["Job"] = relationship(back_populates="candidates")


class ScreenedProfile(Base):
    """
    Existing n8n / multitenant screening results table in Supabase.
    Table name and column names must match production exactly.
    """

    __tablename__ = "Screened profile_Multitenent Profile screening"
    __table_args__ = {"extend_existing": True}

    row_id: Mapped[str] = mapped_column("row_id", UUID(as_uuid=False), primary_key=True, default=_uuid)
    client_id: Mapped[str | None] = mapped_column("Client ID", Text, nullable=True, index=True)
    timestamp: Mapped[str | None] = mapped_column("Timestamp", Text, nullable=True)
    job_code: Mapped[str | None] = mapped_column("Job code", Text, nullable=True, index=True)
    candidate_name: Mapped[str | None] = mapped_column("Candidate name", Text, nullable=True)
    applied_role: Mapped[str | None] = mapped_column("Applied role", Text, nullable=True)
    mobile_number: Mapped[str | None] = mapped_column("Mobile number", Text, nullable=True)
    email: Mapped[str | None] = mapped_column("Email", Text, nullable=True)
    current_location: Mapped[str | None] = mapped_column("Current location", Text, nullable=True)
    experience_score: Mapped[str | None] = mapped_column("Experience Score", Text, nullable=True)
    skill_score: Mapped[str | None] = mapped_column("Skill Score", Text, nullable=True)
    stability_score: Mapped[str | None] = mapped_column("Stability Score", Text, nullable=True)
    education_score: Mapped[str | None] = mapped_column("Education score", Text, nullable=True)
    total_score: Mapped[str | None] = mapped_column("Total Score", Text, nullable=True)
    growth_pattern: Mapped[str | None] = mapped_column("Growth Pattern", Text, nullable=True)
    risk_flag: Mapped[str | None] = mapped_column("Risk Flag", Text, nullable=True)
    my_recommendation: Mapped[str | None] = mapped_column("My Recommendation", Text, nullable=True)
    summary: Mapped[str | None] = mapped_column("Summary", Text, nullable=True)
    interview_questions: Mapped[str | None] = mapped_column("Interview Questions", Text, nullable=True)
    ai_confident: Mapped[str | None] = mapped_column("AI confident", Text, nullable=True)
    file_path: Mapped[str | None] = mapped_column("file_path", Text, nullable=True)
    resume_url: Mapped[str | None] = mapped_column("Resume URL", Text, nullable=True)
