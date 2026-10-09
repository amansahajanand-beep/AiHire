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

  return (
    <Card className="!rounded-2xl">
      <CardHeader
        title="Hiring Pipeline"
        action={<PeriodTabs value={period} onChange={changePeriod} options={PIPELINE_PERIODS} />}
      />

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">Loading pipeline…</div>
      ) : stages.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">No pipeline data for this period.</div>
      ) : (
        <div className={`space-y-4 pt-1 transition-opacity ${refreshing ? 'opacity-50' : ''}`}>
          {stages.map((stage) => {
            const width = Math.max(6, Math.round(((stage.count || 0) / maxCount) * 100));
            return (
              <div key={stage.stage}>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <p className="text-sm font-medium text-slate-700">{stage.stage}</p>
                  <p className="text-sm font-semibold text-slate-900 tabular-nums">{stage.count}</p>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${width}%`, backgroundColor: stage.color || '#6366F1' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
