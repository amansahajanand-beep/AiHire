import { useEffect, useMemo, useState } from 'react';
import {
  FileSearch, UserCheck, Briefcase, Upload, Eye, XCircle, Calendar, FileText,
} from 'lucide-react';
import Card from '../components/ui/Card';
import FilterDropdown from '../components/ui/FilterDropdown';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchHiringActivity } from '../store/slices/activitySlice';

const iconMap = { FileSearch, UserCheck, Briefcase, Upload, Eye, XCircle, FileText };

const typeColors = {
  screened: 'bg-violet-100 text-violet-600',
  shortlisted: 'bg-blue-100 text-blue-600',
  review: 'bg-indigo-100 text-indigo-600',
  upload: 'bg-emerald-100 text-emerald-600',
  job: 'bg-amber-100 text-amber-600',
  rejected: 'bg-red-100 text-red-600',
};

function formatFullTimestamp(ts) {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function HiringActivity() {
  const dispatch = useAppDispatch();
  const [typeFilter, setTypeFilter] = useState('All');
  const entry = useAppSelector((s) => s.activity.byType[typeFilter || 'All']);
  const activities = entry?.items || [];
  const loading = (!entry || entry.status === 'loading') && activities.length === 0;

  useEffect(() => {
    dispatch(fetchHiringActivity({ type: typeFilter, limit: 100 }));
  }, [dispatch, typeFilter]);

  const dateRangeLabel = useMemo(() => {
    if (!activities.length) return 'No activity yet';
    const times = activities
      .map((a) => new Date(a.timestamp).getTime())
      .filter((t) => !Number.isNaN(t));
    if (!times.length) return 'No activity yet';
    const min = new Date(Math.min(...times));
    const max = new Date(Math.max(...times));
    const fmt = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${fmt(min)} - ${fmt(max)}`;
  }, [activities]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hiring Activity</h1>
        <p className="text-slate-500 mt-1">Track all recent activities in your hiring process.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <FilterDropdown
          value={typeFilter}
          options={[
            { value: 'All', label: 'All Activities' },
            { value: 'screened', label: 'Screened' },
            { value: 'shortlisted', label: 'Shortlisted' },
            { value: 'upload', label: 'Uploads' },
            { value: 'job', label: 'Jobs' },
            { value: 'review', label: 'Reviews' },
            { value: 'rejected', label: 'Closed / Rejected' },
          ]}
          onChange={setTypeFilter}
        />
        <div className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400" />
          {dateRangeLabel}
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading activity…</div>
        ) : activities.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            No hiring activity yet. Create a job or upload resumes to get started.
          </div>
        ) : (
          <div className="space-y-0">
            {activities.map((activity, index) => {
              const Icon = iconMap[activity.icon] || FileSearch;
              return (
                <div key={activity.id} className="flex gap-4 relative">
                  {index < activities.length - 1 && (
                    <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-100" />
                  )}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${typeColors[activity.type] || 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 pb-8">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{activity.description}</p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="text-xs text-slate-400">{formatFullTimestamp(activity.timestamp)}</p>
                      <p className="text-xs font-medium text-indigo-600 mt-0.5">by {activity.user}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
