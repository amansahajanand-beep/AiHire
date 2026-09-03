import { useCallback, useEffect, useState } from 'react';
import { listCandidates } from '../api/candidates';
import { listJobs } from '../api/jobs';

export default function useCandidates(initialParams = {}) {
  const [params, setParams] = useState(initialParams);
  const [data, setData] = useState({ candidates: [], source: 'live' });
  const [jobOptions, setJobOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async (nextParams) => {
    setLoading(true);
    setError(null);
    try {
      const merged = { ...params, ...nextParams };
      setParams(merged);
      const [candidateResult, jobsResult] = await Promise.all([
        listCandidates(merged),
        listJobs(),
      ]);
      setData(candidateResult);
      setJobOptions(
        (jobsResult.jobs || []).map((j) => ({ value: j.id, label: `${j.title} (${j.jobCode})` }))
      );
      return candidateResult;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    reload(initialParams).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    candidates: data?.candidates || [],
    jobOptions,
    statusOptions: ['All', 'Shortlisted', 'Human Review', 'Pending', 'Low Match', 'Rejected'],
    totals: null,
    loading,
    error,
    reload,
    source: data?.source || 'live',
  };
}
