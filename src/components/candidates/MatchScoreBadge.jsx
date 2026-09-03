import { getScoreColor } from '../../utils/helpers';

export default function MatchScoreBadge({ score }) {
  const colors = getScoreColor(score);
  return (
    <span className={`text-sm font-bold ${colors.text}`}>
      {score}%
    </span>
  );
}
