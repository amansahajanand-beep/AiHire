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

export async function getScreeningOverview({ weeks = 5 } = {}) {
  const data = await apiGet(`/api/dashboard/screening-overview?weeks=${weeks}`);
  return data?.points || [];
}

export async function getHiringPipeline() {
  const data = await apiGet('/api/dashboard/pipeline');
  return data?.stages || [];
}

export async function getHiringActivity({ type, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (type && type !== 'All') params.set('type', type);
  if (limit) params.set('limit', String(limit));
  const qs = params.toString() ? `?${params}` : '';
  const data = await apiGet(`/api/hiring-activity${qs}`);
  return data?.activities || [];
}

function mapCandidate(c) {
  const breakdown = c.breakdown || {};
  return {
    id: c.id,
    name: c.name || c.resume_filename || 'Candidate',
    email: c.email || '',
    phone: c.phone || '',
    job: c.job || c.applied_role || '',
    jobId: c.job_id,
    jobCode: c.job_code,
    location: c.location || '',
    score: c.score ?? 0,
    status: c.human_evaluation || c.status || 'Pending',
    screeningStatus: c.screening_status,
    screenedOn: c.screened_on || c.created_at,
    resumeFilename: c.resume_filename,
    resumeUrl: c.resume_url,
    strengths: c.strengths || [],
    weaknesses: c.weaknesses || [],
    breakdown: {
      skills: breakdown.skills ?? 0,
      experience: breakdown.experience ?? 0,
      education: breakdown.education ?? 0,
      stability: breakdown.stability ?? breakdown.keywords ?? 0,
      overall: breakdown.overall ?? c.score ?? 0,
    },
    scoreDetails: c.score_details || {},
    remarks: c.remarks || c.summary,
    summary: c.summary || c.remarks,
    risk: c.risk,
    growthPattern: c.growth_pattern,
    interviewQuestions: c.interview_questions || [],
    aiConfidence: c.ai_confidence,
    humanEvaluation: c.human_evaluation,
    humanNote: c.human_note,
    availability: c.availability,
    skills: c.skills || [],
    education: c.education || [],
    experienceHistory: c.experience_history || c.experienceHistory || [],
    raw: c,
  };
}
