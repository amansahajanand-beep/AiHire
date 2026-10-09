import { useState } from 'react';
import { StickyNote } from 'lucide-react';
import { humanReviewLabel } from '../../utils/helpers';

/** The human decision; hovering shows the recruiter's note (the reason) when there is one. */
export default function HumanReviewLabel({ evaluation, note, className = 'text-sm text-slate-600' }) {
  const [pos, setPos] = useState(null);
  const label = humanReviewLabel(evaluation);
  const text = (note || '').trim();

  if (!text) return <span className={className}>{label}</span>;

  // position: fixed so the popover is not clipped by the table's horizontal scroll container
  const show = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ left: Math.min(r.left, window.innerWidth - 300), top: r.bottom + 6 });
  };

  return (
    <span
      className="inline-flex items-center gap-1 cursor-help"
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
      onFocus={show}
      onBlur={() => setPos(null)}
      tabIndex={0}
    >
      <span className={`${className} underline decoration-dotted decoration-slate-300 underline-offset-4`}>
        {label}
      </span>
      <StickyNote className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
      {pos && (
        <span
          role="tooltip"
          style={{ left: pos.left, top: pos.top }}
          className="fixed z-[100] w-72 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 text-left shadow-lg"
        >
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Note</span>
          <span className="block text-sm text-slate-700 whitespace-pre-wrap leading-snug">{text}</span>
        </span>
      )}
    </span>
  );
}
