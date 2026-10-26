import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, Search, FileText } from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import Badge from '../ui/Badge';
import { getInitials, getStatusColor, getScoreColor, formatDate } from '../../utils/helpers';
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
    <Card padding={false} className="!rounded-2xl overflow-hidden h-full flex flex-col">
      <div className="p-6 pb-0">
        <CardHeader
          title="Recent Candidates"
          subtitle="Latest screened profiles from your pipeline"
          action={
            <button
              onClick={() => navigate('/candidates')}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              View all <ArrowUpRight className="w-3 h-3" />
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
        <div className="overflow-x-auto flex-1">
          {/* fixed column widths keep every row aligned; the rows stretch to fill the card height */}
          <table className="w-full h-full table-fixed min-w-[640px]">
            <colgroup>
              <col className="w-[31%]" />
              <col className="w-[12%]" />
              <col className="w-[31%]" />
              <col className="w-[17%]" />
              <col className="w-[56px]" />
            </colgroup>
            <thead>
              <tr className="border-y border-slate-100">
                <th className="text-left py-2.5 px-6">Candidate</th>
                <th className="text-left py-2.5 px-4 whitespace-nowrap">Match Score</th>
                <th className="text-left py-2.5 px-4">Recommendation</th>
                <th className="text-left py-2.5 px-4 whitespace-nowrap">Applied Date</th>
                <th className="relative py-2.5 px-3"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 [&>tr]:h-[61px]">
              {rows.map((c) => {
                const score = c.score || 0;
                const tone = getScoreColor(score);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
                          {/\.pdf$/i.test(c.name || '') ? (
                            <FileText className="w-3.5 h-3.5 text-indigo-600" strokeWidth={1.8} />
                          ) : (
                            <span className="text-[11px] font-semibold text-indigo-700">{getInitials(c.name)}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-900 truncate">{c.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{c.job || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[13px] font-semibold tabular-nums ${tone.text}`}>{score}%</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`gap-1.5 max-w-full !whitespace-normal leading-snug text-left ${getStatusColor(c.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
                        <span>{c.status}</span>
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {c.screenedOn ? formatDate(c.screenedOn) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => navigate(`/candidates/${c.id}`)}
                        aria-label={`View ${c.name}`}
                        className="w-8 h-8 inline-flex items-center justify-center border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
