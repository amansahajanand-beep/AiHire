from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.routers import auth, jobs, screening, internal

settings = get_settings()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="HireAI Dashboard API — Auth, Jobs, Screening orchestration with n8n",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(screening.router)
app.include_router(internal.router)


@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "status": "ok",
        "docs": "/docs",
        "flow": [
            "POST /api/auth/register",
            "POST /api/auth/login",
            "POST /api/jobs",
            "POST /api/screening/upload (job_id + resumes) → n8n webhook",
            "GET /api/internal/jobs/{job_id}/requirements (n8n)",
            "POST /api/internal/screening-results (n8n)",
            "GET /api/candidates",
        ],
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
