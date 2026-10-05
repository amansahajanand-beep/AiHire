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
  skills: '#F59E0B',
  experience: '#3B82F6',
  education: '#8B5CF6',
  stability: '#EC4899',
  overall: '#14B8A6',
};

function barStyle(key, value) {
  if (key === 'overall') {
    if (value <= 40) return { bar: '#EF4444', text: '#DC2626' };
    if (value <= 65) return { bar: '#F59E0B', text: '#B45309' };
  }
  const color = palette[key] || palette.overall;
  return { bar: color, text: color };
}

const categories = ['skills', 'experience', 'education', 'stability'];

// Incoming category values are performance percentages (0-100); the UI shows them weighted
// by the 100-point system: percent / 100 * weight. Overall is the sum of the weighted scores.
function weightedEntries(breakdown) {
  const present = categories.filter((k) => breakdown?.[k] != null);
  if (present.length === 0) {
    return breakdown?.overall != null ? [['overall', Number(breakdown.overall) || 0]] : [];
  }
  const entries = present.map((k) => {
    const percent = Math.min(Math.max(Number(breakdown[k]) || 0, 0), 100);
    return [k, Math.round((percent / 100) * weightage[k])];
  });
  const overall = entries.reduce((sum, [, score]) => sum + score, 0);
  return [...entries, ['overall', overall]];
}

export default function MatchBreakdown({ breakdown }) {
  const entries = weightedEntries(breakdown);

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
                style={{ width: `${Math.min(Math.max((value / max) * 100, 0), 100)}%`, backgroundColor: style.bar }}
              />
            </div>
            <span className="text-sm font-bold w-16 text-right tabular-nums" style={{ color: style.text }}>
              {value} / {max}
            </span>
          </div>
        );
      })}
    </div>
  );
}
