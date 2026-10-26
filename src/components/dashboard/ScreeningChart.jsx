import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
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
  { key: 'screened', name: 'Screened', color: '#7C6AE8', fillId: 'fillScreened' },
  { key: 'shortlisted', name: 'Shortlisted', color: '#2FA66E', fillId: 'fillShortlisted' },
  { key: 'review', name: 'Move to Review', color: '#E7A100', fillId: 'fillReview' },
  { key: 'rejected', name: 'Rejected', color: '#E5484D', fillId: 'fillRejected' },
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
  const totals = Object.fromEntries(SERIES.map((series) => [series.key, chartData.reduce((sum, d) => sum + d[series.key], 0)]));
  const peak = Math.max(4, ...chartData.flatMap((d) => visible.map((s) => d[s.key])));
  const maxY = Math.ceil(peak / 4) * 4; // four even gridline steps
  const yTicks = [0, 1, 2, 3, 4].map((i) => (maxY / 4) * i);

  useEffect(() => {
    dispatch(fetchScreeningOverview({ period }));
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const changePeriod = (next) => {
    if (next !== period) dispatch(fetchScreeningOverview({ period: next }));
  };

  return (
    <Card className="!rounded-2xl !p-0 h-full flex flex-col">
      <div className="px-6 pt-5">
        <CardHeader
          title="Candidate Screening Overview"
          subtitle="Candidate movement through screening"
          className="flex-wrap gap-y-3"
          action={<PeriodTabs value={period} onChange={changePeriod} />}
        />

        <div className="flex flex-wrap items-start gap-x-8 gap-y-3 pb-1">
          {SERIES.map((series) => {
            const dimmed = focus && focus !== series.key;
            return (
              <button
                key={series.key}
                type="button"
                onClick={() => setFocus(focus === series.key ? null : series.key)}
                title={focus === series.key ? 'Show all' : `Show only ${series.name}`}
                className={`text-left transition-opacity ${dimmed ? 'opacity-40' : ''}`}
              >
                <span className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="w-2 h-2 rounded-[3px]" style={{ backgroundColor: series.color }} />
                  {series.name}
                </span>
                <span className="block text-[22px] font-semibold tracking-tight tabular-nums text-slate-900 mt-1.5">
                  {totals[series.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`flex-1 min-h-[300px] px-3 pb-4 transition-opacity ${refreshing ? 'opacity-50' : ''}`}>
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-400">Loading chart…</div>
        ) : !hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <p className="text-sm text-slate-500">No screening activity in this period.</p>
            <p className="text-xs text-slate-400 mt-1">Upload resumes or try a wider range.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 12, left: -14, bottom: 0 }} barGap={-20} barCategoryGap="20%">
              <CartesianGrid stroke="#ECECF1" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#6E6E7E', fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false}
                tickLine={false}
                dy={6}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9A9AA8', fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false}
                tickLine={false}
                domain={[0, maxY]}
                ticks={yTicks}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(124,106,232,0.06)' }} />
              {visible.map((series) => (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  name={series.name}
                  fill={series.color}
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
