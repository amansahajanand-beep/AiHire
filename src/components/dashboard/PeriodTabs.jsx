export const PERIODS = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

export default function PeriodTabs({ value, onChange, options = PERIODS }) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-0.5" role="tablist">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            value === opt.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
