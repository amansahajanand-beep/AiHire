/**
 * Normalize n8n / Google Sheet payloads into the shapes the HireAI UI already uses.
 * Field names are flexible — update aliases here when real samples arrive.
 */

function pick(obj, keys, fallback = undefined) {
  if (!obj || typeof obj !== 'object') return fallback;
  for (const key of keys) {
    if (obj[key] != null && obj[key] !== '') return obj[key];
  }
  return fallback;
}

function toNumber(value, fallback = 0) {
  const n = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

export function mapCandidate(row, index = 0) {
  const id = String(pick(row, ['id', 'ID', 'candidateId', 'Candidate ID', 'rowId'], index + 1));
  const name = pick(row, ['name', 'Name', 'candidateName', 'Candidate Name'], 'Unknown');
  const job = pick(row, ['job', 'Job', 'jobTitle', 'Job Title', 'Applied Job', 'appliedJob'], '');
  const score = toNumber(pick(row, ['score', 'Score', 'matchScore', 'Match Score', 'AI Score'], 0));
  const status = pick(row, ['status', 'Status', 'humanEvaluation', 'Human Evaluation', 'workflowStatus'], 'Pending');

  return {
    id,
    name,
    email: pick(row, ['email', 'Email', 'workEmail'], ''),
    phone: pick(row, ['phone', 'Phone'], ''),
    job,
    jobId: String(pick(row, ['jobId', 'Job ID', 'job_id'], '')),
    score,
    status,
    screenedOn: pick(row, ['screenedOn', 'Screened On', 'screened_on', 'date'], ''),
    experience: pick(row, ['experience', 'Experience'], ''),
    location: pick(row, ['location', 'Location'], ''),
    avatar: null,
    humanEvaluation: pick(row, ['humanEvaluation', 'Human Evaluation'], status),
    humanNote: pick(row, ['humanNote', 'Human Note', 'notes', 'Notes'], ''),
    availability: pick(row, ['availability', 'Availability', 'noticePeriod', 'Notice Period', 'projectedAvailability'], ''),
    resumeFileId: pick(row, ['resumeFileId', 'Resume File ID', 'fileId', 'File ID', 'driveFileId'], ''),
    resumeFileName: pick(row, ['resumeFileName', 'Resume', 'resume', 'fileName'], ''),
    strengths: Array.isArray(row.strengths) ? row.strengths : [],
    weaknesses: Array.isArray(row.weaknesses) ? row.weaknesses : [],
    breakdown: row.breakdown || {
      skills: toNumber(pick(row, ['skillsScore', 'Skills'], score)),
      experience: toNumber(pick(row, ['experienceScore', 'Experience Score'], score)),
      education: toNumber(pick(row, ['educationScore', 'Education'], score)),
      keywords: toNumber(pick(row, ['keywordsScore', 'Keywords'], score)),
      overall: score,
    },
    skills: Array.isArray(row.skills) ? row.skills : String(pick(row, ['skills', 'Skills'], '')).split(',').map((s) => s.trim()).filter(Boolean),
    education: Array.isArray(row.education) ? row.education : [],
    experienceHistory: Array.isArray(row.experienceHistory) ? row.experienceHistory : [],
    raw: row,
  };
}

export function mapJob(row, index = 0) {
  return {
    id: String(pick(row, ['id', 'ID', 'jobId', 'Job ID'], index + 1)),
    title: pick(row, ['title', 'Title', 'jobTitle', 'Job Title', 'name'], 'Untitled Job'),
    department: pick(row, ['department', 'Department'], ''),
    location: pick(row, ['location', 'Location'], ''),
    type: pick(row, ['type', 'Type', 'employmentType', 'Employment Type'], 'Full-time'),
    experience: pick(row, ['experience', 'Experience', 'experienceRequired'], ''),
    candidates: toNumber(pick(row, ['candidates', 'Candidates', 'candidateCount'], 0)),
    avgScore: toNumber(pick(row, ['avgScore', 'Avg Match Score', 'averageMatchScore'], 0)),
    status: pick(row, ['status', 'Status'], 'Draft'),
    createdOn: pick(row, ['createdOn', 'Created On', 'created_at', 'date'], ''),
    description: pick(row, ['description', 'Description', 'jobDescription'], ''),
    skills: Array.isArray(row.skills)
      ? row.skills
      : String(pick(row, ['skills', 'Skills', 'requiredSkills'], '')).split(',').map((s) => s.trim()).filter(Boolean),
    responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
    qualifications: Array.isArray(row.qualifications) ? row.qualifications : [],
    raw: row,
  };
}

export function mapListResponse(data) {
  const root = Array.isArray(data) ? { candidates: data } : data || {};
  const rows = root.candidates || root.items || root.data || root.rows || [];
  const candidates = rows.map(mapCandidate);

  const totals = root.totals || root.dashboard || root.stats || {};
  const jobOptionsRaw = root.jobOptions || root.jobs || root.filters?.jobs || [];
  const jobOptions = (Array.isArray(jobOptionsRaw) ? jobOptionsRaw : []).map((j, i) => {
    if (typeof j === 'string') return { value: j, label: j };
    return {
      value: String(pick(j, ['value', 'id', 'jobId'], i + 1)),
      label: pick(j, ['label', 'title', 'jobTitle', 'name'], `Job ${i + 1}`),
    };
  });

  return {
    candidates,
    jobOptions,
    statusOptions: root.statusOptions || root.filters?.statuses || ['All', 'Shortlisted', 'Human Review', 'Pending', 'Low Match', 'Rejected'],
    totals: {
      jobsAdded: toNumber(pick(totals, ['jobsAdded', 'jobs', 'Jobs Added This Month'], 0)),
      candidatesScreened: toNumber(pick(totals, ['candidatesScreened', 'screened', 'Candidates Screened'], candidates.length)),
      awaitingReview: toNumber(pick(totals, ['awaitingReview', 'humanReview', 'Awaiting Human Review'], 0)),
      averageMatchScore: toNumber(pick(totals, ['averageMatchScore', 'avgScore', 'Average Match Score'], 0)),
    },
    scores: root.scores || null,
    pipeline: root.pipeline || root.hiringPipeline || null,
    raw: root,
  };
}

export function mapJobsResponse(data) {
  const root = Array.isArray(data) ? { jobs: data } : data || {};
  const rows = root.jobs || root.items || root.data || root.rows || [];
  return {
    jobs: rows.map(mapJob),
    raw: root,
  };
}

export function openBase64Pdf(base64, fileName = 'resume.pdf') {
  const cleaned = String(base64 || '').replace(/^data:application\/pdf;base64,/, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.target = '_blank';
  a.click();
  URL.revokeObjectURL(url);
}
