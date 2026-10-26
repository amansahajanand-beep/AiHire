import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import useClickOutside from '../../hooks/useClickOutside';

/**
 * Styled single-select. Same props as the old native <select> version (`value`, `options`, `onChange`,
 * `label`, `className`, `icon`), so every page that uses it keeps working. The list opens directly under the
 * field, left-aligned with it, at least as wide as the field.
 */
export default function FilterDropdown({ label, value, options, onChange, className = '', icon: Icon }) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(wrapRef, close, open);

  const items = useMemo(
    () => options.map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt)),
    [options]
  );
  const selectedIndex = items.findIndex((item) => item.value === value);
  const selected = items[selectedIndex];

  const openList = () => {
    const rect = wrapRef.current?.getBoundingClientRect();
    // keep the list on screen: open towards the left when there is no room on the right
    setAlignRight(Boolean(rect) && rect.left + 340 > window.innerWidth - 12 && rect.right - 340 > 12);
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const choose = (item) => {
    onChange(item.value);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (items[active]) choose(items[active]);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  // keep the highlighted row visible while moving with the keyboard
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      {label && <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={`w-full flex items-center gap-2 text-left h-[38px] pl-3 pr-2.5 text-[13px] font-medium text-slate-800 border rounded-xl bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)] focus:outline-none transition-colors ${
          open ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:border-indigo-400'
        }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" strokeWidth={1.8} />}
        <span className="flex-1 min-w-0 truncate">{selected ? selected.label : ''}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className={`absolute z-50 top-full mt-1.5 min-w-full w-max max-w-[320px] max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-[0_12px_32px_-8px_rgba(18,18,28,0.18)] ${
            alignRight ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, i) => {
            const isSelected = item.value === value;
            return (
              <li
                key={item.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(item)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] cursor-pointer ${
                  i === active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                } ${isSelected ? 'font-semibold' : 'font-normal'}`}
              >
                <span className="flex-1 whitespace-nowrap">{item.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" strokeWidth={2.4} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
