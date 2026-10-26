import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  MoreHorizontal,
  Users,
  Send,
  FileEdit,
  XCircle,
  Eye,
  Pencil,
  PauseCircle,
  Trash2,
  Download,
  Code2,
  Briefcase,
  Building2,
  Clock3,
  CalendarDays,
  MapPin,
  FileText,
  ArrowRight,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import SearchInput from '../components/ui/SearchInput';
import FilterDropdown from '../components/ui/FilterDropdown';
import useJobs from '../hooks/useJobs';
import { useAppSelector } from '../store/hooks';
import { getStatusColor, formatDate } from '../utils/helpers';
import { downloadCsv } from '../utils/csv';

const tabs = ['All Jobs', 'Published', 'Draft', 'Closed', 'On Hold'];

const sortOptions = [
  { value: 'newest', label: 'Sort by: Newest' },
  { value: 'oldest', label: 'Sort by: Oldest' },
  { value: 'title-asc', label: 'Sort by: Job Title A-Z' },
  { value: 'title-desc', label: 'Sort by: Job Title Z-A' },
];

function createdTime(job) {
  const t = new Date(job.createdOn).getTime();
  return Number.isNaN(t) ? null : t;
}

const MENU_WIDTH = 208;

const statusActions = [
  { status: 'Published', label: 'Publish', icon: Send },
  { status: 'Draft', label: 'Move to Draft', icon: FileEdit },
  { status: 'Closed', label: 'Close Job', icon: XCircle },
  { status: 'On Hold', label: 'On Hold', icon: PauseCircle },
];

