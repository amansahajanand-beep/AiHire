import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Eye, Edit, Archive } from 'lucide-react';
import { getStatusColor, formatDate, getScoreColor } from '../../utils/helpers';
import Badge from '../ui/Badge';

export default function JobTable({ jobs }) {
  const navigate = useNavigate();

  return (
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
            <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {jobs.map((job) => {
            const scoreColors = job.avgScore > 0 ? getScoreColor(job.avgScore) : null;
            return (
              <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-400">{job.department}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-slate-600">{job.location}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-medium text-slate-700">{job.candidates}</span>
                </td>
                <td className="py-3 px-4">
                  {job.avgScore > 0 ? (
                    <span className={`text-sm font-semibold ${scoreColors.text}`}>{job.avgScore}%</span>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-slate-500">{formatDate(job.createdOn)}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate('/candidates')}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="View candidates"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="More">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
