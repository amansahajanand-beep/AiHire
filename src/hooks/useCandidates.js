import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCandidates } from '../store/slices/candidatesSlice';
import { fetchJobs } from '../store/slices/jobsSlice';

const LIST_KEY = 'all::all';

export default function useCandidates(initialParams = {}) {
  const dispatch = useAppDispatch();
  const list = useAppSelector((s) => s.candidates.lists[LIST_KEY]);
  const jobs = useAppSelector((s) => s.jobs.items);
  const jobsStatus = useAppSelector((s) => s.jobs.status);

  const candidates = list?.items || [];
  const loading = (!list || list.status === 'loading' || list.status === 'idle') && candidates.length === 0;
  const error = list?.error ? { message: list.error } : null;

  const reload = useCallback(
    async (nextParams = {}) => {
      const merged = { ...initialParams, ...nextParams, force: true };
      const [candidateResult] = await Promise.all([
        dispatch(fetchCandidates(merged)).unwrap(),
        dispatch(fetchJobs({ force: true })).unwrap(),
      ]);
      return candidateResult;
    },
    [dispatch, initialParams]
  );

  useEffect(() => {
    dispatch(fetchCandidates(initialParams));
    if (jobsStatus === 'idle' || jobs.length === 0) {
      dispatch(fetchJobs());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  return {
    data: { candidates, source: list?.source || 'live' },
    candidates,
    jobOptions: (jobs || []).map((j) => ({ value: j.id, label: `${j.title} (${j.jobCode})` })),
    statusOptions: [
      'All',
      'Highly Recommended',
      'Shortlisted',
      'Human Review',
      'Pending',
      'Not Recommended',
      'Rejected',
    ],
    totals: null,
    loading,
    error,
    reload,
    source: list?.source || 'live',
  };
}
