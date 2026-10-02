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

const palette = {
  skills: '#168F91',
  experience: '#4F8FE8',
  education: '#D6A23A',
  stability: '#9273D8',
  overall: '#258653',
};

function barStyle(key, value) {
  if (key === 'overall') {
    if (value <= 40) return { bar: '#EF4444', text: '#DC2626' };
    if (value <= 65) return { bar: '#F59E0B', text: '#B45309' };
  }
  const color = palette[key] || palette.overall;
  return { bar: color, text: color };
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
            <span className="text-sm font-medium w-24 shrink-0" style={{ color: style.text }}>{labels[key] || key}</span>
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, backgroundColor: style.bar }}
              />
            </div>
            <span className="text-sm font-bold w-16 text-right tabular-nums" style={{ color: style.text }}>
              {Math.round(value)} / {max}
            </span>
          </div>
        );
      })}
    </div>
  );
}
