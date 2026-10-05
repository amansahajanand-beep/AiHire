import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { CardHeader } from '../components/ui/Card';
import LoadingState from '../components/ui/LoadingState';
import { getJob } from '../api/jobs';
import { formatDate, getStatusColor } from '../utils/helpers';

const labelClass = 'text-sm font-semibold text-slate-700 mb-1.5';
const valueClass = 'text-sm text-slate-600 whitespace-pre-wrap break-words';

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <p className={labelClass}>{label}</p>
      <div className={valueClass}>{children || '—'}</div>
    </div>
  );
}

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setJob(null);
    getJob(id)
      .then((data) => {
        if (!cancelled) setJob(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load job');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const backButton = (
    <button
      onClick={() => navigate('/jobs')}
      className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-3"
    >
      <ArrowLeft className="w-4 h-4" /> Back to Jobs
    </button>
  );

  if (loading) return <LoadingState message="Loading job..." />;

  if (error || !job) {
    return (
      <div className="w-full space-y-6">
        {backButton}
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error || 'Job not found'}
        </div>
      </div>
    );
  }

  const skills = String(job.skills || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {backButton}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{job.title}</h1>
            <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
          </div>
          <p className="text-slate-500 mt-1">Job ID: {job.jobCode || '—'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:pt-8">
          <Button variant="secondary" onClick={() => navigate(`/jobs/create?edit=${encodeURIComponent(job.id)}`)}>
            Edit Job
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="!rounded-2xl">
            <CardHeader title="Basic Information" subtitle="Core details recruiters and AI will use" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Job Title" className="md:col-span-2">{job.title}</Field>
              <Field label="Department">{job.department}</Field>
              <Field label="Location">{job.location}</Field>
              <Field label="Employment Type">{job.employmentType}</Field>
              <Field label="Experience Required">{job.experience}</Field>
              <Field label="Created On">{job.createdOn ? formatDate(job.createdOn) : ''}</Field>
              <Field label="Status">{job.status}</Field>
              <Field label="Candidates">{String(job.candidates ?? 0)}</Field>
              <Field label="Avg Match Score">{job.avgScore > 0 ? `${job.avgScore}%` : ''}</Field>
            </div>
          </Card>

          <Card className="!rounded-2xl">
            <CardHeader title="Job Description" subtitle="Description used for AI matching" />
            <p className={valueClass}>{job.description || '—'}</p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="!rounded-2xl">
            <CardHeader title="Requirements" subtitle="Skills and criteria for screening" />
            <div className="space-y-5">
              <div>
                <p className={labelClass}>Required Skills</p>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className={valueClass}>—</p>
                )}
              </div>
              <Field label="Responsibilities">{job.responsibilities}</Field>
              <Field label="Qualifications">{job.qualifications}</Field>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