function MenuItem({ icon: Icon, label, onClick, danger, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left disabled:opacity-50 ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}

export default function Jobs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobs, loading, error, updateJob, removeJob } = useJobs();
  const candidates = useAppSelector((s) => s.candidates.lists['all::all']?.items);
  const [activeTab, setActiveTab] = useState('All Jobs');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [menu, setMenu] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const displayJobs = useMemo(() => {
    const tabJobs = activeTab === 'All Jobs' ? jobs : jobs.filter((j) => j.status === activeTab);
    // Every space-separated word must appear in the title, job ID or another job field (case-insensitive).
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
    const matches = terms.length === 0
      ? tabJobs
      : tabJobs.filter((j) => {
        const haystack = [j.title, j.jobCode, j.id, j.department, j.location, j.employmentType, j.status]
          .map((v) => String(v ?? '').toLowerCase())
          .join(' ');
        return terms.every((term) => haystack.includes(term));
      });
    return [...matches].sort((a, b) => {
      if (sortBy === 'title-asc') return String(a.title || '').localeCompare(String(b.title || ''), undefined, { sensitivity: 'base' });
      if (sortBy === 'title-desc') return String(b.title || '').localeCompare(String(a.title || ''), undefined, { sensitivity: 'base' });
      const ta = createdTime(a);
      const tb = createdTime(b);
      if (ta == null && tb == null) return 0;
      if (ta == null) return 1; // jobs without a date go last
      if (tb == null) return -1;
      return sortBy === 'oldest' ? ta - tb : tb - ta;
    });
  }, [jobs, activeTab, search, sortBy]);
  const menuJob = menu ? jobs.find((j) => j.id === menu.jobId) : null;

  const shortlistedByJob = useMemo(() => {
    const counts = {};
    (candidates || []).forEach((c) => {
      const isShortlisted = /shortlist/i.test(String(c.status || '')) || c.humanEvaluation === 'Shortlisted';
      if (!isShortlisted) return;
      const job = jobs.find((j) => j.id === c.jobId || (c.job && j.title === c.job));
      if (job) counts[job.id] = (counts[job.id] || 0) + 1;
    });
    return counts;
  }, [candidates, jobs]);
  const tabCount = (tab) => (tab === 'All Jobs' ? jobs.length : jobs.filter((j) => j.status === tab).length);

  useEffect(() => {
    if (!menu) return undefined;
    const close = () => setMenu(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  useEffect(() => {
    if (!location.state?.notice) return;
    setNotice({ type: 'success', text: location.state.notice });
    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  const openMenu = (event, jobId) => {
    if (menu?.jobId === jobId) {
      setMenu(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const estimatedHeight = 330;
    const openUp = rect.bottom + estimatedHeight > window.innerHeight && rect.top > estimatedHeight;
    setMenu({
      jobId,
      left: Math.max(8, rect.right - MENU_WIDTH),
      top: openUp ? undefined : rect.bottom + 4,
      bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
    });
  };

  const runAction = async (fn, successMessage) => {
    setBusy(true);
    try {
      await fn();
      setNotice({ type: 'success', text: successMessage });
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Action failed' });
    } finally {
      setBusy(false);
      setMenu(null);
    }
  };

  const changeStatus = (job, status) =>
    runAction(() => updateJob(job.id, { status }), `"${job.title}" moved to ${status}`);

  const deleteJob = (job) => {
    setMenu(null);
    setDeleteError('');
    setDeleteTarget(job);
  };

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
      await removeJob(deleteTarget.id);
      setNotice({ type: 'success', text: `"${deleteTarget.title}" deleted` });
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err?.message || 'Failed to delete job');
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

  const viewJob = (job) => {
    setMenu(null);
    navigate(`/jobs/${encodeURIComponent(job.id)}`);
  };

  const editJob = (job) => {
    setMenu(null);
    navigate(`/jobs/create?edit=${encodeURIComponent(job.id)}`);
  };

  // Exports exactly what the table shows (current tab + search)
  const handleDownloadCsv = () => {
    const header = ['Job ID', 'Job Title', 'Location', 'Candidates', 'Avg Match Score', 'Status', 'Created On'];
    const rows = displayJobs.map((job) => [
      job.jobCode || '',
      job.title,
      job.location || '',
      job.candidates,
      job.avgScore > 0 ? `${job.avgScore}%` : '',
      job.status,
      formatDate(job.createdOn),
    ]);
    downloadCsv([header, ...rows], 'jobs.csv');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-none">Jobs</h1>
          <p className="text-sm text-slate-500 mt-2.5">Manage and view all your job postings.</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={displayJobs.length === 0}
            className="inline-flex items-center gap-2 px-3.5 h-9 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-800 hover:bg-slate-50 shadow-[0_1px_2px_rgba(18,18,28,0.04)] disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.8} />
            Download CSV
          </button>
          <button
            onClick={() => navigate('/jobs/create')}
            className="inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold shadow-[0_1px_2px_rgba(107,71,230,0.45),inset_0_1px_0_rgba(255,255,255,0.2)]"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.4} /> Create Job
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200/80 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-2 px-3 pb-3 pt-1 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-indigo-600 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
              <span className="min-w-[18px] px-1.5 py-px rounded-md bg-slate-100 text-[10.5px] font-medium text-slate-600 tabular-nums text-center">
                {tabCount(tab)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by job title or job ID..."
          className="flex-1"
        />
        <FilterDropdown value={sortBy} options={sortOptions} onChange={setSortBy} className="sm:w-56" />
      </div>

      {loading ? (
        <LoadingState message="Loading jobs..." />
      ) : error ? (
        <div className="p-8 text-center text-sm text-red-600">{error.message || 'Failed to load jobs'}</div>
      ) : (
        <div className="@container space-y-3">
          {displayJobs.length === 0 && search.trim() && (
            <div className="rounded-2xl border border-slate-200/80 bg-white py-10 px-4 text-center text-sm text-slate-500">
              No jobs match your search.
            </div>
          )}

          {displayJobs.map((job, index) => {
            const canScreen = job.status === 'Published' || job.status === 'Draft';
            const Icon = index % 2 === 0 ? Code2 : Briefcase;
            const tint = index % 2 === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600';
            return (
              <div
                key={job.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(18,18,28,0.04)] grid grid-cols-1 gap-4 @5xl:grid-cols-[minmax(0,1fr)_auto] @5xl:items-center @5xl:gap-8 @5xl:min-h-[82px]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
                    <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <button
                        type="button"
                        onClick={() => viewJob(job)}
                        className="text-[15px] font-semibold tracking-tight text-slate-900 hover:text-indigo-700 text-left break-words min-w-0"
                      >
                        {job.title}
                      </button>
                      <Badge className={`gap-1.5 !rounded-md !text-[11px] ${getStatusColor(job.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {job.status}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11.5px] text-slate-500">
                      <span className="font-mono text-[10.5px] text-slate-400">{job.jobCode || '—'}</span>
                      {job.department && (
                        <span className="inline-flex items-center gap-1.5"><Building2 className="w-3 h-3 text-slate-400" />{job.department}</span>
                      )}
                      {job.employmentType && (
                        <span className="inline-flex items-center gap-1.5"><Clock3 className="w-3 h-3 text-slate-400" />{job.employmentType}</span>
                      )}
                      {job.location && (
                        <span className="inline-flex items-center gap-1.5"><MapPin className="w-3 h-3 text-slate-400" />{job.location}</span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="w-3 h-3 text-slate-400" />
                        {job.status === 'Published' ? 'Published' : 'Created'} {job.createdOn ? formatDate(job.createdOn) : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-slate-100 pt-3.5 @5xl:flex-nowrap @5xl:border-t-0 @5xl:pt-0 @5xl:gap-8">
                <div className="flex flex-wrap items-center gap-x-7 gap-y-3 @5xl:grid @5xl:grid-cols-[84px_84px_136px] @5xl:gap-x-0">
                  <div>
                    <p className="text-[10.5px] text-slate-500">Candidates</p>
                    <p className="text-[19px] font-semibold tracking-tight tabular-nums text-slate-900 leading-tight">{job.candidates}</p>
                  </div>
                  <div>
                    <p className="text-[10.5px] text-slate-500">Shortlisted</p>
                    <p className="text-[19px] font-semibold tracking-tight tabular-nums text-slate-900 leading-tight">{shortlistedByJob[job.id] || 0}</p>
                  </div>
                  <div className="@5xl:w-[136px]">
                    <p className="text-[10.5px] text-slate-500">Avg. Match</p>
                    {job.avgScore > 0 ? (
                      <p className="text-[19px] font-semibold tracking-tight tabular-nums text-slate-900 leading-tight">{job.avgScore}%</p>
                    ) : (
                      <p className="text-[19px] font-semibold text-slate-300 leading-tight">—</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 ml-auto @5xl:ml-0 @5xl:w-[252px]">
                  {canScreen && (
                    <button
                      type="button"
                      onClick={() => navigate(`/resume-screening?job=${job.id}`)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.8} />
                      Screen
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/candidates?job=${job.id}`)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                  >
                    Candidates <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => openMenu(e, job.id)}
                    aria-label={`Actions for ${job.title}`}
                    className={`w-8 h-8 inline-flex items-center justify-center rounded-lg ${
                      menu?.jobId === job.id
                        ? 'text-slate-700 bg-slate-100'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => navigate('/jobs/create')}
            className="w-full flex items-center gap-3.5 rounded-2xl border border-dashed border-slate-300 bg-white/50 p-4 text-left hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
          >
            <span className="w-11 h-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4 text-slate-600" strokeWidth={1.8} />
            </span>
            <span>
              <span className="block text-[13px] font-semibold text-slate-900">Create a new job</span>
              <span className="block text-xs text-slate-500 mt-0.5">Add a job posting to start screening candidates.</span>
            </span>
          </button>

          <p className="text-xs text-slate-500 pt-1">
            Showing {displayJobs.length === 0 ? 0 : 1} to {displayJobs.length} of {displayJobs.length} jobs.
          </p>
        </div>
      )}

      {menu && menuJob && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5"
            style={{ left: menu.left, top: menu.top, bottom: menu.bottom, width: MENU_WIDTH }}
          >
            <MenuItem icon={Eye} label="View Job" onClick={() => viewJob(menuJob)} />
            <MenuItem icon={Pencil} label="Edit Job" onClick={() => editJob(menuJob)} />
            <MenuItem
              icon={Users}
              label="View Candidates"
              onClick={() => navigate(`/candidates?job=${menuJob.id}`)}
            />
            <div className="my-1.5 border-t border-slate-100" />
            {statusActions
              .filter((a) => a.status !== menuJob.status)
              .map((a) => (
                <MenuItem
                  key={a.status}
                  icon={a.icon}
                  label={a.label}
                  disabled={busy}
                  onClick={() => changeStatus(menuJob, a.status)}
                />
              ))}
            {/* "Delete Job" is temporarily hidden: restore the divider and this item to re-enable it.
            <div className="my-1.5 border-t border-slate-100" />
            <MenuItem icon={Trash2} label="Delete Job" danger disabled={busy} onClick={() => deleteJob(menuJob)} />
            */}
          </div>
        </>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={closeDeleteDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-job-title"
            className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-job-title" className="text-base font-semibold text-slate-900">
              Are you sure you want to delete this job?
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 break-words">{deleteTarget.title}</p>
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

      {notice && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            notice.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {notice.text}
        </div>
      )}
    </div>
  );
}
