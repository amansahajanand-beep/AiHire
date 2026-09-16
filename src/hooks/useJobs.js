import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createJobThunk, fetchJobs } from '../store/slices/jobsSlice';
import { invalidateHiringData } from '../store';

export default function useJobs() {
  const dispatch = useAppDispatch();
  const { items, status, error, source, fetchedAt } = useAppSelector((s) => s.jobs);

  const loading = (status === 'loading' || status === 'idle') && items.length === 0;

  const reload = useCallback(async () => {
    return dispatch(fetchJobs({ force: true })).unwrap();
  }, [dispatch]);

  const addJob = useCallback(
    async (payload) => {
      const result = await dispatch(createJobThunk(payload)).unwrap();
      invalidateHiringData(dispatch);
      await dispatch(fetchJobs({ force: true }));
      return result;
    },
    [dispatch]
  );

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  return {
    jobs: items,
    loading,
    error: error ? { message: error } : null,
    source: source || 'live',
    reload,
    addJob,
    fetchedAt,
  };
}
