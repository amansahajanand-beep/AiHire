import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import ScreeningChart from '../components/dashboard/ScreeningChart';
import HiringPipeline from '../components/dashboard/HiringPipeline';
import RecentCandidates from '../components/dashboard/RecentCandidates';
import TopJobs from '../components/dashboard/TopJobs';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchDashboardTotals } from '../store/slices/dashboardSlice';

function formatDuration(hours = 0, seconds = 0) {
  const totalSeconds = seconds || hours * 3600;
  if (!totalSeconds || totalSeconds <= 0) return '0m';
  if (totalSeconds < 60) return `${Math.round(totalSeconds)}s`;
  if (totalSeconds < 3600) {
    const mins = totalSeconds / 60;
    return mins < 10 ? `${mins.toFixed(1)}m` : `${Math.round(mins)}m`;
  }
  return `${(totalSeconds / 3600).toFixed(1)}h`;
}

function formatAvgMinutes(avgMinutes = 0, avgSeconds = 0) {
  const seconds = avgSeconds || avgMinutes * 60;
  if (!seconds || seconds <= 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${(seconds / 60).toFixed(1)} min`;
}

function getHiringTimeCard(totals = {}) {
  const totalSeconds = totals.totalAiSeconds ?? 0;
  const avgSeconds = totals.avgAiSeconds ?? 0;
  const savedHours = totals.timeSavedHours ?? 0;

  return {
    title: 'Productivity',
    value: formatDuration(0, totalSeconds),
    change: null,
    trend: null,
    icon: 'Gauge',
    variant: 'productivity',
    metrics: [
      { label: 'Total Time', value: formatDuration(0, totalSeconds) },
      {
        label: 'Avg. Time/Candidate',
        value: formatAvgMinutes(totals.avgAiMinutes, avgSeconds),
      },
      { label: 'Time Saved', value: formatDuration(savedHours) },
    ],
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const totals = useAppSelector((s) => s.dashboard.totals);

  useEffect(() => {
    dispatch(fetchDashboardTotals());
  }, [dispatch]);

  const stats = useMemo(() => {
    if (!totals) {
      return [
        { title: 'Jobs Added This Month', value: '—', icon: 'Briefcase' },
        { title: 'Candidates Screened', value: '—', icon: 'FileText' },
        { title: 'Awaiting Human Review', value: '—', icon: 'UserCheck' },
        { title: 'Average Match Score', value: '—', icon: 'Target' },
        getHiringTimeCard(),
      ];
    }
    return [
      {
        title: 'Jobs Added This Month',
        value: String(totals.jobsAdded ?? 0),
        icon: 'Briefcase',
        subtitle: totals.jobsAdded ? 'From your job board' : 'No data this month',
      },
      {
        title: 'Candidates Screened',
        value: String(totals.candidatesScreened ?? 0),
        icon: 'FileText',
        subtitle: totals.candidatesScreened ? 'AI screened resumes' : 'No data this month',
      },
      {
        title: 'Awaiting Human Review',
        value: String(totals.awaitingReview ?? 0),
        icon: 'UserCheck',
        subtitle: totals.awaitingReview ? 'Needs your decision' : 'No data this month',
      },
      {
        title: 'Average Match Score',
        value: `${totals.averageMatchScore ?? 0}%`,
        icon: 'Target',
        subtitle: totals.candidatesScreened ? 'Across screened candidates' : 'No data this month',
      },
      getHiringTimeCard(totals),
    ];
  }, [totals]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recruitment Overview</h1>
          <p className="text-slate-500 mt-1">
            Track your hiring performance and candidate pipeline.
          </p>
        </div>
        <button
          onClick={() => navigate('/jobs/create')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Job
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
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
