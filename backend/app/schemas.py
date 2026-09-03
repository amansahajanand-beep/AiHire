from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field, model_validator


# ── Auth (matches frontend Login / Register fields) ──────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    confirmPassword: str | None = Field(default=None, alias="confirmPassword")
    confirm_password: str | None = None
    company: str | None = None

    model_config = {"populate_by_name": True}

    @model_validator(mode="after")
    def passwords_match(self):
        confirm = self.confirmPassword or self.confirm_password
        if confirm is not None and confirm != self.password:
            raise ValueError("Passwords do not match")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    client_id: str
    name: str
    email: EmailStr
    company: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ── Jobs (matches frontend Create Job fields) ────────────────────────────────

class JobCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    department: str | None = None
    location: str | None = None
    employmentType: str | None = Field(default="Full-time", alias="employmentType")
    type: str | None = None  # frontend field name fallback
    experience: str | None = None
    description: str | None = None
    skills: str | None = None
    responsibilities: str | None = None
    qualifications: str | None = None
    status: str = "Published"

    model_config = {"populate_by_name": True}

    @property
    def employment_type(self) -> str:
        return self.employmentType or self.type or "Full-time"


class JobUpdate(BaseModel):
    title: str | None = None
    department: str | None = None
    location: str | None = None
    employmentType: str | None = None
    experience: str | None = None
    description: str | None = None
    skills: str | None = None
    responsibilities: str | None = None
    qualifications: str | None = None
    status: str | None = None

    model_config = {"populate_by_name": True}


class JobOut(BaseModel):
    id: str
    job_code: str
    client_id: str
    title: str
    department: str | None = None
    location: str | None = None
    employment_type: str
    experience: str | None = None
    description: str | None = None
    skills: str | None = None
    responsibilities: str | None = None
    qualifications: str | None = None
    status: str
    candidates: int = 0
    avgScore: float = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class JobRequirementOut(BaseModel):
    """Payload n8n fetches before LLM screening."""
    job_id: str
    job_code: str
    client_id: str
    title: str
    description: str | None = None
    skills: str | None = None
    responsibilities: str | None = None
    qualifications: str | None = None
    experience: str | None = None
    location: str | None = None
    employment_type: str
    department: str | None = None


# ── Candidates / Screening ───────────────────────────────────────────────────

class CandidateWorkflowUpdate(BaseModel):
    humanEvaluation: str | None = Field(default=None, alias="humanEvaluation")
    human_evaluation: str | None = None
    humanNote: str | None = Field(default=None, alias="humanNote")
    human_note: str | None = None
    availability: str | None = None

    model_config = {"populate_by_name": True}


class CandidateOut(BaseModel):
    id: str
    job_id: str
    client_id: str
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    job: str | None = None
    score: float | None = None
    status: str
    screening_status: str
    resume_filename: str | None = None
    strengths: list[Any] | None = None
    weaknesses: list[Any] | None = None
    breakdown: dict[str, Any] | None = None
    remarks: str | None = None
    risk: str | None = None
    human_evaluation: str | None = None
    human_note: str | None = None
    availability: str | None = None
    screened_on: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ScreeningResultIn(BaseModel):
    """n8n posts screening result back to dashboard DB."""
    client_id: str
    job_id: str
    candidate_id: str | None = None
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    resume_filename: str | None = None
    score: float | None = None
    status: str | None = "Pending"
    strengths: list[Any] | None = None
    weaknesses: list[Any] | None = None
    breakdown: dict[str, Any] | None = None
    remarks: str | None = None
    risk: str | None = None
    raw_result: dict[str, Any] | None = None
    screening_status: str = "completed"


class UploadResponse(BaseModel):
    message: str
    client_id: str
    job_id: str
    job_code: str
    uploaded: list[dict[str, Any]]
    n8n_status: str
    n8n_response: Any | None = None


class DashboardTotals(BaseModel):
    jobsAdded: int
    candidatesScreened: int
    awaitingReview: int
    averageMatchScore: float
