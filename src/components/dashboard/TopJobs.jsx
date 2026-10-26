import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Code2 } from 'lucide-react';
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
  const totalCandidates = useMemo(() => jobs.reduce((sum, j) => sum + (j.candidates || 0), 0), [jobs]);

  return (
    <Card className="!rounded-2xl h-full">
      <CardHeader
        title="Top Jobs"
        subtitle="Roles attracting the most candidates"
        action={
          <button onClick={() => navigate('/jobs')} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
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
        <div className="space-y-3">
          {top.map((job) => {
            const share = totalCandidates ? Math.round(((job.candidates || 0) / totalCandidates) * 100) : 0;
            return (
              <button
                key={job.id}
                onClick={() => navigate('/jobs')}
                className="w-full rounded-xl border border-slate-200/80 bg-white p-3 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <Code2 className="w-4 h-4 text-indigo-600" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{job.title}</p>
                    <p className="font-mono text-[10.5px] text-slate-500">{job.jobCode}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-600"><span className="font-semibold text-slate-900">{job.candidates}</span> Candidates</span>
                  <span className="font-mono text-slate-500">{share}%</span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-600" style={{ width: `${share}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
