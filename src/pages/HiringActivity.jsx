import { useEffect, useMemo, useState } from 'react';
import {
  FileSearch, UserCheck, Briefcase, Upload, Eye, XCircle, Calendar, FileText,
  ListFilter, ChevronDown, User, Sparkles, Cloud, UserX,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchHiringActivity } from '../store/slices/activitySlice';
import { getStoredUser } from '../api/config';

const iconMap = { FileSearch, UserCheck, Briefcase, Upload, Eye, XCircle, FileText };
// Per-type icon (matches the reference design); falls back to the API-provided icon.
const typeIcon = { screened: FileSearch, shortlisted: UserCheck, rejected: UserX, upload: Cloud, job: Briefcase, review: Eye };

const typeTile = {
  screened: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  shortlisted: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  review: 'bg-sky-50 text-sky-600 border-sky-100',
  upload: 'bg-blue-50 text-blue-600 border-blue-100',
  job: 'bg-amber-50 text-amber-600 border-amber-100',
  rejected: 'bg-red-50 text-red-500 border-red-100',
};

// Bar / legend colour, label and the wording used in a day's summary line.
const typeMeta = {
  screened: { label: 'Screening', color: '#7B5CF0', unit: (n) => `${n} screened` },
  shortlisted: { label: 'Shortlisted', color: '#1FA971', unit: (n) => `${n} shortlisted` },
  rejected: { label: 'Rejected', color: '#E5484D', unit: (n) => `${n} rejected` },
  upload: { label: 'Uploads', color: '#3B82F6', unit: (n) => `${n} upload${n === 1 ? '' : 's'}` },
  job: { label: 'Jobs', color: '#E5A00D', unit: (n) => `${n} job${n === 1 ? '' : 's'}` },
  review: { label: 'Reviews', color: '#0EA5E9', unit: (n) => `${n} review${n === 1 ? '' : 's'}` },
};
const TYPE_ORDER = ['screened', 'shortlisted', 'rejected', 'upload', 'job', 'review'];
const TAB_ORDER = ['screened', 'shortlisted', 'rejected', 'upload', 'job', 'review'];
const VISIBLE_PER_DAY = 6;
const IST = 'Asia/Kolkata';

// The API sends UTC ("...Z"). A value with no timezone marker is treated as UTC so it is never read as
// the browser's local time. Everything is displayed in India Standard Time.
function parseTimestamp(ts) {
  const raw = String(ts ?? '').trim();
  return new Date(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : `${raw}Z`);
}

function formatTime(date) {
  return date
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: IST })
    .replace(' AM', ' am')
    .replace(' PM', ' pm');
}

const dayKeyOf = (date) => date.toLocaleDateString('en-CA', { timeZone: IST });

function dayParts(date) {
  return {
    month: date.toLocaleDateString('en-GB', { month: 'short', timeZone: IST }).toUpperCase(),
    day: date.toLocaleDateString('en-GB', { day: '2-digit', timeZone: IST }),
    long: date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: IST }).replace(/^(\w+) /, '$1, '),
  };
}

// Bold the subject ("Nikhil", "1 resume") in descriptions such as "Nikhil analyzed for Full Stack Developer".
const DESCRIPTION_VERB = /^(.+?)( (?:analyzed|shortlisted|rejected|moved to human review|uploaded|saved as draft|job published|position).*)$/;
function Description({ text }) {
  const m = String(text || '').match(DESCRIPTION_VERB);
  if (!m) return <>{text}</>;
  return (
    <>
      <b className="font-semibold text-slate-800">{m[1]}</b>
      {m[2]}
    </>
  );
}

