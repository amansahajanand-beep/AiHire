import { useCallback, useEffect, useState } from 'react';
import { listJobs, createJob } from '../api/jobs';

export default function useJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('mock');

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listJobs();
      setJobs(result.jobs || []);
      setSource(result.source);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addJob = useCallback(async (payload) => {
    const result = await createJob(payload);
    await reload();
    return result;
  }, [reload]);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  return { jobs, loading, error, source, reload, addJob };
}
