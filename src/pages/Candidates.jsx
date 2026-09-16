import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../components/ui/Card';
import SearchInput from '../components/ui/SearchInput';
import FilterDropdown from '../components/ui/FilterDropdown';
import CandidateTable from '../components/candidates/CandidateTable';
import LoadingState from '../components/ui/LoadingState';
import useCandidates from '../hooks/useCandidates';


export default function Candidates() {
  const { candidates, jobOptions, statusOptions, loading, error, source } = useCandidates();
  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('score-desc');
  const [page, setPage] = useState(1);
  const perPage = 7;

  const filtered = useMemo(() => {
    return candidates
      .filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.job.toLowerCase().includes(search.toLowerCase());
        const matchesJob = jobFilter === 'All' || c.jobId === jobFilter || c.job === jobFilter;
        const matchesStatus = statusFilter === 'All' || c.status === statusFilter || c.humanEvaluation === statusFilter;
        return matchesSearch && matchesJob && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'score-desc') return b.score - a.score;
        if (sortBy === 'score-asc') return a.score - b.score;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [candidates, search, jobFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const jobFilterOptions = [{ value: 'All', label: 'All Jobs' }, ...jobOptions];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Candidates</h1>
          <p className="text-slate-500 mt-1">View and manage all screened candidates.</p>
        </div>
        <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wide">
          {source || 'live'}
        </span>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row gap-3">
            <SearchInput
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search candidates..."
              className="flex-1"
            />
            <div className="flex flex-wrap gap-3">
              <FilterDropdown value={jobFilter} options={jobFilterOptions} onChange={(v) => { setJobFilter(v); setPage(1); }} />
              <FilterDropdown value={statusFilter} options={statusOptions} onChange={(v) => { setStatusFilter(v); setPage(1); }} />
              <FilterDropdown
                value={sortBy}
                options={[
                  { value: 'score-desc', label: 'Sort by: Match Score' },
                  { value: 'score-asc', label: 'Sort by: Score Asc' },
                  { value: 'name', label: 'Sort by: Name' },
                ]}
                onChange={setSortBy}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading candidates..." />
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">{error.message || 'Failed to load candidates'}</div>
        ) : (
          <CandidateTable candidates={paged} showJob showScreenedOn />
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Showing {filtered.length === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length} candidates
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-9 h-9 rounded-lg text-sm font-medium ${
                  page === n ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
