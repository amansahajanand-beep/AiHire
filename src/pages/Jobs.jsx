import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  MoreHorizontal,
  Users,
  Upload,
  Copy,
  Send,
  FileEdit,
  XCircle,
  Archive,
  Trash2,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingState from '../components/ui/LoadingState';
import useJobs from '../hooks/useJobs';
import { getStatusColor, formatDate, getScoreColor } from '../utils/helpers';

const tabs = ['All Jobs', 'Published', 'Draft', 'Closed', 'Archived'];

const MENU_WIDTH = 208;

const statusActions = [
  { status: 'Published', label: 'Publish', icon: Send },
  { status: 'Draft', label: 'Move to Draft', icon: FileEdit },
  { status: 'Closed', label: 'Close Job', icon: XCircle },
  { status: 'Archived', label: 'Archive', icon: Archive },
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
  const { jobs, loading, error, source, updateJob, removeJob } = useJobs();
  const [activeTab, setActiveTab] = useState('All Jobs');
  const [menu, setMenu] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const displayJobs = activeTab === 'All Jobs' ? jobs : jobs.filter((j) => j.status === activeTab);
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
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    runAction(() => removeJob(job.id), `"${job.title}" deleted`);
  };

  const copyJobCode = async (job) => {
    setMenu(null);
    try {
      await navigator.clipboard.writeText(job.jobCode || job.id);
      setNotice({ type: 'success', text: 'Job code copied' });
    } catch {
      setNotice({ type: 'error', text: 'Could not copy job code' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
          <p className="text-slate-500 mt-1">Manage and view all your job postings.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wide">
            {source || 'live'}
          </span>
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

        {loading ? (
          <LoadingState message="Loading jobs..." />
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">{error.message || 'Failed to load jobs'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
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
                {displayJobs.map((job) => {
                  const scoreColors = job.avgScore > 0 ? getScoreColor(job.avgScore) : null;
                  return (
                    <tr key={job.id} className="hover:bg-slate-50/50">
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
          <p className="text-sm text-slate-500">Showing 1 to {displayJobs.length} of {displayJobs.length} jobs.</p>
        </div>
      </Card>

      {menu && menuJob && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5"
            style={{ left: menu.left, top: menu.top, bottom: menu.bottom, width: MENU_WIDTH }}
          >
            <MenuItem
              icon={Users}
              label="View Candidates"
              onClick={() => navigate(`/candidates?job=${menuJob.id}`)}
            />
            {(menuJob.status === 'Published' || menuJob.status === 'Draft') && (
              <MenuItem
                icon={Upload}
                label="Upload Resumes"
                onClick={() => navigate(`/resume-screening?job=${menuJob.id}`)}
              />
            )}
            <MenuItem icon={Copy} label="Copy Job Code" onClick={() => copyJobCode(menuJob)} />
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
            <div className="my-1.5 border-t border-slate-100" />
            <MenuItem icon={Trash2} label="Delete Job" danger disabled={busy} onClick={() => deleteJob(menuJob)} />
          </div>
        </>
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