export default function HiringActivity() {
  const dispatch = useAppDispatch();
  const [typeFilter, setTypeFilter] = useState('All');
  const [expanded, setExpanded] = useState({});
  const entry = useAppSelector((s) => s.activity.byType[typeFilter || 'All']);
  const allEntry = useAppSelector((s) => s.activity.byType.All);
  const activities = useMemo(() => entry?.items || [], [entry]);
  const allActivities = useMemo(() => allEntry?.items || [], [allEntry]);
  const loading = (!entry || entry.status === 'loading') && activities.length === 0;
  const currentUser = getStoredUser();

  useEffect(() => {
    dispatch(fetchHiringActivity({ type: typeFilter, limit: 100 }));
    // the full list drives the tab counts and the "This period" summary
    if (typeFilter !== 'All') dispatch(fetchHiringActivity({ type: 'All', limit: 100 }));
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

  const counts = useMemo(() => {
    const c = {};
    allActivities.forEach((a) => {
      c[a.type] = (c[a.type] || 0) + 1;
    });
    return c;
  }, [allActivities]);

  const performers = useMemo(() => {
    const c = {};
    allActivities.forEach((a) => {
      c[a.user] = (c[a.user] || 0) + 1;
    });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [allActivities]);

  // Group the (newest-first) feed by IST calendar day.
  const days = useMemo(() => {
    const map = new Map();
    activities.forEach((a) => {
      const date = parseTimestamp(a.timestamp);
      if (Number.isNaN(date.getTime())) return;
      const key = dayKeyOf(date);
      if (!map.has(key)) map.set(key, { key, date, items: [] });
      map.get(key).items.push({ ...a, date });
    });
    return Array.from(map.values());
  }, [activities]);

  const tabs = [
    { value: 'All', label: 'All Activities', icon: ListFilter, count: allActivities.length },
    ...TAB_ORDER.filter((t) => t !== 'review' || counts.review || typeFilter === 'review').map((t) => ({
      value: t,
      label: typeMeta[t].label,
      icon: typeIcon[t],
      count: counts[t] || 0,
      tone: typeTile[t].split(' ')[1],
    })),
  ];

  const total = allActivities.length;
  const legend = TYPE_ORDER.filter((t) => t !== 'review' || counts.review);

  const rangePill = (
    <div className="inline-flex items-center gap-2 px-3 h-9 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 shadow-[0_1px_2px_rgba(18,18,28,0.04)] font-mono">
      <Calendar className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.8} />
      {dateRangeLabel}
    </div>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-x-6 gap-y-5 items-start">
      <div className="space-y-5 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-none">Hiring Activity</h1>
            <p className="text-sm text-slate-500 mt-2.5">Track all recent activities in your hiring process.</p>
          </div>
          <div className="xl:hidden">{rangePill}</div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const active = typeFilter === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setTypeFilter(tab.value)}
                className={`inline-flex items-center gap-2 h-9 px-3 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#12121C] border-[#12121C] text-white'
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : tab.tone || 'text-slate-600'}`} strokeWidth={1.8} />
                {tab.label}
                <span className={`font-mono text-[10px] ${active ? 'text-white/70' : 'text-slate-400'}`}>{tab.count}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white py-12 text-center text-sm text-slate-400">Loading activity…</div>
        ) : activities.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white py-12 text-center text-sm text-slate-400">
            No hiring activity yet. Create a job or upload resumes to get started.
          </div>
        ) : (
          <div className="space-y-5">
            {days.map((day) => {
              const parts = dayParts(day.date);
              const showAll = expanded[day.key];
              const visible = showAll ? day.items : day.items.slice(0, VISIBLE_PER_DAY);
              const hidden = day.items.length - visible.length;
              const tally = {};
              day.items.forEach((i) => {
                tally[i.type] = (tally[i.type] || 0) + 1;
              });
              const summary = TYPE_ORDER.filter((t) => tally[t]).map((t) => typeMeta[t].unit(tally[t])).join(' · ');
              return (
                <section key={day.key} className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)] overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/60 border-b border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-11 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center leading-none shrink-0">
                        <span className="font-mono text-[8.5px] text-red-500 tracking-wider">{parts.month}</span>
                        <span className="text-[15px] font-semibold text-slate-900 mt-0.5">{parts.day}</span>
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-[13px] font-semibold text-slate-900">{parts.long}</h2>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{summary}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10.5px] text-slate-500 bg-slate-100 rounded-md px-2 py-1 shrink-0">
                      {day.items.length} event{day.items.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="px-5 pt-5">
                    {visible.map((activity, index) => {
                      const Icon = typeIcon[activity.type] || iconMap[activity.icon] || FileSearch;
                      const isAi = activity.user === 'AI System';
                      const last = index === visible.length - 1;
                      return (
                        <div key={activity.id} className="flex gap-3.5 relative">
                          {!last && <div className="absolute left-[15px] top-9 bottom-1 w-px bg-slate-200" />}
                          <span className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${typeTile[activity.type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                          </span>
                          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 pb-5">
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-slate-900 leading-tight">{activity.title}</p>
                              <p className="text-xs text-slate-500 mt-1 break-words"><Description text={activity.description} /></p>
                            </div>
                            <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1.5 shrink-0">
                              <span className="text-[11px] tabular-nums text-slate-600">{formatTime(activity.date)}</span>
                              <span
                                className={`inline-flex items-center gap-1 h-5 px-1.5 rounded-md text-[10px] font-medium ${
                                  isAi ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isAi ? <Sparkles className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                                {activity.user}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {hidden > 0 && (
                      <div className="pb-5 pl-[46px]">
                        <button
                          onClick={() => setExpanded({ ...expanded, [day.key]: true })}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50"
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> Show {hidden} more events
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <aside className="space-y-4 min-w-0 xl:sticky xl:top-[76px]">
        <div className="hidden xl:flex justify-end">{rangePill}</div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(18,18,28,0.04)]">
          <p className="font-mono text-[9.5px] tracking-wider text-slate-500">THIS PERIOD</p>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-[30px] font-bold tracking-tight tabular-nums text-slate-900 leading-none">{total}</span>
            <span className="text-xs text-slate-500">events logged</span>
          </p>
          <div className="mt-3 flex h-1.5 gap-px rounded-full overflow-hidden bg-slate-100">
            {legend.filter((t) => counts[t]).map((t) => (
              <span key={t} style={{ width: `${(counts[t] / total) * 100}%`, backgroundColor: typeMeta[t].color }} />
            ))}
          </div>
          <ul className="mt-4 space-y-2.5">
            {legend.map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-xs">
                <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: typeMeta[t].color }} />
                <span className="flex-1 text-slate-600">{typeMeta[t].label}</span>
                <span className="font-medium tabular-nums text-slate-900">{counts[t] || 0}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(18,18,28,0.04)]">
          <p className="font-mono text-[9.5px] tracking-wider text-slate-500">PERFORMED BY</p>
          <ul className="mt-4 space-y-3.5">
            {performers.length === 0 && <li className="text-xs text-slate-400">No activity yet</li>}
            {performers.map(([name, n]) => {
              const isAi = name === 'AI System';
              return (
                <li key={name} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                    {isAi ? <Sparkles className="w-3.5 h-3.5" /> : name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 min-w-0 leading-tight">
                    <span className="block text-xs font-semibold text-slate-900 truncate">{name}</span>
                    <span className="block text-[10.5px] text-slate-500 mt-0.5">{isAi ? 'Automated screening' : currentUser?.role || 'Admin'}</span>
                  </span>
                  <span className="text-xs font-medium tabular-nums text-slate-900">{n}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
