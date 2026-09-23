import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gauge, FileSearch, MessageSquare, Zap } from 'lucide-react';
import Features from './Features';
import HowItWorks from './HowItWorks';

const highlights = [
  { icon: Gauge, label: '100-Point Candidate Evaluation' },
  { icon: FileSearch, label: 'AI-Powered Resume Screening' },
  { icon: MessageSquare, label: '5 Role-Specific Interview Questions' },
  { icon: Zap, label: 'Faster Candidate Screening' },
];

const simpleFlow = [
  'Job Requirement',
  'Resume Screening',
  'Candidate Intelligence',
  'Interview Ready',
];

export default function Landing() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.replace('#', ''));
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash]);

  useEffect(() => {
    const root = document.querySelector('.homepage-reveal');
    if (!root) return;

    const targets = [];
    const add = (el) => {
      if (!el || !(el instanceof Element) || targets.includes(el)) return;
      if (targets.some((t) => t.contains(el))) return;
      for (let i = targets.length - 1; i >= 0; i -= 1) {
        if (el.contains(targets[i])) targets.splice(i, 1);
      }
      targets.push(el);
    };

    // Intro section from reference image (Hero + highlight cards + Simple Flow)
    const intro = root.querySelector('#home-intro');
    if (intro) {
      intro.querySelectorAll('.home-reveal').forEach(add);
      const hero = intro.querySelector(':scope > .text-center');
      if (hero) [...hero.children].forEach(add);
      const highlights = intro.querySelector(':scope > .grid');
      if (highlights) [...highlights.children].forEach(add);
      const simpleFlow = intro.querySelector(':scope > .mt-16');
      if (simpleFlow) {
        [...simpleFlow.children].forEach((child) => {
          if (child.classList.contains('flex') && !child.classList.contains('items-center')) {
            [...child.children].forEach(add);
          } else if (child.matches('p')) {
            add(child);
          } else if (child.classList.contains('flex')) {
            [...child.children].forEach(add);
          } else {
            add(child);
          }
        });
      }
    }

    // Features + How It Works (existing working animations — leave as-is)
    ['#features', '#how-it-works'].forEach((sel) => {
      const wrap = root.querySelector(sel);
      if (!wrap) return;
      const section = wrap.querySelector(':scope > section') || wrap;

      const introBlock = section.querySelector(':scope > .max-w-2xl');
      if (introBlock) [...introBlock.children].forEach(add);

      section.querySelectorAll('.rounded-2xl.border.shadow-sm').forEach(add);

      section.querySelectorAll('h1, h2, p, li, span.rounded-full').forEach((el) => {
        if (el.closest('.rounded-2xl.border.shadow-sm')) return;
        if (el.getAttribute('aria-hidden') === 'true') return;
        if (!el.textContent.trim()) return;
        add(el);
      });
    });

    targets.forEach((el) => el.classList.add('home-reveal'));

    const groups = new Map();
    targets.forEach((el) => {
      const group =
        el.closest('#home-intro, #features, #how-it-works, .text-center, .grid, .mt-16') ||
        el.parentElement;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(el);
    });
    groups.forEach((els) => {
      els.forEach((el, i) => {
        el.style.setProperty('--reveal-delay', `${Math.min(i * 110, 440)}ms`);
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -4% 0px' },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="homepage-reveal w-[90%] md:w-[80%] lg:w-[60%] mx-auto pt-16 sm:pt-24 pb-20 min-w-0 max-w-full">
      <div id="home-intro">
      <div className="text-center">
        <h1 className="home-reveal text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
          Hire smarter. Screen candidates faster.
        </h1>
        <p className="home-reveal text-slate-500 mt-5 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          HireScope transforms job requirements and candidate resumes into AI-powered hiring intelligence, helping recruiters screen candidates faster and make informed hiring decisions.
        </p>
        <div className="home-reveal flex flex-wrap items-center justify-center gap-3 mt-8">
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50"
          >
            Sign In
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16">
        {highlights.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="home-reveal flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-sm font-semibold text-slate-800 min-w-0 break-words">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="home-reveal text-xs font-semibold tracking-wider uppercase text-slate-400 mb-4">Simple flow</p>
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-1.5 lg:flex-nowrap lg:gap-2">
          {simpleFlow.map((label, i) => (
            <div
              key={label}
              className="home-reveal flex flex-col sm:flex-row items-center gap-2 sm:gap-1.5 lg:gap-2 max-w-full"
            >
              <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 sm:px-2.5 md:px-3.5 text-xs sm:text-[13px] lg:text-sm font-medium text-slate-700 whitespace-nowrap max-w-full">
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
      </div>

      <section id="features" className="block mt-8 rounded-2xl scroll-mt-20 [&>section]:max-w-none [&>section]:mx-0 [&>section]:px-0">
        <Features />
      </section>

      <section id="how-it-works" className="block rounded-2xl scroll-mt-20 [&>section]:max-w-none [&>section]:mx-0 [&>section]:px-0">
        <HowItWorks />
      </section>
    </div>
  );
}
