import { Briefcase, FileText, Clock, Sparkles, Gauge, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const iconMap = {
  Briefcase,
  Users: FileText,
  UserCheck: Clock,
  Target,
  Clock: Gauge,
  FileText,
  Sparkles,
  Gauge,
};

// Icon tile colours per metric (soft tint + matching icon colour).
const tones = {
  Briefcase: 'bg-indigo-50 text-indigo-600',
  FileText: 'bg-indigo-50 text-indigo-600',
  UserCheck: 'bg-amber-50 text-amber-600',
  Target: 'bg-indigo-50 text-indigo-600',
};

/** The white card that holds the four headline metrics, divided by hairlines. */
export function StatStrip({ children }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_2px_rgba(18,18,28,0.04)] grid grid-cols-2 lg:grid-cols-4 overflow-hidden h-full">
      {children}
    </div>
  );
}

function splitValue(value) {
  const m = /^([\d.,]+)\s*([a-zA-Z%]+)$/.exec(String(value ?? ''));
  return m ? { num: m[1], unit: m[2] } : { num: String(value ?? ''), unit: '' };
}

export default function StatCard({
  title,
  value,
  caption,
  detail,
  icon,
  metrics,
  progress,
  dashes,
  link,
  variant = 'default',
}) {
  const Icon = iconMap[icon] || Briefcase;

  if (variant === 'productivity' || metrics?.length) {
    const list = metrics || [];
    const hero = list.find((m) => m.label === 'Time Saved') || { label: 'Time Saved', value };
    const rest = list.filter((m) => m !== hero);
    const { num, unit } = splitValue(hero.value);
    return (
      <div
        className="relative overflow-hidden rounded-2xl text-white px-5 py-4 h-full flex flex-col shadow-[0_10px_30px_-12px_rgba(31,20,80,0.6)]"
        style={{ background: 'linear-gradient(155deg, #1B1442 0%, #2B1B70 55%, #3B2796 100%)' }}
      >
        <div className="pointer-events-none absolute -right-10 top-8 w-64 h-64 rounded-full opacity-60" style={{ background: 'radial-gradient(circle, rgba(129,104,238,0.55) 0%, rgba(129,104,238,0) 65%)' }} />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <p className="text-[15px] font-semibold tracking-tight">Productivity</p>
            <span className="font-mono text-[9.5px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded bg-white/15 text-white/80">
              This month
            </span>
          </div>
          <span className="w-7 h-7 rounded-full border border-white/25 flex items-center justify-center">
            <Gauge className="w-3.5 h-3.5 text-white/90" />
          </span>
        </div>

        <div className="relative mt-4 mb-4">
          <p className="leading-none">
            <span className="text-[40px] font-bold tracking-tight tabular-nums">{num}</span>
            {unit && <span className="text-lg font-medium text-white/70 ml-1">{unit}</span>}
          </p>
          <p className="text-xs text-white/65 mt-2">{hero.label}</p>
        </div>

        <div className="relative mt-auto pt-4 border-t border-white/15 grid grid-cols-2 gap-4">
          {rest.map((m) => {
            const parts = splitValue(m.value);
            return (
              <div key={m.label} className="min-w-0">
                <p className="leading-none">
                  <span className="text-xl font-semibold tabular-nums">{parts.num}</span>
                  {parts.unit && <span className="text-sm text-white/70 ml-0.5">{parts.unit}</span>}
                </p>
                <p className="text-[11px] text-white/60 mt-1.5 leading-tight">{m.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const { num, unit } = splitValue(value);
  return (
    <div className="p-5 min-w-0 flex flex-col border-slate-200/70 border-b lg:border-b-0 border-r [&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:last:border-r-0 last:border-b-0">
      <div className="flex items-start gap-2.5 min-h-[34px]">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${tones[icon] || tones.FileText}`}>
          <Icon className="w-[15px] h-[15px]" strokeWidth={1.9} />
        </span>
        <p className="text-[12.5px] font-medium text-slate-700 leading-tight pt-0.5">{title}</p>
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <p className="leading-none">
          <span className="text-[34px] font-bold tracking-tight tabular-nums text-slate-900">{num}</span>
          {unit && <span className="text-base font-medium text-slate-500 ml-0.5">{unit}</span>}
        </p>
        {link && (
          <Link to={link.to} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            {link.label} →
          </Link>
        )}
      </div>

      {progress != null && (
        <div className="mt-3 h-1 rounded-full bg-slate-200/80 overflow-hidden">
          <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}
      {dashes != null && (
        <div className="mt-3 flex gap-1" aria-hidden>
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i < Math.round(dashes / 10) ? 'bg-indigo-500' : 'bg-slate-200'}`} />
          ))}
        </div>
      )}
      {caption ? <p className="text-xs text-slate-500 mt-2.5">{caption}</p> : null}
      {detail ? <p className="text-xs text-slate-500 mt-1">{detail}</p> : null}
    </div>
  );
}
