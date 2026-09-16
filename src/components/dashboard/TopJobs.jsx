import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchJobs } from '../../store/slices/jobsSlice';

export default function TopJobs() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const jobs = useAppSelector((s) => s.jobs.items);
  const status = useAppSelector((s) => s.jobs.status);
  const fetchedAt = useAppSelector((s) => s.jobs.fetchedAt);
  const loading = status === 'loading' && !fetchedAt;

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  const top = useMemo(
    () => [...jobs].sort((a, b) => (b.candidates || 0) - (a.candidates || 0)).slice(0, 5),
    [jobs]
  );

  return (
    <Card className="!rounded-2xl">
      <CardHeader
        title="Top Jobs"
        subtitle="Roles attracting the most candidates"
        action={
          <button onClick={() => navigate('/jobs')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View all
          </button>
        }
      />

      {top.length === 0 ? (
        <div className="py-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
            <Briefcase className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">
            {loading ? 'Loading jobs…' : 'No jobs yet. Create your first job.'}
          </p>
          {!loading && (
            <button
              onClick={() => navigate('/jobs/create')}
              className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
            >
              Create job
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {top.map((job) => (
            <button
              key={job.id}
              onClick={() => navigate('/jobs')}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{job.title}</p>
                <p className="text-xs text-slate-400">{job.candidates} Candidates · {job.jobCode}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
