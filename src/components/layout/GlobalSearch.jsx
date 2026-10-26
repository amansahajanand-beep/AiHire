import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Search, User, X } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import useClickOutside from '../../hooks/useClickOutside';

const MAX_PER_GROUP = 5;

// Flatten strings / numbers / arrays into one lowercase blob to match against.
function haystack(...values) {
  return values
    .flat()
    .filter((v) => v !== null && v !== undefined && typeof v !== 'object')
    .join(' ')
    .toLowerCase();
}

function matchesAll(text, terms) {
  return terms.every((t) => text.includes(t));
}

/** Header search: finds jobs and candidates already loaded in the store and jumps to them. */
export default function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const closeDropdown = useCallback(() => setOpen(false), []);
  useClickOutside(wrapRef, closeDropdown, open);

  // Ctrl/Cmd + K jumps to the search box.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const jobs = useAppSelector((s) => s.jobs.items);
  // The unfiltered candidate list is cached under this key by the store.
  const candidates = useAppSelector((s) => s.candidates.lists['all::all']?.items);

  const jobIndex = useMemo(
    () => (jobs || []).map((j) => ({ job: j, text: haystack(j.title, j.department, j.location, j.type, j.status, j.skills) })),
    [jobs]
  );
  const candidateIndex = useMemo(
    () =>
      (candidates || []).map((c) => ({
        candidate: c,
        text: haystack(c.name, c.email, c.phone, c.job, c.location, c.status, c.skills),
      })),
    [candidates]
  );

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const jobResults = terms.length
    ? jobIndex.filter((e) => matchesAll(e.text, terms)).slice(0, MAX_PER_GROUP).map((e) => e.job)
    : [];
  const candidateResults = terms.length
    ? candidateIndex.filter((e) => matchesAll(e.text, terms)).slice(0, MAX_PER_GROUP).map((e) => e.candidate)
    : [];
  const hasResults = jobResults.length + candidateResults.length > 0;

  const go = (path) => {
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
    navigate(path);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (candidateResults[0]) go(`/candidates/${candidateResults[0].id}`);
      else if (jobResults[0]) go(`/jobs/${jobResults[0].id}`);
    }
  };

  return (
    <div className="relative w-full max-w-[340px]" ref={wrapRef}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search jobs and candidates..."
        aria-label="Search jobs and candidates"
        className="w-full pl-10 pr-12 h-9 text-[13px] border border-slate-200 rounded-xl bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 placeholder:text-slate-400"
      />
      {!query && (
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none font-mono text-[10px] text-slate-500 bg-slate-100 border border-slate-200 rounded-md px-1.5 py-px">
          ⌘K
        </kbd>
      )}
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {open && terms.length > 0 && (
        <>
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl border border-slate-200 shadow-lg z-50 max-h-96 overflow-y-auto py-1">
            {!hasResults ? (
              <p className="px-4 py-6 text-sm text-center text-slate-400">No jobs or candidates match &ldquo;{query.trim()}&rdquo;</p>
            ) : (
              <>
                {candidateResults.length > 0 && (
                  <div>
                    <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Candidates</p>
                    {candidateResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => go(`/candidates/${c.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50"
                      >
                        <span className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-800 truncate">{c.name}</span>
                          <span className="block text-xs text-slate-500 truncate">{[c.job, c.email].filter(Boolean).join(' · ')}</span>
                        </span>
                        {c.score > 0 && <span className="text-xs font-semibold text-slate-500 shrink-0">{c.score}%</span>}
                      </button>
                    ))}
                  </div>
                )}
                {jobResults.length > 0 && (
                  <div>
                    <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Jobs</p>
                    {jobResults.map((j) => (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() => go(`/jobs/${j.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50"
                      >
                        <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-800 truncate">{j.title}</span>
                          <span className="block text-xs text-slate-500 truncate">{[j.department, j.location].filter(Boolean).join(' · ')}</span>
                        </span>
                        <span className="text-xs text-slate-400 shrink-0">{j.status}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
