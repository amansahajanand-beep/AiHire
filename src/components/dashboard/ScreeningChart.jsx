import { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Card, { CardHeader } from '../ui/Card';
import PeriodTabs from './PeriodTabs';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchScreeningOverview } from '../../store/slices/dashboardSlice';

const SERIES = [
  { key: 'screened', name: 'Screened', color: '#6366F1', fillId: 'fillScreened' },
  { key: 'shortlisted', name: 'Shortlisted', color: '#34D399', fillId: 'fillShortlisted' },
  { key: 'review', name: 'Move to Review', color: '#F59E0B', fillId: 'fillReview' },
  { key: 'rejected', name: 'Rejected', color: '#FB7185', fillId: 'fillRejected' },
];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg">
      <p className="text-xs font-semibold text-slate-500 mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-semibold text-slate-900 tabular-nums">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScreeningChart() {
  const dispatch = useAppDispatch();
  const data = useAppSelector((s) => s.dashboard.overview);
  const status = useAppSelector((s) => s.dashboard.overviewStatus);
  const fetchedAt = useAppSelector((s) => s.dashboard.overviewFetchedAt);
  const period = useAppSelector((s) => s.dashboard.overviewPeriod);
  // null = every series; otherwise only that series (click a legend item to isolate it, click again to reset)
  const [focus, setFocus] = useState(null);
  const loading = status === 'loading' && !fetchedAt;
  const refreshing = status === 'loading' && !!fetchedAt;

  const chartData = useMemo(
    () =>
      (data || []).map((point) => ({
        label: point.month,
        screened: Number(point.screened) || 0,
        shortlisted: Number(point.shortlisted) || 0,
        review: Number(point.review) || 0,
        rejected: Number(point.rejected) || 0,
      })),
    [data]
  );

  const visible = SERIES.filter((s) => !focus || s.key === focus);
  const hasData = chartData.some((d) => SERIES.some((s) => d[s.key]));
  const maxY = Math.max(5, ...chartData.flatMap((d) => visible.map((s) => d[s.key])));

  useEffect(() => {
    dispatch(fetchScreeningOverview({ period }));
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const changePeriod = (next) => {
    if (next !== period) dispatch(fetchScreeningOverview({ period: next }));
  };

  return (
    <Card className="!rounded-2xl">
      <CardHeader
        title="Candidate Screening Overview"
        subtitle="Candidate movement through screening"
        action={<PeriodTabs value={period} onChange={changePeriod} />}
      />
      <div className={`h-72 transition-opacity ${refreshing ? 'opacity-50' : ''}`}>
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-400">Loading chart…</div>
        ) : !hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <p className="text-sm text-slate-500">No screening activity in this period.</p>
            <p className="text-xs text-slate-400 mt-1">Upload resumes or try a wider range.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
              <defs>
                {SERIES.map((series) => (
                  <linearGradient key={series.fillId} id={series.fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={series.color} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={series.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
                dy={6}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
                domain={[0, maxY]}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              {visible.map((series) => (
                <Area
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.name}
                  stroke={series.color}
                  strokeWidth={2.5}
                  fill={`url(#${series.fillId})`}
                  dot={{ r: 3.5, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3">
        {SERIES.map((series) => {
          const dimmed = focus && focus !== series.key;
          return (
            <button
              key={series.key}
              type="button"
              onClick={() => setFocus(focus === series.key ? null : series.key)}
              title={focus === series.key ? 'Show all' : `Show only ${series.name}`}
              className={`inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium transition-opacity hover:bg-slate-50 ${
                dimmed ? 'opacity-40' : 'text-slate-600'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: series.color }} />
              {series.name}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
