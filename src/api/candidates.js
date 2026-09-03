import { apiGet, apiPatchJson } from './client';

export async function listCandidates({ jobId, status } = {}) {
  const params = new URLSearchParams();
  if (jobId) params.set('job_id', jobId);
  if (status) params.set('status_filter', status);
  const qs = params.toString() ? `?${params}` : '';
  const rows = await apiGet(`/api/candidates${qs}`);
  return {
    candidates: (rows || []).map(mapCandidate),
    source: 'live',
  };
}

export async function getCandidate(candidateId) {
  const row = await apiGet(`/api/candidates/${candidateId}`);
  return mapCandidate(row);
}

export async function updateCandidateWorkflow(candidateId, payload) {
  const row = await apiPatchJson(`/api/candidates/${candidateId}/workflow`, {
    humanEvaluation: payload.humanEvaluation,
    humanNote: payload.humanNote,
    availability: payload.availability,
  });
  return mapCandidate(row);
}

export async function getDashboardTotals() {
  return apiGet('/api/dashboard/totals');
}

function mapCandidate(c) {
  return {
    id: c.id,
    name: c.name || c.resume_filename || 'Candidate',
    email: c.email || '',
    phone: c.phone || '',
    job: c.job || '',
    jobId: c.job_id,
    score: c.score ?? 0,
    status: c.human_evaluation || c.status || 'Pending',
    screeningStatus: c.screening_status,
    screenedOn: c.screened_on || c.created_at,
    resumeFilename: c.resume_filename,
    strengths: c.strengths || [],
    weaknesses: c.weaknesses || [],
    breakdown: c.breakdown || {
      skills: c.score || 0,
      experience: c.score || 0,
      education: c.score || 0,
      keywords: c.score || 0,
      overall: c.score || 0,
    },
    remarks: c.remarks,
    risk: c.risk,
    humanEvaluation: c.human_evaluation,
    humanNote: c.human_note,
    availability: c.availability,
    skills: [],
    education: [],
    experienceHistory: [],
    raw: c,
  };
}
