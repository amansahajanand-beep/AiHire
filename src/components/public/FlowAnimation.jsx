import { useEffect, useRef, useState } from 'react';

/**
 * Horizontal step flow with alternating curved arrows (desktop only).
 * Steps highlight left to right and the arrow to the next step draws in, then the loop restarts.
 */
const FLOW_STEP_MS = 2400;

const ARC_H = 36;

// Alternating arc between two neighbouring cards: even index arcs over the top, odd index arcs underneath.
// Drawn in real pixels (measured width) so the arrowhead can follow the exact tangent at the end of the curve.
function FlowArc({ index, state }) {
  const over = index % 2 === 0;
  const boxRef = useRef(null);
  const [w, setW] = useState(150);

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return undefined;
    const update = () => setW(node.getBoundingClientRect().width || 150);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const y0 = over ? ARC_H : 0;
  const yc = over ? 0 : ARC_H;
  const c1 = [w * 0.2, yc];
  const c2 = [w * 0.8, yc];
  const path = `M0 ${y0} C${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${w} ${y0}`;
  const angle = (Math.atan2(y0 - c2[1], w - c2[0]) * 180) / Math.PI;
  const arrow = `translate(${w} ${y0}) rotate(${angle})`;
  const arrowShape = 'M-8 -5 L0 0 L-8 5';

  return (
    <div
      ref={boxRef}
      aria-hidden
      className={`pointer-events-none absolute left-1/2 z-10 w-[calc(100%+1.5rem)] ${over ? 'bottom-full' : 'top-full'}`}
      style={{ height: ARC_H }}
    >
      <svg width={w} height={ARC_H} viewBox={`0 0 ${w} ${ARC_H}`} className="absolute inset-0 overflow-visible" fill="none">
        <path d={path} stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 5" />
        <path
          d={arrowShape}
          transform={arrow}
          stroke="#CBD5E1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        width={w}
        height={ARC_H}
        viewBox={`0 0 ${w} ${ARC_H}`}
        className={`absolute inset-0 overflow-visible ${state === 'active' ? 'flow-wipe' : ''}`}
        style={{ clipPath: state === 'idle' ? 'inset(-12px 100% -12px 0)' : 'inset(-12px -12px -12px 0)' }}
        fill="none"
      >
        <path d={path} stroke="#818CF8" strokeWidth="2" strokeLinecap="round" />
        <path
          d={arrowShape}
          transform={arrow}
          stroke="#6366F1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function FlowAnimation({ steps }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || reduced) return undefined;
    const timer = setInterval(() => setActive((a) => (a + 1) % steps.length), FLOW_STEP_MS);
    return () => clearInterval(timer);
  }, [visible, reduced]);

  const arcState = (i) => {
    if (reduced || i < active) return 'done';
    return i === active ? 'active' : 'idle';
  };

  return (
    <div ref={ref} className="hidden lg:flex items-stretch gap-6 py-12">
      {steps.map((label, i) => {
        const isActive = !reduced && i === active;
        return (
          <div key={label} className="relative flex-1 min-w-0">
            <div
              className={`h-full flex items-center justify-center rounded-xl border bg-white px-3 py-4 text-center text-sm font-medium text-slate-700 transition-all duration-500 ease-out ${
                isActive ? 'scale-105 border-indigo-300' : 'scale-100 border-slate-200'
              }`}
              style={isActive ? { boxShadow: '0 0 0 4px rgba(99,102,241,0.08), 0 12px 28px -12px rgba(99,102,241,0.45)' } : undefined}
            >
              {label}
            </div>
            {i < steps.length - 1 ? <FlowArc index={i} state={arcState(i)} /> : null}
          </div>
        );
      })}
      <style>{`
        @keyframes flow-wipe {
          from { clip-path: inset(-12px 100% -12px 0); }
          to { clip-path: inset(-12px -12px -12px 0); }
        }
        .flow-wipe { animation: flow-wipe ${FLOW_STEP_MS * 0.85}ms ease-in-out forwards; }
      `}</style>
    </div>
  );
}

