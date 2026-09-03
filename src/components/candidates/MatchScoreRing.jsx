export default function MatchScoreRing({ score, size = 180, label = 'Excellent Match' }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const fill = score >= 85 ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444';
  const labelColor = score >= 85 ? 'text-emerald-500' : score >= 70 ? 'text-amber-500' : 'text-red-500';
  const statusLabel =
    score >= 85 ? 'Excellent Match' : score >= 70 ? 'Strong Match' : score >= 50 ? 'Moderate Match' : 'Low Match';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={fill}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-slate-900 leading-none">{score}</span>
          <span className="text-sm font-medium text-slate-400 mt-1">/100</span>
        </div>
      </div>
      <p className={`mt-4 text-base font-bold ${labelColor}`}>{label || statusLabel}</p>
    </div>
  );
}
