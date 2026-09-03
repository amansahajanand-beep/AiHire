import { apiPostForm } from './client';

/**
 * Upload resumes for a selected job.
 * Frontend → FastAPI → REAL n8n webhook:
 * https://xbm.app.n8n.cloud/webhook/resume-upload
 *
 * Requires job_id (client must select job before upload).
 */
export async function uploadResumesForScreening({ jobId, files }) {
  if (!jobId) throw new Error('Please select a job before uploading resumes.');
  if (!files?.length) throw new Error('At least one resume is required.');

  const form = new FormData();
  form.append('job_id', jobId);
  files.forEach((file) => {
    form.append('files', file);
  });

  return apiPostForm('/api/screening/upload', form);
}

/** @deprecated use uploadResumesForScreening */
export async function uploadResumeFile({ file, jobId }) {
  return uploadResumesForScreening({ jobId, files: [file] });
}
