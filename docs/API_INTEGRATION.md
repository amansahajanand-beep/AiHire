# Xousia Portal API Integration

This frontend talks to three n8n webhooks. All calls are **POST** with JSON bodies (except resume file upload, which uses `multipart/form-data`).

## Endpoints

| Purpose | URL | Operations |
|--------|-----|------------|
| Candidates / dashboard / resume download / status updates | `https://xousia3.app.n8n.cloud/webhook/portal/gateway` | `list`, `report`, `resume`, `update_workflow` |
| Upload new resume PDF | `https://xousia3.app.n8n.cloud/webhook/portal/resume` | upload file |
| Jobs | `https://xousia3.app.n8n.cloud/webhook/portal/jobs` | `list_jobs`, `create_job` |

## Frontend → API mapping

| UI action | API |
|-----------|-----|
| Dashboard load / KPI totals | `gateway` → `list` (totals) and/or `report` |
| Candidates page load / search / filter | `gateway` → `list` |
| Open / download resume | `gateway` → `resume` |
| Update Human Evaluation / Note / Availability | `gateway` → `update_workflow` |
| Upload resume(s) in Resume Screening | `resume` webhook |
| Jobs page | `jobs` → `list_jobs` |
| Create Job | `jobs` → `create_job` |

## Auth / client identity (required)

n8n workflows are usually scoped per client sheet/Drive folder. The portal must send a client key on every request.

Configure in `.env`:

```env
VITE_API_MODE=live
VITE_GATEWAY_URL=https://xousia3.app.n8n.cloud/webhook/portal/gateway
VITE_RESUME_UPLOAD_URL=https://xousia3.app.n8n.cloud/webhook/portal/resume
VITE_JOBS_URL=https://xousia3.app.n8n.cloud/webhook/portal/jobs
VITE_CLIENT_ID=your-client-id
VITE_API_TOKEN=your-token-if-required
```

`VITE_API_MODE=mock` keeps the current static UI working without calling n8n.

## Assumed request shapes

These match the operations you described. Adjust field names in `src/api/` once you share a real sample response.

### gateway — list
```json
{
  "operation": "list",
  "clientId": "...",
  "search": "",
  "job": "",
  "status": "",
  "sortBy": "score-desc",
  "page": 1,
  "pageSize": 25
}
```
Expected useful fields in response:
- `candidates[]` (name, job, score, status, screenedOn, resumeFileId, humanEvaluation, humanNote, availability, …)
- `filters` / `jobOptions` / `statusOptions`
- `totals` (jobs, screened, awaitingReview, avgMatchScore)
- `scores` / pipeline counts

### gateway — report
```json
{ "operation": "report", "clientId": "...", "from": "2024-05-01", "to": "2024-05-30" }
```

### gateway — resume
```json
{ "operation": "resume", "clientId": "...", "candidateId": "...", "fileId": "..." }
```
Response: `{ "fileName": "...", "mimeType": "application/pdf", "base64": "..." }`  
Workflow verifies the file is inside the authorized Drive folder before returning it.

### gateway — update_workflow
```json
{
  "operation": "update_workflow",
  "clientId": "...",
  "candidateId": "...",
  "humanEvaluation": "Shortlisted",
  "humanNote": "Strong React background",
  "availability": "30 days"
}
```

### resume upload
`multipart/form-data`:
- `clientId`
- `jobId` / `jobTitle` (if required by workflow)
- `file` (PDF)

### jobs — list_jobs / create_job
```json
{ "operation": "list_jobs", "clientId": "..." }
```
```json
{
  "operation": "create_job",
  "clientId": "...",
  "title": "Frontend Developer",
  "location": "Remote",
  "description": "...",
  "skills": "React, TypeScript",
  "status": "Published"
}
```

## CORS

Browsers cannot call n8n if CORS is blocked. Options:
1. Enable CORS on the n8n webhooks for your portal origin, or
2. Use the Vite proxy in `vite.config.js` (already prepared) so the browser calls `/api/...` on the same origin.

## What to send next (to finalize field mapping)

Please share one sample JSON for each of:
1. `list` response
2. `report` response
3. `resume` response
4. `list_jobs` response
5. Required auth headers / body fields (`clientId`, token, etc.)

With those samples we can replace the assumed field names and wire Dashboard / Candidates / Jobs / Resume Screening fully to live data.
