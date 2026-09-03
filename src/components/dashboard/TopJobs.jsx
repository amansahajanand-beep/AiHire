import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import { listJobs } from '../../api/jobs';

export default function TopJobs() {
  const navigate = useNavigate();
  const [top, setTop] = useState([]);

  useEffect(() => {
    listJobs()
      .then((res) => {
        const sorted = [...(res.jobs || [])].sort((a, b) => (b.candidates || 0) - (a.candidates || 0)).slice(0, 5);
        setTop(sorted);
      })
      .catch(() => setTop([]));
  }, []);

  return (
    <Card>
      <CardHeader
        title="Top Jobs"
        action={
          <button onClick={() => navigate('/jobs')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View all
          </button>
        }
      />
      <div className="space-y-3">
        {top.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No jobs yet. Create your first job.</p>
        ) : (
          top.map((job) => (
            <div key={job.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{job.title}</p>
                <p className="text-xs text-slate-400">{job.candidates} Candidates · {job.jobCode}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
