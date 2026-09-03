import { apiGet, apiPostJson, apiPatchJson, apiDelete } from './client';

export async function listJobs(params = {}) {
  const qs = params.status ? `?status_filter=${encodeURIComponent(params.status)}` : '';
  const jobs = await apiGet(`/api/jobs${qs}`);
  return {
    jobs: (jobs || []).map(mapJob),
    source: 'live',
  };
}

export async function createJob(job = {}) {
  const created = await apiPostJson('/api/jobs', {
    title: job.title,
    department: job.department,
    location: job.location,
    employmentType: job.employmentType || job.type || 'Full-time',
    experience: job.experience,
    description: job.description,
    skills: job.skills,
    responsibilities: job.responsibilities,
    qualifications: job.qualifications,
    status: job.status || 'Published',
  });
  return { ok: true, job: mapJob(created), source: 'live' };
}

export async function getJob(jobId) {
  const job = await apiGet(`/api/jobs/${jobId}`);
  return mapJob(job);
}

export async function updateJob(jobId, payload) {
  const job = await apiPatchJson(`/api/jobs/${jobId}`, payload);
  return mapJob(job);
}

export async function deleteJob(jobId) {
  return apiDelete(`/api/jobs/${jobId}`);
}

function mapJob(job) {
  return {
    id: job.id,
    jobCode: job.job_code,
    clientId: job.client_id,
    title: job.title,
    department: job.department,
    location: job.location,
    type: job.employment_type,
    employmentType: job.employment_type,
    experience: job.experience,
    description: job.description,
    skills: job.skills,
    responsibilities: job.responsibilities,
    qualifications: job.qualifications,
    status: job.status,
    candidates: job.candidates || 0,
    avgScore: job.avgScore || 0,
    createdOn: job.created_at,
    raw: job,
  };
}
