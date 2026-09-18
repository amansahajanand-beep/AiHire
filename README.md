# HireAI — AI Recruitment Platform

Frontend + FastAPI dashboard backend wired to the **real** n8n screening webhook.

## Real flow

```
Login/Register (FastAPI)
  → Create Job (DB)
  → Select Job + Upload Resumes
  → FastAPI POST → https://xbm.app.n8n.cloud/webhook/resume-upload
  → n8n GET job requirements from FastAPI
  → LLM screening
  → n8n POST results back to FastAPI
  → Candidates appear in dashboard
```

## Run backend

```bash
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

## Run frontend

```bash
npm install
npm run dev
```

Frontend proxies `/api` → `https://ai-hire-one.vercel.app`.

## Test account

Register a new account from `/register`, or use an existing one created via API.
