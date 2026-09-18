const labels = {
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  stability: 'Stability',
  keywords: 'Keywords',
  overall: 'Overall',
};

const weightage = {
  skills: 40,
  experience: 30,
  education: 15,
  stability: 15,
  keywords: 15,
  overall: 100,
};

function barStyle(key, value) {
  if (key === 'education' || key === 'keywords') {
    return { bar: '#FBBF24', text: 'text-amber-500' };
  }
  if (value >= 85) return { bar: '#10B981', text: 'text-emerald-500' };
  if (value >= 70) return { bar: '#FBBF24', text: 'text-amber-500' };
  if (value >= 50) return { bar: '#FBBF24', text: 'text-amber-500' };
  return { bar: '#EF4444', text: 'text-red-500' };
}

export default function MatchBreakdown({ breakdown }) {
  const order = ['skills', 'experience', 'education', 'stability', 'overall'];
  const entries = order
    .filter((k) => breakdown?.[k] != null)
    .map((k) => [k, Number(breakdown[k]) || 0]);

  return (
    <div className="space-y-5">
      {entries.map(([key, value]) => {
        const style = barStyle(key, value);
        const max = weightage[key] ?? 100;
        return (
          <div key={key} className="flex items-center gap-4">
            <span className="text-sm text-slate-600 w-24 shrink-0">{labels[key] || key}</span>
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, backgroundColor: style.bar }}
              />
            </div>
            <span className={`text-sm font-bold w-16 text-right tabular-nums ${style.text}`}>
              {Math.round(value)} / {max}
            </span>
          </div>
        );
      })}
    </div>
  );
}
