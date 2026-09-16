import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterDropdown from '../components/ui/FilterDropdown';
import FileUploadZone from '../components/ui/FileUploadZone';
import { uploadResumesForScreening } from '../api/resume';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchJobs } from '../store/slices/jobsSlice';
import { invalidateHiringData } from '../store';

export default function ResumeScreening() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((s) => s.jobs.items);
  const jobsStatus = useAppSelector((s) => s.jobs.status);
  const [selectedJob, setSelectedJob] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const jobOptions = (jobs || [])
    .filter((j) => j.status === 'Published' || j.status === 'Draft')
    .map((j) => ({ value: j.id, label: `${j.title} (${j.jobCode})` }));
  const loadingJobs = jobsStatus === 'loading' && jobOptions.length === 0;

  useEffect(() => {
    dispatch(fetchJobs()).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (!selectedJob && jobOptions[0]) setSelectedJob(jobOptions[0].value);
  }, [jobOptions, selectedJob]);

  const handleStartAnalysis = async () => {
    setError('');
    setResult(null);
    if (!selectedJob) {
      setError('Please select a job before uploading resumes.');
      return;
    }
    if (files.length === 0) {
      setError('Upload at least one resume.');
      return;
    }

    setUploading(true);
    try {
      const realFiles = files.map((f) => f.file).filter(Boolean);
      const response = await uploadResumesForScreening({
        jobId: selectedJob,
        files: realFiles,
      });
      setResult(response);
      invalidateHiringData(dispatch);
      navigate('/ai-analysis', {
        state: {
          fileCount: realFiles.length,
          jobId: selectedJob,
          uploadResult: response,
        },
      });
    } catch (err) {
      setError(err.message || 'Upload / screening request failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Resume Screening</h1>
        <p className="text-slate-500 mt-1">Select a job, upload resumes, and send them to the live n8n screening workflow.</p>
      </div>

      <div>
        <h2 className="text-base font-bold text-indigo-600 mb-3">1. Select Job Position</h2>
        {loadingJobs ? (
          <p className="text-sm text-slate-500">Loading jobs from dashboard...</p>
        ) : jobOptions.length === 0 ? (
          <p className="text-sm text-amber-600">No jobs found. Create a job first, then upload resumes.</p>
        ) : (
          <FilterDropdown value={selectedJob} options={jobOptions} onChange={setSelectedJob} />
        )}
      </div>

      <div>
        <h2 className="text-base font-bold text-indigo-600 mb-3">2. Upload Resumes (Max 5)</h2>
        <FileUploadZone files={files} onFilesChange={setFiles} maxFiles={5} />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</div>
      )}

      {result && (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
          Sent to n8n ({result.n8n_status}). Client: {result.client_id} · Job: {result.job_code}
        </div>
      )}

      <div>
        <button
          onClick={handleStartAnalysis}
          disabled={uploading || !selectedJob || files.length === 0}
          className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-sm"
        >
          {uploading ? 'Sending to n8n screening...' : 'Start AI Analysis'}
        </button>
        <p className="text-center text-xs text-slate-400 mt-3">
          Live webhook: xbm.app.n8n.cloud/webhook/resume-upload · Job must be selected first.
        </p>
      </div>
    </div>
  );
}
