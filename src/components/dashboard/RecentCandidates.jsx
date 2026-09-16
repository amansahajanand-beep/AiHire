import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import Badge from '../ui/Badge';
import MatchScoreBadge from '../candidates/MatchScoreBadge';
import { getInitials, getStatusColor, formatDate } from '../../utils/helpers';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCandidates } from '../../store/slices/candidatesSlice';

const LIST_KEY = 'all::all';

export default function RecentCandidates() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const list = useAppSelector((s) => s.candidates.lists[LIST_KEY]);
  const rows = (list?.items || []).slice(0, 5);
  const loading = list?.status === 'loading' && rows.length === 0;

  useEffect(() => {
    dispatch(fetchCandidates());
  }, [dispatch]);

  return (
    <Card padding={false} className="!rounded-2xl overflow-hidden">
      <div className="p-6 pb-0">
        <CardHeader
          title="Recent Candidates"
          subtitle="Latest screened profiles from your pipeline"
          action={
            <button onClick={() => navigate('/candidates')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all
            </button>
          }
        />
      </div>

      {rows.length === 0 ? (
        <div className="px-6 pb-10 pt-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 max-w-sm">
            {loading
              ? 'Loading candidates…'
              : 'No screened candidates yet. Upload resumes after selecting a job.'}
          </p>
          {!loading && (
            <button
              onClick={() => navigate('/resume-screening')}
              className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
            >
              Upload resumes
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">Candidate</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Applied Job</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Match Score</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Status</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Applied Date</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((c) => (
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
                  <td className="py-3.5 px-4 text-sm text-slate-500">
                    {c.screenedOn ? formatDate(c.screenedOn) : '—'}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
