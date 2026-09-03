# HireAI Dashboard Backend (FastAPI)

Master system for:
**Client Login → Job Create → Resume Upload → n8n Screening → Results in Dashboard DB**

## Flow

```
CLIENT LOGIN (client_id issued)
     ↓
CREATE JOB (job_id + job_code + requirements in DB)
     ↓
SELECT JOB + UPLOAD RESUMES
     ↓
POST /api/screening/upload
     ↓
Dashboard → n8n webhook (client_id + job_id + resumes)
     ↓
n8n → GET /api/internal/jobs/{job_id}/requirements
     ↓
LLM Screening
     ↓
n8n → POST /api/internal/screening-results
     ↓
Dashboard shows candidates under that Job ID
```

n8n webhook used for resume upload:
`https://xbm.app.n8n.cloud/webhook/resume-upload`

## Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # or cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

## Auth APIs (match frontend)

### Register
`POST /api/auth/register`
```json
{
  "name": "Aman Sharma",
  "email": "aman@company.com",
  "password": "secret123",
  "confirmPassword": "secret123"
}
```
Response includes `access_token`, `user.client_id`.

### Login
`POST /api/auth/login`
```json
{
  "email": "aman@company.com",
  "password": "secret123"
}
```

### Me
`GET /api/auth/me`  
Header: `Authorization: Bearer <token>`

## Job APIs (match frontend Create Job)

### Create job
`POST /api/jobs`
```json
{
  "title": "Senior Frontend Developer",
  "department": "Engineering",
  "location": "Remote",
  "employmentType": "Full-time",
  "experience": "5+ years",
  "description": "...",
  "skills": "React, TypeScript",
  "responsibilities": "...",
  "qualifications": "...",
  "status": "Published"
}
```

### List / get / update / delete
- `GET /api/jobs`
- `GET /api/jobs/{job_id}`
- `GET /api/jobs/{job_id}/requirements`
- `PATCH /api/jobs/{job_id}`
- `DELETE /api/jobs/{job_id}`

## Screening

### Upload resumes (job must be selected)
`POST /api/screening/upload` (multipart)
- `job_id` (form field) — required
- `files` (1–5 PDF/DOC/DOCX)

Dashboard creates candidate rows, then POSTs to n8n with:
`client_id`, `job_id`, `job_code`, `job_title`, `candidate_ids`, `files`

### Candidates
- `GET /api/candidates?job_id=`
- `GET /api/candidates/{id}`
- `PATCH /api/candidates/{id}/workflow` `{ humanEvaluation, humanNote, availability }`
- `GET /api/dashboard/totals`

## n8n Internal APIs

Header required: `X-API-Key: <N8N_API_KEY from .env>`

1. Fetch requirements for LLM:
`GET /api/internal/jobs/{job_id}/requirements`

2. Save screening result:
`POST /api/internal/screening-results`
```json
{
  "client_id": "CLI-XXXX",
  "job_id": "...",
  "candidate_id": "...",
  "name": "John Smith",
  "score": 92,
  "status": "Shortlisted",
  "strengths": ["Strong React"],
  "weaknesses": ["No AWS"],
  "breakdown": { "skills": 95, "experience": 88, "education": 82, "keywords": 91, "overall": 92 },
  "remarks": "...",
  "risk": "Low"
}
```

## Notes

- Client / Job / Requirements live in **SQLite DB** (`hireai.db`), not Google Sheets.
- Google Sheet nodes in n8n should be replaced by these Dashboard APIs.
- Change `SECRET_KEY` and `N8N_API_KEY` before production.
