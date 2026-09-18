import {
  Briefcase, FileText, Clock, Sparkles, Gauge, TrendingUp, TrendingDown,
} from 'lucide-react';

const iconMap = {
  Briefcase,
  Users: FileText,
  UserCheck: Clock,
  Target: Sparkles,
  Clock: Gauge,
  FileText,
  Sparkles,
  Gauge,
};

export default function StatCard({
  title,
  value,
  change,
  trend,
  icon,
  metrics,
  variant = 'default',
}) {
  const Icon = iconMap[icon] || Briefcase;
  const isProductivity = variant === 'productivity' || metrics?.length;

  if (isProductivity) {
    return (
      <div className="dashboard-stat-card relative overflow-hidden rounded-2xl bg-indigo-600 text-white p-5 shadow-sm min-h-[132px]">
        <div className="pointer-events-none absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -right-2 bottom-0 w-20 h-20 rounded-full bg-white/5" />

        <div className="relative flex items-start justify-between gap-3 mb-4">
          <div className="stat-card-heading flex items-center gap-2 min-w-0">
            <p className="stat-card-heading-label text-sm font-semibold text-white">Productivity</p>
            <span className="stat-card-badge text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-white/15 text-indigo-100">
              This month
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Gauge className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="stat-card-metrics relative grid grid-cols-3 gap-2">
          {(metrics || []).map((metric) => (
            <div key={metric.label} className="min-w-0">
              <p className="stat-card-metric-value text-lg font-bold tracking-tight tabular-nums leading-none">{metric.value}</p>
              <p className="stat-card-metric-label text-[11px] text-indigo-100 mt-1.5 leading-tight">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-stat-card bg-white rounded-2xl border border-slate-200 shadow-sm p-5 min-h-[132px] hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="stat-card-body min-w-0">
          <p className="stat-card-title text-sm text-slate-500 mb-2 truncate">{title}</p>
          <p className="stat-card-value text-3xl font-bold text-slate-900 tracking-tight leading-none">{value}</p>
          {change ? (
            <div className="stat-card-meta flex items-center gap-1 mt-3">
              {trend === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-500 shrink-0" />
              )}
              <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                {change} from last month
              </span>
            </div>
          ) : null}
        </div>
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
      </div>
    </div>
  );
}
