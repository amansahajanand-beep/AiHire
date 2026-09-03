import { useNavigate } from 'react-router-dom';
import { getInitials, getStatusColor, formatDate } from '../../utils/helpers';
import MatchScoreBadge from './MatchScoreBadge';
import Badge from '../ui/Badge';

const statusDisplay = {
  Shortlisted: 'Shortlisted',
  'Human Review': 'Review',
  Pending: 'Pending',
  'Low Match': 'Low Match',
  Rejected: 'Rejected',
};

export default function CandidateTable({ candidates, showJob = true, showScreenedOn = false }) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Candidate</th>
            {showJob && <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Job Position</th>}
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Match Score</th>
            <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Status</th>
            {showScreenedOn && <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Screened On</th>}
            <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {candidates.map((candidate) => {
            const displayStatus = statusDisplay[candidate.status] || candidate.status;
            return (
              <tr key={candidate.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-indigo-700">{getInitials(candidate.name)}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{candidate.name}</p>
                  </div>
                </td>
                {showJob && (
                  <td className="py-3.5 px-4">
                    <span className="text-sm text-slate-600">{candidate.job}</span>
                  </td>
                )}
                <td className="py-3.5 px-4">
                  <MatchScoreBadge score={candidate.score} />
                </td>
                <td className="py-3.5 px-4">
                  <Badge className={getStatusColor(displayStatus === 'Review' ? 'Review' : candidate.status)}>
                    {displayStatus}
                  </Badge>
                </td>
                {showScreenedOn && (
                  <td className="py-3.5 px-4">
                    <span className="text-sm text-slate-500">{formatDate(candidate.screenedOn)}</span>
                  </td>
                )}
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => navigate(`/candidates/${candidate.id}`)}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
