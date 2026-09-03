import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import ScreeningChart from '../components/dashboard/ScreeningChart';
import HiringPipeline from '../components/dashboard/HiringPipeline';
import RecentCandidates from '../components/dashboard/RecentCandidates';
import TopJobs from '../components/dashboard/TopJobs';
import { getStoredUser } from '../api/config';
import { getDashboardTotals } from '../api/candidates';
import { getGreeting } from '../utils/helpers';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const firstName = user?.name?.split(' ')[0] || 'there';
  const [stats, setStats] = useState([
    { title: 'Jobs Added This Month', value: '—', change: null, trend: null, icon: 'Briefcase' },
    { title: 'Candidates Screened', value: '—', change: null, trend: null, icon: 'Users' },
    { title: 'Awaiting Human Review', value: '—', change: null, trend: null, icon: 'UserCheck' },
    { title: 'Average Match Score', value: '—', change: null, trend: null, icon: 'Target' },
  ]);

  useEffect(() => {
    getDashboardTotals()
      .then((t) => {
        setStats([
          { title: 'Jobs Added This Month', value: String(t.jobsAdded ?? 0), change: null, trend: null, icon: 'Briefcase' },
          { title: 'Candidates Screened', value: String(t.candidatesScreened ?? 0), change: null, trend: null, icon: 'Users' },
          { title: 'Awaiting Human Review', value: String(t.awaitingReview ?? 0), change: null, trend: null, icon: 'UserCheck' },
          { title: 'Average Match Score', value: `${t.averageMatchScore ?? 0}%`, change: null, trend: null, icon: 'Target' },
        ]);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            {user?.client_id
              ? `Client ID: ${user.client_id} · Live n8n screening connected`
              : "Here's what's happening with your hiring today."}
          </p>
        </div>
        <button
          onClick={() => navigate('/jobs/create')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Job
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ScreeningChart />
        </div>
        <HiringPipeline />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentCandidates />
        </div>
        <TopJobs />
      </div>
    </div>
  );
}
