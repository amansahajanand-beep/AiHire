import { useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Card, { CardHeader } from '../ui/Card';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchScreeningOverview } from '../../store/slices/dashboardSlice';

const SERIES = [
  { key: 'screened', name: 'Screened', color: '#6366F1', fillId: 'fillScreened' },
  { key: 'shortlisted', name: 'Shortlisted', color: '#34D399', fillId: 'fillShortlisted' },
  { key: 'hired', name: 'Hired', color: '#60A5FA', fillId: 'fillHired'    },
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
  const loading = status === 'loading' && !fetchedAt;
  const hasData = data.some((d) => d.screened || d.shortlisted || d.hired);

  const chartData = useMemo(
    () =>
      (data || []).map((point) => ({
        month: point.month,
        screened: Number(point.screened) || 0,
        shortlisted: Number(point.shortlisted) || 0,
        hired: Number(point.hired) || 0,
      })),
    [data]
  );

  const maxY = Math.max(
    5,
    ...chartData.map((d) => Math.max(d.screened, d.shortlisted, d.hired))
  );

  useEffect(() => {
    dispatch(fetchScreeningOverview({ weeks: 5 }));
  }, [dispatch]);

  return (
    <Card className="!rounded-2xl">
      <CardHeader
        title="Candidate Screening Overview"
        subtitle="Candidate movement through screening"
      />
      <div className="h-72">
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-400">Loading chart…</div>
        ) : !hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <p className="text-sm text-slate-500">No screening activity yet.</p>
            <p className="text-xs text-slate-400 mt-1">Upload resumes to see the screening graph.</p>
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
                dataKey="month"
                tick={{ fontSize: 12, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
                domain={[0, maxY]}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                iconType="circle"
              />
              {SERIES.map((series) => (
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
    </Card>
  );
}
