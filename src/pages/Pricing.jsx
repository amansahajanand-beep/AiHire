import { useLayoutEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const sharedFeatures = [
  'AI Resume Screening',
  'Job-Specific Screening',
  '100-Point Candidate Evaluation',
  'Experience – 30%',
  'Skills – 40%',
  'Stability – 15%',
  'Education – 15%',
  'Executive Summary',
  'Candidate Strengths',
  'Risk Flags',
  'Career Progression',
  'Hiring Recommendation',
  '5 Role-Specific Interview Questions',
  'Duplicate Candidate Detection',
  'Secure Resume Storage',
  'Candidate Dashboard',
  'Job Management',
  'Screening Reports',
];

const planFeatures = [
  ...sharedFeatures,
  'Additional Profiles — ₹15/profile',
  'Support — Standard',
];

const PREVIEW_COUNT = 5;

const plans = [
  {
    name: 'Starter',
    featured: false,
    price: '₹2,999',
    profiles: '300',
    effective: '₹10.00',
    bestFor: 'Small / Occasional Hiring',
    cta: 'Get started',
  },
  {
    name: 'Professional',
    featured: true,
    price: '₹6,999',
    profiles: '1,000',
    effective: '₹7.00',
    bestFor: 'Regular Recruitment Teams',
    cta: 'Get started',
  },
  {
    name: 'Enterprise',
    featured: false,
    price: '₹14,999',
    profiles: '3,000',
    effective: '₹5.00',
    bestFor: 'High-Volume Hiring',
    cta: 'Get started',
  },
];

function PlanFeatureList({ planId }) {
  const [expanded, setExpanded] = useState(false);
  const visibleFeatures = expanded ? planFeatures : planFeatures.slice(0, PREVIEW_COUNT);

  return (
    <div className="min-w-0">
      <ul className="space-y-1.5 sm:space-y-2">
        {visibleFeatures.map((feature) => (
          <li
            key={`${planId}-${feature}`}
            className="flex items-start gap-1 sm:gap-2 text-[10px] sm:text-xs lg:text-sm text-slate-600"
          >
            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-emerald-500 mt-0.5 shrink-0" />
            <span className="min-w-0 break-words leading-snug">{feature}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setExpanded((prev) => !prev);
        }}
        className="mt-2 sm:mt-3 text-[10px] sm:text-xs lg:text-sm font-semibold text-indigo-600 hover:text-indigo-700"
      >
        {expanded ? 'Read Less' : 'Read More'}
      </button>
    </div>
  );
}

export default function Pricing() {
  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const toTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    toTop();
    const raf = requestAnimationFrame(() => {
      toTop();
      requestAnimationFrame(toTop);
    });
    const t0 = window.setTimeout(toTop, 0);
    const t1 = window.setTimeout(toTop, 50);

    window.addEventListener('pageshow', toTop);
    window.addEventListener('load', toTop);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.removeEventListener('pageshow', toTop);
      window.removeEventListener('load', toTop);
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = previous || 'auto';
      }
    };
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 py-16 min-w-0 overflow-x-hidden">
      <div className="text-center max-w-2xl mx-auto px-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Pricing</h1>
        <p className="text-slate-500 mt-3 leading-relaxed text-sm sm:text-base">
          Simple monthly plans based on profiles screened. Every plan includes the full HireAI screening toolkit.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 lg:gap-6 mt-8 sm:mt-12 items-start min-w-0">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl sm:rounded-2xl border bg-white p-2.5 sm:p-5 lg:p-6 xl:p-8 flex flex-col min-w-0 ${
              plan.featured
                ? 'border-indigo-600 shadow-sm ring-1 ring-indigo-600'
                : 'border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between gap-1 sm:gap-2 min-h-[22px] sm:min-h-[28px]">
              <p className="text-[11px] sm:text-sm font-semibold text-slate-900 truncate">{plan.name}</p>
              {plan.featured ? (
                <span className="text-[8px] sm:text-[11px] font-semibold tracking-wide uppercase px-1 sm:px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 shrink-0">
                  Popular ⭐
                </span>
              ) : null}
            </div>
            <p className="text-[9px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2 leading-snug">Best for: {plan.bestFor}</p>
            <p className="mt-3 sm:mt-5">
              <span className="text-base sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">{plan.price}</span>
              <span className="text-[9px] sm:text-sm text-slate-500 ml-0.5 sm:ml-1">/ month</span>
            </p>
            <p className="text-[10px] sm:text-sm text-slate-600 mt-2 sm:mt-3 leading-snug">{plan.profiles} profiles / month</p>
            <p className="text-[9px] sm:text-sm text-slate-500 mt-1 leading-snug">
              Effective price / profile:{' '}
              <span className="font-semibold text-slate-700">{plan.effective}</span>
            </p>

            <div className="border-t border-slate-100 mt-3 sm:mt-6 pt-3 sm:pt-5 flex-1 min-w-0">
              <PlanFeatureList key={plan.name} planId={plan.name} />
            </div>

            <Link
              to="/register"
              className={`mt-4 sm:mt-8 inline-flex items-center justify-center w-full py-1.5 sm:py-2.5 rounded-md sm:rounded-lg text-[10px] sm:text-sm font-semibold ${
                plan.featured
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
