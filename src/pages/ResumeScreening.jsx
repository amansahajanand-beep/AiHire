import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ChevronsUpDown, Megaphone, Sparkles, Info } from 'lucide-react';
import useClickOutside from '../hooks/useClickOutside';
import FileUploadZone from '../components/ui/FileUploadZone';
import { uploadResumesForScreening } from '../api/resume';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchJobs } from '../store/slices/jobsSlice';
import { invalidateHiringData } from '../store';
import { formatFileSize } from '../utils/helpers';

const MAX_FILES = 10;
const MAX_TOTAL_MB = 20;

// Rich job picker: same value / options / onChange contract as the previous dropdown.
function JobSelect({ value, jobs, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  const current = jobs.find((j) => j.id === value);
  const row = (job) => (
    <>
      <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        <Megaphone className="w-4 h-4" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-slate-900 truncate">{job.title}</span>
        <span className="block font-mono text-[10.5px] text-slate-500 mt-0.5 truncate">
          {job.jobCode} · {job.candidates || 0} candidates screened
        </span>
      </span>
    </>
  );
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 text-left p-3 rounded-2xl border bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)] transition-colors ${
          open ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {current ? row(current) : <span className="flex-1 text-[13px] text-slate-500">Select a job</span>}
        <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(18,18,28,0.18)]"
        >
          {jobs.map((job) => (
            <li
              key={job.id}
              role="option"
              aria-selected={job.id === value}
              onClick={() => {
                onChange(job.id);
                setOpen(false);
              }}
              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-indigo-50/70 ${job.id === value ? 'bg-indigo-50/60' : ''}`}
            >
              {row(job)}
              {job.id === value && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" strokeWidth={2.4} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ResumeScreening() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((s) => s.jobs.items);
  const jobsStatus = useAppSelector((s) => s.jobs.status);
  const [searchParams] = useSearchParams();
  const [selectedJob, setSelectedJob] = useState(searchParams.get('job') || '');
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

  const selectableJobs = (jobs || []).filter((j) => j.status === 'Published' || j.status === 'Draft');
  const selectedJobObj = selectableJobs.find((j) => j.id === selectedJob);
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const estMinutes = Math.max(1, Math.ceil((files.length * 30) / 60));
  const step = uploading ? 3 : files.length > 0 ? 2 : 1;
  const canStart = !uploading && selectedJob && files.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-lg bg-indigo-50 text-[11px] font-medium text-indigo-700">
            <Sparkles className="w-3 h-3" /> AI Screening
          </span>
          <h1 className="mt-3 text-[28px] font-bold text-slate-900 tracking-tight leading-none">AI Resume Screening</h1>
          <p className="text-sm text-slate-500 mt-2.5">Select a job, upload resumes, and send them for AI screening.</p>
        </div>
        <ol className="flex items-center gap-1 self-start lg:self-auto overflow-x-auto max-w-full rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-[0_1px_2px_rgba(18,18,28,0.04)] text-[11.5px] font-medium">
          {['Select job', 'Upload resumes', 'AI analysis'].map((label, i) => (
            <li key={label} className="flex items-center gap-1">
              <span className={`inline-flex items-center gap-2 h-8 pl-1.5 pr-3 rounded-xl ${step === i + 1 ? 'bg-indigo-50 text-slate-900' : 'text-slate-500'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${step === i + 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                <span className="whitespace-nowrap">{label}</span>
              </span>
              {i < 2 && <span className="text-slate-300 px-0.5">›</span>}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(18,18,28,0.04)]">
            <h2 className="flex items-center gap-2.5 text-[14px] font-semibold tracking-tight text-slate-900 mb-4">
              <span className="font-mono text-[10px] font-semibold text-indigo-600 bg-indigo-50 rounded-md px-1.5 py-1">01</span>
              Select Job Position
            </h2>
            {loadingJobs ? (
              <p className="text-sm text-slate-500">Loading jobs from dashboard...</p>
            ) : jobOptions.length === 0 ? (
              <p className="text-sm text-amber-600">No jobs found. Create a job first, then upload resumes.</p>
            ) : (
              <JobSelect value={selectedJob} jobs={selectableJobs} onChange={setSelectedJob} />
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(18,18,28,0.04)]">
            <h2 className="flex items-center gap-2.5 text-[14px] font-semibold tracking-tight text-slate-900 mb-4">
              <span className="font-mono text-[10px] font-semibold text-indigo-600 bg-indigo-50 rounded-md px-1.5 py-1">02</span>
              <span>Upload Resumes <span className="font-normal text-slate-500">(Max {MAX_FILES})</span></span>
            </h2>
            <FileUploadZone files={files} onFilesChange={setFiles} maxFiles={MAX_FILES} />
          </section>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>
          )}

          {result && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              Submitted to screening engine. Job: {result.job_code}
            </div>
          )}
        </div>

        <div className="space-y-4 min-w-0 xl:sticky xl:top-[76px]">
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)] overflow-hidden">
            <div className="p-5">
              <p className="font-mono text-[9.5px] tracking-wider text-slate-500">SCREENING BATCH</p>
              <p className="mt-3 flex items-baseline gap-1.5">
                <span className="text-xs text-slate-600">Uploaded:</span>
                <span className="text-[26px] font-bold tracking-tight tabular-nums text-slate-900 leading-none">{files.length}</span>
                <span className="text-sm text-slate-400">/ {MAX_FILES}</span>
              </p>
              <div className="mt-3 grid grid-cols-10 gap-1">
                {Array.from({ length: MAX_FILES }).map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full ${i < files.length ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                ))}
              </div>
              <dl className="mt-5 space-y-3 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Job</dt>
                  <dd className="font-medium text-slate-900 truncate">{selectedJobObj ? selectedJobObj.title : '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Total size</dt>
                  <dd className="font-mono text-[11px] text-slate-900">{formatFileSize(totalBytes)} / {MAX_TOTAL_MB} MB</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Est. time</dt>
                  <dd className="font-mono text-[11px] text-slate-900">{files.length ? `~${estMinutes} min` : '–'}</dd>
                </div>
              </dl>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/50 p-5">
              <button
                onClick={handleStartAnalysis}
                disabled={!canStart}
                className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-200 disabled:cursor-not-allowed text-white text-[13px] font-semibold transition-colors shadow-[0_1px_2px_rgba(107,71,230,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] disabled:shadow-none"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {uploading ? 'Submitting to screening engine...' : 'Start AI Analysis'}
              </button>
              {files.length === 0 && <p className="text-[11px] text-slate-500 text-center mt-3">Upload at least one resume to begin</p>}
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200/70 bg-amber-50/60 p-3.5 text-[11.5px] leading-relaxed text-amber-900/80">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
            AI-generated results may be inaccurate. Please verify before making hiring decisions.
          </div>
        </div>
      </div>
    </div>
  );
}
