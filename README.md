# HireAI — AI Recruitment Platform

Frontend + FastAPI backend with **RAG resume screening**: jobs and resumes are parsed and embedded with Gemini,
stored in pgvector, and the match score comes from vector similarity.

## Flow

```
Create / edit Job
  -> parse requirements -> embed chunks -> job_chunks (pgvector)

Upload resumes (Select job)
  -> store in Supabase -> queue one message per resume (Upstash QStash)
  -> worker: extract text -> parse -> embed -> resume_chunks
  -> similarity search vs job_chunks -> Skills / Experience / Education / Stability scores
  -> Gemini writes strengths, risks, summary, interview questions
  -> candidate appears in the dashboard
```

See `backend/README.md` for the settings each step needs.

## Run backend

```bash
cd backend
.\.venv\Scripts\activate
uvicorn main:app --reload --port 8000
# or: uvicorn app.server:app --reload --port 8000
```

## Run frontend

```bash
npm install
npm run dev
```

Frontend proxies `/api` → `https://ai-hire-chi.vercel.app//`.

## Test account

Register a new account from `/register`, or use an existing one created via API.
