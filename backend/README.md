# HireAI Dashboard Backend (FastAPI)

Master system for:
**Client Login → Job Create → Resume Upload → RAG Screening → Results in Dashboard DB**

## Flow

```
CLIENT LOGIN (client_id issued)
     ↓
CREATE / EDIT JOB  → parse requirements → Gemini embeddings → job_chunks (pgvector)
     ↓
SELECT JOB + UPLOAD RESUMES
     ↓
POST /api/screening/upload   (stores files, queues one message per resume, returns at once)
     ↓
QStash → POST /api/internal/screen-resume   (one resume per call, signed, retried)
     ↓
extract text → parse → embed → resume_chunks → similarity search against job_chunks
     ↓
scores: Skills 40 / Experience 30 / Education 15 / Stability 15  (deterministic, app/rag/scoring.py)
     ↓
Gemini writes the report text (strengths, risks, summary, career progression, interview questions)
     ↓
Dashboard shows candidates under that Job ID
```

Settings (see `.env.example`): `GEMINI_API_KEY`, `GEMINI_EMBED_MODEL`, `GEMINI_CHAT_MODEL`, `EMBED_DIM`,
`BACKEND_PUBLIC_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`.
Without a QStash token (local development) resumes are screened in a background task instead.
Existing jobs need embeddings once: `python scripts/backfill_job_embeddings.py`.

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
uvicorn main:app --reload --port 8000
# or: uvicorn app.server:app --reload --port 8000
```

API docs: https://ai-hire-chi.vercel.app///docs

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

The dashboard creates a candidate row per file (status `processing`) and queues it for screening.
The candidates list shows `processing` until the worker finishes, then `completed` or `failed`.

### Candidates
- `GET /api/candidates?job_id=`
- `GET /api/candidates/{id}`
- `PATCH /api/candidates/{id}/workflow` `{ humanEvaluation, humanNote, availability }`
- `GET /api/dashboard/totals`

## Worker endpoint

`POST /api/internal/screen-resume` is called by QStash only (checked with the `Upstash-Signature` header).
Body: `{ "candidate_id": "..." }`. It returns 200 when done or permanently failed, and 503 for a temporary error so
QStash retries.

## Notes

- Client / Job / Requirements live in **SQLite DB** (`hireai.db`), not Google Sheets.
- Change `SECRET_KEY` before production.
