import { useEffect, useMemo } from 'react';
import Card, { CardHeader } from '../ui/Card';
import PeriodTabs, { PERIODS } from './PeriodTabs';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchHiringPipeline } from '../../store/slices/dashboardSlice';

const PIPELINE_PERIODS = [{ id: 'all', label: 'All' }, ...PERIODS];

export default function HiringPipeline() {
  const dispatch = useAppDispatch();
  const stages = useAppSelector((s) => s.dashboard.pipeline);
  const status = useAppSelector((s) => s.dashboard.pipelineStatus);
  const fetchedAt = useAppSelector((s) => s.dashboard.pipelineFetchedAt);
  const period = useAppSelector((s) => s.dashboard.pipelinePeriod);
  const loading = status === 'loading' && !fetchedAt;
  const refreshing = status === 'loading' && !!fetchedAt;

  useEffect(() => {
    dispatch(fetchHiringPipeline({ period }));
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const changePeriod = (next) => {
    if (next !== period) dispatch(fetchHiringPipeline({ period: next }));
  };

  const maxCount = useMemo(
    () => Math.max(1, ...stages.map((s) => s.count || 0)),
    [stages]
  );

  const total = stages[0]?.count || 0;

  return (
    <Card className="!rounded-2xl h-full flex flex-col">
      <CardHeader title="Hiring Pipeline" className="!mb-3" />
      <PeriodTabs value={period} onChange={changePeriod} options={PIPELINE_PERIODS} stretch />
      <p className="mt-4 mb-4 flex items-baseline gap-1.5">
        <span className="text-[28px] font-bold tracking-tight tabular-nums text-slate-900 leading-none">{total}</span>
        <span className="text-xs text-slate-500">profiles in pipeline</span>
      </p>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">Loading pipeline…</div>
      ) : stages.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">No pipeline data for this period.</div>
      ) : (
        <div className={`flex-1 flex flex-col justify-evenly gap-3 pb-1 transition-opacity ${refreshing ? 'opacity-50' : ''}`}>
          {stages.map((stage) => {
            const pct = maxCount ? Math.round(((stage.count || 0) / maxCount) * 100) : 0;
            const color = stage.color || '#7C6AE8';
            return (
              <div key={stage.stage} className="grid grid-cols-[104px_1fr_28px] items-center gap-3">
                <p className="flex items-center gap-2 text-xs text-slate-700 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="truncate">{stage.stage}</span>
                </p>
                <div className="relative h-5 rounded-md bg-slate-100 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-md transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      minWidth: pct ? 3 : 0,
                      backgroundColor: `${color}26`,
                      borderRight: `2px solid ${color}`,
                    }}
                  />
                  <span className="absolute inset-y-0 left-2 flex items-center font-mono text-[10px] text-slate-600">{pct}%</span>
                </div>
                <p className="text-xs font-semibold text-slate-900 tabular-nums text-right">{stage.count}</p>
              </div>
            );
          })}
        </div>
      )}

    </Card>
  );
}
