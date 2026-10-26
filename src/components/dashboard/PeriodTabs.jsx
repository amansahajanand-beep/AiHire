export const PERIODS = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

export default function PeriodTabs({ value, onChange, options = PERIODS, stretch = false }) {
  return (
    <div className={`${stretch ? 'flex w-full' : 'inline-flex'} rounded-xl bg-slate-100 p-1 border border-slate-200/70`} role="tablist">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={`${stretch ? 'flex-1' : ''} px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
            value === opt.id ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(18,18,28,0.1)]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
