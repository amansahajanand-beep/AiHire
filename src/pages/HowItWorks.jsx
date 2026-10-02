import { useEffect, useRef, useState } from 'react';
import { Gauge, FileText, Award, Flag, TrendingUp, BadgeCheck } from 'lucide-react';

const steps = [
  {
    n: '01',
    title: 'Create Job Requirement',
    body: 'Add the Role, Experience, Skills & Key Requirements.',
  },
  {
    n: '02',
    title: 'Upload Resumes',
    body: 'Upload one or multiple candidate resumes securely.',
  },
  {
    n: '03',
    title: 'AI-Powered Screening',
    body: 'HireScope engine evaluates the complete candidate profile against the specific job requirement.',
  },
  {
    n: '04',
    title: 'Get Candidate Intelligence Report',
    body: 'Instantly receive a full report for every screened candidate.',
  },
  {
    n: '05',
    title: 'Interview Ready',
    body: 'Get 5 role-specific interview questions for every candidate.',
  },
];

const evaluationWeights = [
  { label: 'Experience', weight: '30%' },
  { label: 'Skills', weight: '40%' },
  { label: 'Stability', weight: '15%' },
  { label: 'Education', weight: '15%' },
];

const reportItems = [
  { label: 'Score', icon: Gauge },
  { label: 'Executive Summary', icon: FileText },
  { label: 'Candidate Strengths', icon: Award },
  { label: 'Risk Flags', icon: Flag },
  { label: 'Career Progression', icon: TrendingUp },
  { label: 'Hiring Recommendation', icon: BadgeCheck },
];

const simpleFlow = [
  'Job Requirement',
  'Resume Upload',
  'AI Screening',
  '100-Point Evaluation',
  'Candidate Insights',
  'Interview Ready',
];

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
        className={`absolute inset-0 overflow-visible ${state === 'active' ? 'hiw-wipe' : ''}`}
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

function AnimatedFlow() {
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
    const timer = setInterval(() => setActive((a) => (a + 1) % simpleFlow.length), FLOW_STEP_MS);
    return () => clearInterval(timer);
  }, [visible, reduced]);

  const arcState = (i) => {
    if (reduced || i < active) return 'done';
    return i === active ? 'active' : 'idle';
  };

  return (
    <div ref={ref} className="hidden lg:flex items-stretch gap-6 py-12">
      {simpleFlow.map((label, i) => {
        const isActive = !reduced && i === active;
        return (
          <div key={label} className="relative flex-1 min-w-0">
            <div
              className={`h-full flex items-center justify-center rounded-xl border bg-[#F8FAFC] px-3 py-4 text-center text-sm font-medium text-slate-700 transition-all duration-500 ease-out ${
                isActive ? 'scale-105 border-indigo-300' : 'scale-100 border-slate-200'
              }`}
              style={isActive ? { boxShadow: '0 0 0 4px rgba(99,102,241,0.08), 0 12px 28px -12px rgba(99,102,241,0.45)' } : undefined}
            >
              {label}
            </div>
            {i < simpleFlow.length - 1 ? <FlowArc index={i} state={arcState(i)} /> : null}
          </div>
        );
      })}
      <style>{`
        @keyframes hiw-wipe {
          from { clip-path: inset(-12px 100% -12px 0); }
          to { clip-path: inset(-12px -12px -12px 0); }
        }
        .hiw-wipe { animation: hiw-wipe ${FLOW_STEP_MS * 0.85}ms ease-in-out forwards; }
      `}</style>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">How It Works</h1>
        <p className="text-slate-500 mt-3 leading-relaxed">
          From job requirement to interview-ready insights in five steps.
        </p>
      </div>

      <div className="mt-10 space-y-5">
        {steps.map((step) => (
          <div key={step.n} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="text-xs font-bold tracking-widest text-indigo-600 mt-0.5 shrink-0">
                {step.n}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-slate-900">{step.title}</h2>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{step.body}</p>

                {step.n === '03' ? (
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-slate-800">100-Point Evaluation</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      {evaluationWeights.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-3 text-center"
                        >
                          <p className="text-lg font-bold text-indigo-600 tracking-tight">{item.weight}</p>
                          <p className="text-xs font-medium text-slate-600 mt-1">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {step.n === '04' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 mt-5">
                    {reportItems.map(({ label, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">Simple flow</h2>
        <AnimatedFlow />
        <div className="mt-5 lg:hidden flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5 lg:gap-2">
          {simpleFlow.map((label, i) => (
            <div
              key={label}
              className="flex flex-col sm:flex-row items-center gap-2 sm:gap-1.5 lg:gap-2 max-w-full"
            >
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-[#F8FAFC] px-3 py-1.5 text-xs sm:text-[13px] lg:text-sm font-medium text-slate-700 whitespace-nowrap max-w-full">
                {label}
              </span>
              {i < simpleFlow.length - 1 ? (
                <span className="text-slate-600 text-sm rotate-90 sm:rotate-0" aria-hidden>
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
