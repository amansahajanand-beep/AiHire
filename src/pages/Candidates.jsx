import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import Card from '../components/ui/Card';
import SearchInput from '../components/ui/SearchInput';
import FilterDropdown from '../components/ui/FilterDropdown';
import CandidateTable, { CANDIDATE_CSV_HEADERS, candidateCsvRow } from '../components/candidates/CandidateTable';
import { downloadCsv } from '../utils/csv';
import LoadingState from '../components/ui/LoadingState';
import Button from '../components/ui/Button';
import useCandidates from '../hooks/useCandidates';
import { useAppDispatch } from '../store/hooks';
import { removeCandidateThunk } from '../store/slices/candidatesSlice';
import { invalidateHiringData } from '../store';
import { getExperienceYears, matchesExperience, parseExperienceQuery } from '../utils/experience';


// Same values the table shows: the calendar date and the time of day of `screenedOn`. Missing/invalid sorts last.
function screenedParts(value) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return null;
  return {
    day: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(),
    time: d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds(),
  };
}

// "yyyy-mm-dd" from a date input -> local start (or end) of that day in ms; null when empty/invalid.
function dayBound(value, end) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return end ? new Date(y, m - 1, d, 23, 59, 59, 999).getTime() : new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

function compareScreened(a, b, primary, secondary) {
  const pa = screenedParts(a.screenedOn);
  const pb = screenedParts(b.screenedOn);
  if (!pa && !pb) return 0;
  if (!pa) return 1;
  if (!pb) return -1;
  return pb[primary] - pa[primary] || pb[secondary] - pa[secondary];
}

// No content hash is stored, and every screening gets a new id and a new resume path/file name,
// so the same candidate is recognised by email, then phone, then the original resume file name
// (without the `<candidateId>_` upload prefix) — always within the same job.
const UPLOAD_PREFIX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i;

function resumeKey(c) {
  const email = String(c.email || '').trim().toLowerCase();
  const phone = String(c.phone || '').replace(/\D/g, '');
  const file = String(c.resumeFilename || '').split('/').pop().replace(UPLOAD_PREFIX, '').trim().toLowerCase();
  const identity = email ? `email:${email}` : phone.length >= 7 ? `phone:${phone}` : file ? `file:${file}` : null;
  if (!identity) return null;
  return `${c.jobCode || c.jobId || c.job || ''}|${identity}`;
}

// The earliest completed screening of a resume stays "Completed"; later completed ones are duplicates.
function markDuplicates(candidates) {
  const completed = candidates
    .filter((c) => String(c.screeningStatus).toLowerCase() === 'completed' && resumeKey(c))
    .sort((a, b) => {
      const ta = new Date(a.screenedOn).getTime() || 0;
      const tb = new Date(b.screenedOn).getTime() || 0;
      return ta - tb || String(a.id).localeCompare(String(b.id));
    });
  const seen = new Set();
  const duplicates = new Set();
  completed.forEach((c) => {
    const key = resumeKey(c);
    if (seen.has(key)) duplicates.add(c.id);
    else seen.add(key);
  });
  return candidates.map((c) => (duplicates.has(c.id) ? { ...c, isDuplicate: true } : c));
}

// Flatten any value (string, number, array, nested object) into lowercase searchable text.
function toText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(toText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(toText).join(' ');
  return '';
}

function searchText(c) {
  return [
    c.name, c.email, c.phone, c.job, c.jobCode, c.location, c.status, c.humanEvaluation,
    c.skills, c.education, c.experienceHistory, c.strengths, c.weaknesses,
    c.summary, c.remarks, c.risk, c.resumeFilename,
  ].map(toText).join(' ').toLowerCase();
}

