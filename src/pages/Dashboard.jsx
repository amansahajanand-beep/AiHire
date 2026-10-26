import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Plus } from 'lucide-react';
import StatCard, { StatStrip } from '../components/dashboard/StatCard';
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
        { title: 'Jobs Added This Month', value: '—', caption: 'This month', icon: 'Briefcase' },
        { title: 'Candidates Screened', value: '—', caption: 'This month', icon: 'FileText' },
        { title: 'Awaiting Human Review', value: '—', caption: 'Human review', icon: 'UserCheck' },
        { title: 'Average Match Score', value: '—', icon: 'Target' },
        getHiringTimeCard(),
      ];
    }
    return [
      {
        title: 'Jobs Added This Month',
        value: String(totals.jobsAdded ?? 0),
        caption: 'This month',
        icon: 'Briefcase',
        subtitle: totals.jobsAdded ? 'From your job board' : 'No data this month',
      },
      {
        title: 'Candidates Screened',
        value: String(totals.candidatesScreened ?? 0),
        caption: 'This month',
        icon: 'FileText',
        subtitle: totals.candidatesScreened ? 'AI screened resumes' : 'No data this month',
      },
      {
        title: 'Awaiting',
        value: String(totals.awaitingReview ?? 0),
        caption: 'Human review',
        detail: `${totals.humanReviewed ?? 0} reviewed of ${totals.candidatesScreened ?? 0} screened`,
        progress: totals.candidatesScreened ? ((totals.humanReviewed ?? 0) / totals.candidatesScreened) * 100 : 0,
        link: { to: '/candidates', label: 'Review' },
        icon: 'UserCheck',
      },
      {
        title: 'Average Match Score',
        value: `${totals.averageMatchScore ?? 0}%`,
        icon: 'Target',
        dashes: Number(totals.averageMatchScore) || 0,
        caption: `Across ${totals.candidatesScreened ?? 0} candidates`,
        subtitle: totals.candidatesScreened ? 'Across screened candidates' : 'No data this month',
      },
      getHiringTimeCard(totals),
    ];
  }, [totals]);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const headline = stats.filter((stat) => stat.variant !== 'productivity');
  const productivity = stats.find((stat) => stat.variant === 'productivity');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">{today.replace(/,? /, ' · ').toUpperCase()}</p>
          <h1 className="text-[28px] sm:text-[32px] font-bold text-slate-900 tracking-tight leading-none">Recruitment Overview</h1>
          <p className="text-sm text-slate-500 mt-2.5">
            Track your hiring performance and candidate pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-2 px-3.5 h-9 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-800 shadow-[0_1px_2px_rgba(18,18,28,0.04)]">
            <CalendarDays className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.8} />
            This month
          </span>
          <button
            onClick={() => navigate('/jobs/create')}
            className="inline-flex items-center justify-center gap-2 px-4 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold shadow-[0_1px_2px_rgba(107,71,230,0.45),inset_0_1px_0_rgba(255,255,255,0.2)]"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.4} /> Create Job
          </button>
        </div>
      </div>

      {/* Each row is [main | 340px side] with both cards stretched to the same height, so edges line up. */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-stretch">
        <StatStrip>
          {headline.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </StatStrip>
        {productivity && <StatCard {...productivity} />}

        <ScreeningChart />
        <HiringPipeline />

        <RecentCandidates />
        <TopJobs />
      </div>
    </div>
  );
}
