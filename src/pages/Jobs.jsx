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
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import SearchInput from '../components/ui/SearchInput';
import FilterDropdown from '../components/ui/FilterDropdown';
import useJobs from '../hooks/useJobs';
import { getStatusColor, formatDate, getScoreColor } from '../utils/helpers';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
          <p className="text-slate-500 mt-1">Manage and view all your job postings.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={displayJobs.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Download CSV
          </button>
          <button
            onClick={() => navigate('/jobs/create')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Create Job
          </button>
        </div>
      </div>

      <Card padding={false}>
        <div className="px-4 border-b border-slate-100 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title or job ID..."
              className="flex-1"
            />
            <FilterDropdown value={sortBy} options={sortOptions} onChange={setSortBy} className="sm:w-56" />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading jobs..." />
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">{error.message || 'Failed to load jobs'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Job ID</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Job Title</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Location</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Candidates</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Avg Match Score</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Created On</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayJobs.length === 0 && search.trim() && (
                  <tr>
                    <td colSpan={8} className="py-10 px-4 text-center text-sm text-slate-500">
                      No jobs match your search.
                    </td>
                  </tr>
                )}
                {displayJobs.map((job) => {
                  const scoreColors = job.avgScore > 0 ? getScoreColor(job.avgScore) : null;
                  return (
                    <tr key={job.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 text-sm text-slate-600">{job.jobCode || '—'}</td>
                      <td className="py-3.5 px-4 text-sm font-semibold text-slate-900">{job.title}</td>
                      <td className="py-3.5 px-4 text-sm text-slate-600">{job.location || '—'}</td>
                      <td className="py-3.5 px-4 text-sm font-medium text-slate-700">{job.candidates}</td>
                      <td className="py-3.5 px-4">
                        {scoreColors ? (
                          <span className={`text-sm font-bold ${scoreColors.text}`}>{job.avgScore}%</span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-500">{job.createdOn ? formatDate(job.createdOn) : '—'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => openMenu(e, job.id)}
                          aria-label={`Actions for ${job.title}`}
                          className={`p-1.5 rounded-lg ${
                            menu?.jobId === job.id
                              ? 'text-slate-700 bg-slate-100'
                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-sm text-slate-500">Showing {displayJobs.length === 0 ? 0 : 1} to {displayJobs.length} of {displayJobs.length} jobs.</p>
        </div>
      </Card>

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
