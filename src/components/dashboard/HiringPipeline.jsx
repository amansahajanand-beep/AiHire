import { useEffect, useMemo } from 'react';
import Card, { CardHeader } from '../ui/Card';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchHiringPipeline } from '../../store/slices/dashboardSlice';

export default function HiringPipeline() {
  const dispatch = useAppDispatch();
  const stages = useAppSelector((s) => s.dashboard.pipeline);
  const status = useAppSelector((s) => s.dashboard.pipelineStatus);
  const fetchedAt = useAppSelector((s) => s.dashboard.pipelineFetchedAt);
  const loading = status === 'loading' && !fetchedAt;

  useEffect(() => {
    dispatch(fetchHiringPipeline());
  }, [dispatch]);

  const maxCount = useMemo(
    () => Math.max(1, ...stages.map((s) => s.count || 0)),
    [stages]
  );
  const inProgress = stages[0]?.count ?? stages.reduce((sum, s) => sum + (s.count || 0), 0);

  return (
    <Card className="!rounded-2xl">
      <CardHeader
        title="Hiring Pipeline"
        subtitle={`${inProgress} candidates in progress`}
      />

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">Loading pipeline…</div>
      ) : stages.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-400">No pipeline data yet.</div>
      ) : (
        <div className="space-y-4 pt-1">
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
