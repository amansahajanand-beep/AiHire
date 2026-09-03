import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader } from '../ui/Card';
import Badge from '../ui/Badge';
import MatchScoreBadge from '../candidates/MatchScoreBadge';
import { listCandidates } from '../../api/candidates';
import { getInitials, getStatusColor } from '../../utils/helpers';

export default function RecentCandidates() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    listCandidates()
      .then((res) => setRows((res.candidates || []).slice(0, 5)))
      .catch(() => setRows([]));
  }, []);

  return (
    <Card padding={false}>
      <div className="p-6 pb-0">
        <CardHeader
          title="Recent Candidates"
          action={
            <button onClick={() => navigate('/candidates')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all
            </button>
          }
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">Candidate</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Applied Job</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Match Score</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Status</th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                  No screened candidates yet. Upload resumes after selecting a job.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold text-indigo-700">{getInitials(c.name)}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-slate-600">{c.job || '—'}</td>
                  <td className="py-3.5 px-4"><MatchScoreBadge score={c.score || 0} /></td>
                  <td className="py-3.5 px-4">
                    <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => navigate(`/candidates/${c.id}`)}
                      className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
