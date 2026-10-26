import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpDown, Briefcase, CalendarDays, Download, FileSearch, ListFilter } from 'lucide-react';
import Card from '../components/ui/Card';
import SearchInput from '../components/ui/SearchInput';
import FilterDropdown from '../components/ui/FilterDropdown';
import CandidateTable, { CANDIDATE_CSV_HEADERS, candidateCsvRow } from '../components/candidates/CandidateTable';
import { downloadCsv } from '../utils/csv';
import LoadingState from '../components/ui/LoadingState';
import useCandidates from '../hooks/useCandidates';
import { recommendationBucket } from '../utils/recommendation';
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
  const { candidates: rawCandidates, jobOptions, statusOptions, loading, error } = useCandidates();
  const candidates = useMemo(() => markDuplicates(rawCandidates), [rawCandidates]);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [jobFilter, setJobFilter] = useState(searchParams.get('job') || 'All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('screened-on');
  const [bucket, setBucket] = useState('all');
  const [dateFilter, setDateFilter] = useState('All');
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
        const matchesBucket = bucket === 'all' || recommendationBucket(c.status) === bucket;
        const matchesStatus = statusFilter === 'All' || c.status === statusFilter || c.humanEvaluation === statusFilter;
        let matchesDate = true;
        if (from != null || to != null) {
          const screened = new Date(c.screenedOn).getTime();
          matchesDate = Number.isFinite(screened) && (from == null || screened >= from) && (to == null || screened <= to);
        }
        return matchesSearch && matchesJob && matchesStatus && matchesDate && matchesBucket;
      })
      .sort((a, b) => {
        if (sortBy === 'score-desc') return b.score - a.score;
        if (sortBy === 'score-asc') return a.score - b.score;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'screened-on') return compareScreened(a, b, 'day', 'time');
        if (sortBy === 'time') return compareScreened(a, b, 'time', 'day');
        return 0;
      });
  }, [candidates, searchIndex, experienceYears, search, jobFilter, statusFilter, sortBy, dateFilter, fromDate, toDate, bucket]);

  const bucketCounts = useMemo(() => {
    const counts = { all: candidates.length, recommended: 0, consider: 0, not: 0 };
    candidates.forEach((c) => {
      const b = recommendationBucket(c.status);
      if (counts[b] !== undefined) counts[b] += 1;
    });
    return counts;
  }, [candidates]);
  const summary = [
    { id: 'all', label: 'All Candidates', dot: 'bg-indigo-500' },
    { id: 'recommended', label: 'Recommended', dot: 'bg-emerald-500' },
    { id: 'consider', label: 'Consider after Interview', dot: 'bg-blue-500' },
    { id: 'not', label: 'Not Recommended', dot: 'bg-red-500' },
  ];

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const jobFilterOptions = [{ value: 'All', label: 'All Jobs' }, ...jobOptions];

  const from = filtered.length === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, filtered.length);
  const pageButton = (active) =>
    `min-w-8 h-8 px-2 rounded-lg text-xs font-medium ${active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-none">Candidates</h1>
          <p className="text-sm text-slate-500 mt-2.5">View and manage all screened candidates.</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => downloadCsv([CANDIDATE_CSV_HEADERS, ...filtered.map(candidateCsvRow)], 'candidates.csv')}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-3.5 h-9 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-800 hover:bg-slate-50 shadow-[0_1px_2px_rgba(18,18,28,0.04)] disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.8} />
            Download CSV
          </button>
          <Link
            to="/resume-screening"
            className="inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold shadow-[0_1px_2px_rgba(107,71,230,0.45),inset_0_1px_0_rgba(255,255,255,0.2)]"
          >
            <FileSearch className="w-3.5 h-3.5" strokeWidth={2} />
            Screen Resumes
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summary.map((card) => {
          const count = bucketCounts[card.id] ?? 0;
          const pct = bucketCounts.all ? Math.round((count / bucketCounts.all) * 100) : 0;
          const active = bucket === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => { setBucket(card.id); setPage(1); }}
              aria-pressed={active}
              className={`text-left rounded-2xl bg-white px-4 py-3.5 transition-colors border ${
                active ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200/80 hover:border-slate-300'
              } shadow-[0_1px_2px_rgba(18,18,28,0.04)]`}
            >
              <span className="flex items-center gap-2 text-xs text-slate-600">
                <span className={`w-1.5 h-1.5 rounded-full ${card.dot}`} />
                {card.label}
              </span>
              <span className="mt-2 flex items-end justify-between">
                <span className="text-[24px] font-bold tracking-tight tabular-nums text-slate-900 leading-none">{count}</span>
                <span className="font-mono text-[10px] text-slate-400">{pct}%</span>
              </span>
            </button>
          );
        })}
      </div>

      <Card padding={false}>
        <div className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by keywords (skills, experience, name etc)"
              className="w-full lg:flex-1 lg:min-w-[240px]"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-end gap-3">
              <FilterDropdown icon={Briefcase} className="lg:w-[165px]" value={jobFilter} options={jobFilterOptions} onChange={(v) => { setJobFilter(v); setPage(1); }} />
              <FilterDropdown icon={ListFilter} className="lg:w-[120px]" value={statusFilter} options={statusOptions} onChange={(v) => { setStatusFilter(v); setPage(1); }} />
              <FilterDropdown
                icon={CalendarDays}
                className="lg:w-[140px]"
                value={dateFilter}
                options={[
                  { value: 'All', label: 'All Dates' },
                  { value: 'custom', label: 'Custom Date' },
                ]}
                onChange={(v) => { setDateFilter(v); setPage(1); }}
              />
              {dateFilter === 'custom' && (
                <>
                  <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                    From Date
                    <input
                      type="date"
                      value={fromDate}
                      max={toDate || undefined}
                      onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                      className="w-full px-3 py-2 text-[13px] text-slate-800 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                    To Date
                    <input
                      type="date"
                      value={toDate}
                      min={fromDate || undefined}
                      onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                      className="w-full px-3 py-2 text-[13px] text-slate-800 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    />
                  </label>
                </>
              )}
              <FilterDropdown
                icon={ArrowUpDown}
                className="lg:w-[215px]"
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
          <CandidateTable candidates={paged} showJob showScreenedOn />
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-900">{from}–{to}</span> of{' '}
            <span className="font-semibold text-slate-900">{filtered.length}</span> candidates
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 h-8 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 mr-1"
            >
              ‹ Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)} className={pageButton(page === n)}>
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 h-8 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 ml-1"
            >
              Next ›
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
