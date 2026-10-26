import { useNavigate } from 'react-router-dom';
import { Clock3, UserCheck, UserX } from 'lucide-react';
import { getInitials, formatDate, humanReviewLabel } from '../../utils/helpers';
import { BUCKET_STYLE, recommendationBucket } from '../../utils/recommendation';
import HumanReviewLabel from './HumanReviewLabel';

const statusDisplay = {
  Shortlisted: 'Shortlisted',
  'Human Review': 'Review',
  Pending: 'Pending',
  'Low Match': 'Low Match',
  Rejected: 'Rejected',
};

function formatTime(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
}

function formatScreeningStatus(status) {
  if (!status) return '—';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export const CANDIDATE_CSV_HEADERS = [
  'Candidate', 'Applied For', 'Match Score', 'Recommendation', 'Human Review', 'Screened On', 'Time', 'Status',
];

/** The same values the table shows for one candidate, in column order (used for the CSV export). */
export function candidateCsvRow(candidate) {
  return [
    candidate.name,
    candidate.job,
    candidate.score,
    statusDisplay[candidate.status] || candidate.status,
    humanReviewLabel(candidate.humanEvaluation),
    formatDate(candidate.screenedOn),
    formatTime(candidate.screenedOn),
    candidate.isDuplicate ? 'Duplicate' : formatScreeningStatus(candidate.screeningStatus),
  ];
}

const AVATAR_TINTS = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

function avatarTint(name) {
  let sum = 0;
  String(name || '').split('').forEach((ch) => { sum += ch.charCodeAt(0); });
  return AVATAR_TINTS[sum % AVATAR_TINTS.length];
}

const REVIEW_STYLE = {
  Shortlisted: { icon: UserCheck, color: 'text-emerald-600' },
  Rejected: { icon: UserX, color: 'text-red-600' },
  'Human Review': { icon: Clock3, color: 'text-amber-600' },
  'N/A': { icon: Clock3, color: 'text-slate-400' },
};

const TH = 'text-left py-2.5 px-4';

// Score colours on this page: green from 70%, amber 60-69%, red below 60%.
function scoreTone(score) {
  if (score >= 70) return { chip: 'bg-emerald-50 text-emerald-700' };
  if (score >= 60) return { chip: 'bg-amber-50 text-amber-700' };
  return { chip: 'bg-red-50 text-red-700' };
}

export default function CandidateTable({ candidates, showJob = true, showScreenedOn = false }) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px]">
        <thead>
          <tr className="border-y border-slate-100">
            <th className={`${TH} px-5`}>{showJob ? 'Candidate · Applied For' : 'Candidate'}</th>
            <th className={TH}>Match Score</th>
            <th className={TH}>Recommendation</th>
            <th className={TH}>Human Review</th>
            {showScreenedOn && <th className={TH}>Screened On</th>}
            <th className={TH}>Status</th>
            <th className="text-right py-2.5 px-5">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {candidates.map((candidate) => {
            const displayStatus = statusDisplay[candidate.status] || candidate.status;
            const score = Number(candidate.score) || 0;
            const tone = scoreTone(score);
            const bucket = BUCKET_STYLE[recommendationBucket(candidate.status)];
            const review = REVIEW_STYLE[humanReviewLabel(candidate.humanEvaluation)] || REVIEW_STYLE['N/A'];
            const ReviewIcon = review.icon;
            const statusText = candidate.isDuplicate ? 'Duplicate' : formatScreeningStatus(candidate.screeningStatus);
            return (
              <tr key={candidate.id} className="h-12 hover:bg-slate-50/60 transition-colors">
                <td className="align-middle py-2 px-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${avatarTint(candidate.name)}`}>
                      <span className="text-[11px] font-semibold">{getInitials(candidate.name)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900 truncate">{candidate.name}</p>
                      {showJob && <p className="text-[11px] text-slate-500 truncate">{candidate.job}</p>}
                    </div>
                  </div>
                </td>
                <td className="align-middle py-2 px-4">
                  <span className={`inline-flex items-center justify-center min-w-[42px] h-6 rounded-md text-xs font-semibold tabular-nums ${tone.chip}`}>
                    {score}%
                  </span>
                </td>
                <td className="align-middle py-2 px-4">
                  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium ${bucket.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${bucket.dot}`} />
                    {displayStatus}
                  </span>
                </td>
                <td className="align-middle py-2 px-4">
                  <span className={`inline-flex items-center gap-1.5 ${review.color}`}>
                    <ReviewIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
                    <HumanReviewLabel evaluation={candidate.humanEvaluation} note={candidate.humanNote} className="text-xs" />
                  </span>
                </td>
                {showScreenedOn && (
                  <td className="align-middle py-2 px-4">
                    <p className="text-xs font-medium text-slate-800 whitespace-nowrap">{formatDate(candidate.screenedOn)}</p>
                    <p className="font-mono text-[10.5px] text-slate-400 mt-0.5">{formatTime(candidate.screenedOn)}</p>
                  </td>
                )}
                <td className="align-middle py-2 px-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                    <span className={`w-1.5 h-1.5 rounded-full ${candidate.isDuplicate ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    {statusText}
                  </span>
                </td>
                <td className="align-middle py-2 px-5 text-right">
                  <button
                    onClick={() => navigate(`/candidates/${candidate.id}`)}
                    className="h-8 px-3.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 shadow-[0_1px_2px_rgba(18,18,28,0.04)] transition-colors"
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