export default function Candidates() {
  const dispatch = useAppDispatch();
  const { candidates: rawCandidates, jobOptions, statusOptions, loading, error } = useCandidates();
  const candidates = useMemo(() => markDuplicates(rawCandidates), [rawCandidates]);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [jobFilter, setJobFilter] = useState(searchParams.get('job') || 'All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('screened-on');
  const [dateFilter, setDateFilter] = useState('All');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 7;

  const searchIndex = useMemo(() => new Map(candidates.map((c) => [c.id, searchText(c)])), [candidates]);

  const experienceYears = useMemo(() => new Map(candidates.map((c) => [c.id, getExperienceYears(c)])), [candidates]);

  const filtered = useMemo(() => {
    // Every space-separated keyword must appear somewhere in the candidate's data (case-insensitive, partial).
    // "2 years" / "5+ years" / "2.5 years" filter on the candidate's actual experience; the rest are keywords.
    const { constraints, rest } = parseExperienceQuery(search);
    const terms = rest.toLowerCase().split(/\s+/).filter(Boolean);
    // Custom Date: inclusive of the whole From day and the whole To day, on the "Screened On" value.
    const from = dateFilter === 'custom' ? dayBound(fromDate, false) : null;
    const to = dateFilter === 'custom' ? dayBound(toDate, true) : null;
    return candidates
      .filter((c) => {
        const haystack = searchIndex.get(c.id) || '';
        const years = experienceYears.get(c.id) ?? null;
        const matchesSearch =
          terms.every((term) => haystack.includes(term)) &&
          constraints.every((constraint) => matchesExperience(years, constraint));
        const matchesJob = jobFilter === 'All' || c.jobId === jobFilter || c.job === jobFilter;
        const matchesStatus = statusFilter === 'All' || c.status === statusFilter || c.humanEvaluation === statusFilter;
        let matchesDate = true;
        if (from != null || to != null) {
          const screened = new Date(c.screenedOn).getTime();
          matchesDate = Number.isFinite(screened) && (from == null || screened >= from) && (to == null || screened <= to);
        }
        return matchesSearch && matchesJob && matchesStatus && matchesDate;
      })
      .sort((a, b) => {
        if (sortBy === 'score-desc') return b.score - a.score;
        if (sortBy === 'score-asc') return a.score - b.score;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'screened-on') return compareScreened(a, b, 'day', 'time');
        if (sortBy === 'time') return compareScreened(a, b, 'time', 'day');
        return 0;
      });
  }, [candidates, searchIndex, experienceYears, search, jobFilter, statusFilter, sortBy, dateFilter, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  // After deleting the last row of a page, step back to the last page that still exists.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const closeDeleteDialog = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await dispatch(removeCandidateThunk(deleteTarget.id)).unwrap();
      invalidateHiringData(dispatch);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err?.message || 'Failed to delete candidate');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!deleteTarget) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !deleting) {
        setDeleteTarget(null);
        setDeleteError('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteTarget, deleting]);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const jobFilterOptions = [{ value: 'All', label: 'All Jobs' }, ...jobOptions];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Candidates</h1>
          <p className="text-slate-500 mt-1">View and manage all screened candidates.</p>
        </div>
        <button
          type="button"
          onClick={() => downloadCsv([CANDIDATE_CSV_HEADERS, ...filtered.map(candidateCsvRow)], 'candidates.csv')}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50 shrink-0"
        >
          <Download className="w-4 h-4 text-slate-400" />
          Download CSV
        </button>
      </div>

      <Card padding={false}>
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row gap-3">
            <SearchInput
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by keywords (skills, experience, name etc)"
              className="flex-1"
            />
            <div className="flex flex-wrap gap-3">
              <FilterDropdown value={jobFilter} options={jobFilterOptions} onChange={(v) => { setJobFilter(v); setPage(1); }} />
              <FilterDropdown value={statusFilter} options={statusOptions} onChange={(v) => { setStatusFilter(v); setPage(1); }} />
              <FilterDropdown
                value={dateFilter}
                options={[
                  { value: 'All', label: 'All Dates' },
                  { value: 'custom', label: 'Custom Date' },
                ]}
                onChange={(v) => { setDateFilter(v); setPage(1); }}
              />
              {dateFilter === 'custom' && (
                <>
                  <label className="flex items-center gap-2 text-sm text-slate-500">
                    From Date
                    <input
                      type="date"
                      value={fromDate}
                      max={toDate || undefined}
                      onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                      className="px-3 py-2 text-sm text-slate-700 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-500">
                    To Date
                    <input
                      type="date"
                      value={toDate}
                      min={fromDate || undefined}
                      onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                      className="px-3 py-2 text-sm text-slate-700 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </label>
                </>
              )}
              <FilterDropdown
                value={sortBy}
                options={[
                  { value: 'score-desc', label: 'Sort by: Match Score' },
                  { value: 'score-asc', label: 'Sort by: Score Asc' },
                  { value: 'name', label: 'Sort by: Name' },
                  { value: 'screened-on', label: 'Sort by: Screened On' },
                  { value: 'time', label: 'Sort by: Time' },
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
          <CandidateTable candidates={paged} showJob showScreenedOn onDelete={(c) => { setDeleteError(''); setDeleteTarget(c); }} />
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
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={closeDeleteDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-candidate-title"
            className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-candidate-title" className="text-base font-semibold text-slate-900">
              Are you sure you want to delete this candidate?
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 break-words">{deleteTarget.name}</p>
            {deleteError && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                {deleteError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={closeDeleteDialog} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
