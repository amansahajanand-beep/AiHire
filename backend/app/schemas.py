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
    job_id: str | None = None
    job_code: str | None = None
    client_id: str | None = None
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    job: str | None = None
    location: str | None = None
    score: float | None = None
    status: str
    screening_status: str
    resume_filename: str | None = None
    resume_url: str | None = None
    strengths: list[Any] | None = None
    weaknesses: list[Any] | None = None
    breakdown: dict[str, Any] | None = None
    score_details: dict[str, Any] | None = None
    remarks: str | None = None
    summary: str | None = None
    risk: str | None = None
    growth_pattern: str | None = None
    interview_questions: list[str] | None = None
    ai_confidence: str | None = None
    human_evaluation: str | None = None
    human_note: str | None = None
    availability: str | None = None
    screened_on: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ScreeningResultIn(BaseModel):
    """n8n posts screening result into Screened profile table (flexible aliases)."""
    client_id: str | None = Field(default=None, alias="Client ID")
    job_id: str | None = None
    job_code: str | None = Field(default=None, alias="Job code")
    candidate_id: str | None = None
    row_id: str | None = None

    name: str | None = Field(default=None, alias="Candidate name")
    candidate_name: str | None = None
    email: str | None = Field(default=None, alias="Email")
    phone: str | None = Field(default=None, alias="Mobile number")
    mobile_number: str | None = None
    applied_role: str | None = Field(default=None, alias="Applied role")
    location: str | None = Field(default=None, alias="Current location")
    current_location: str | None = None
    timestamp: str | None = Field(default=None, alias="Timestamp")

    experience_score: str | float | int | None = Field(default=None, alias="Experience Score")
    skill_score: str | float | int | None = Field(default=None, alias="Skill Score")
    stability_score: str | float | int | None = Field(default=None, alias="Stability Score")
    education_score: str | float | int | None = Field(default=None, alias="Education score")
    total_score: str | float | int | None = Field(default=None, alias="Total Score")
    score: float | None = None

    growth_pattern: str | None = Field(default=None, alias="Growth Pattern")
    projected_availability: str | None = Field(default=None, alias="Projected availability")
    availability: str | None = None
    risk_flag: str | None = Field(default=None, alias="Risk Flag")
    risk: str | None = None
    my_recommendation: str | None = Field(default=None, alias="My Recommendation")
    status: str | None = "Pending"
    summary: str | None = Field(default=None, alias="Summary")
    remarks: str | None = None
    interview_questions: Any | None = Field(default=None, alias="Interview Questions")
    ai_confident: str | None = Field(default=None, alias="AI confident")
    ai_confidence: str | None = None
    file_path: str | None = None
    resume_filename: str | None = None
    resume_url: str | None = Field(default=None, alias="Resume URL")

    strengths: list[Any] | None = None
    weaknesses: list[Any] | None = None
    breakdown: dict[str, Any] | None = None
    raw_result: dict[str, Any] | None = None
    screening_status: str = "completed"

    model_config = {"populate_by_name": True, "extra": "allow"}

    def as_profile_payload(self) -> dict[str, Any]:
        data = self.model_dump(by_alias=False, exclude_none=False)
        # Prefer canonical field names for helper
        if not data.get("candidate_name") and data.get("name"):
            data["candidate_name"] = data["name"]
        if not data.get("mobile_number") and data.get("phone"):
            data["mobile_number"] = data["phone"]
        if not data.get("current_location") and data.get("location"):
            data["current_location"] = data["location"]
        if not data.get("total_score") and data.get("score") is not None:
            data["total_score"] = data["score"]
        if not data.get("risk_flag") and data.get("risk"):
            data["risk_flag"] = data["risk"]
        if not data.get("projected_availability") and data.get("availability"):
            data["projected_availability"] = data["availability"]
        if not data.get("summary") and data.get("remarks"):
            data["summary"] = data["remarks"]
        if not data.get("ai_confident") and data.get("ai_confidence"):
            data["ai_confident"] = data["ai_confidence"]
        if not data.get("file_path") and data.get("resume_filename"):
            data["file_path"] = data["resume_filename"]
        if not data.get("my_recommendation") and data.get("status"):
            data["my_recommendation"] = data["status"]
        return data


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
    # Real AI timing: created_at (upload/API start) → screened_on (result received)
    timedCandidates: int = 0
    totalAiSeconds: float = 0.0
    avgAiSeconds: float = 0.0
    totalAiHours: float = 0.0
    avgAiMinutes: float = 0.0
    timeSavedHours: float = 0.0


class ScreeningChartPoint(BaseModel):
    month: str
    screened: int
    shortlisted: int
    hired: int


class ScreeningOverviewResponse(BaseModel):
    points: list[ScreeningChartPoint]


class PipelineStage(BaseModel):
    stage: str
    count: int
    color: str


class PipelineResponse(BaseModel):
    stages: list[PipelineStage]


class HiringActivityItem(BaseModel):
    id: str
    type: str
    title: str
    description: str
    user: str
    timestamp: str
    icon: str


class HiringActivityResponse(BaseModel):
    activities: list[HiringActivityItem]
