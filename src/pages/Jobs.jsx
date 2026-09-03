import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingState from '../components/ui/LoadingState';
import useJobs from '../hooks/useJobs';
import { getStatusColor, formatDate, getScoreColor } from '../utils/helpers';

const tabs = ['All Jobs', 'Published', 'Draft', 'Closed', 'Archived'];

export default function Jobs() {
  const navigate = useNavigate();
  const { jobs, loading, error, source } = useJobs();
  const [activeTab, setActiveTab] = useState('All Jobs');

  const displayJobs = activeTab === 'All Jobs' ? jobs : jobs.filter((j) => j.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
          <p className="text-slate-500 mt-1">Manage and view all your job postings.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wide">
            {source || 'mock'}
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
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
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
    </div>
  );
}
