import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Play, Check, Timer, LayoutDashboard, Users, Briefcase, FileSearch, Bot, Activity,
  BarChart3, MessageSquare, FileEdit, TrendingUp, Upload, Target, UserCheck, FileText, ArrowLeftRight,
  Plus, Minus, History, Lock, Hourglass, UserX, Files, ClipboardCheck,
} from 'lucide-react';

const WRAP = 'w-[92%] md:w-[60%] mx-auto';
const EYEBROW = 'font-mono text-[10px] tracking-[0.14em] uppercase text-indigo-600';
const H2 = 'text-[28px] sm:text-[34px] font-bold tracking-[-0.03em] leading-[1.05] text-slate-900';
const CARD = 'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)]';
const PRIMARY_BTN =
  'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-white text-[13px] font-semibold shadow-[0_10px_22px_-8px_rgba(107,71,230,0.65),inset_0_1px_0_rgba(255,255,255,0.22)] hover:opacity-95';
const PRIMARY_BG = { background: 'linear-gradient(180deg, #7B5CF0 0%, #6B47E6 100%)' };

/* ------------------------------------------------------------------ hero */

const candidates = [
  { rank: '01', initials: 'MK', name: 'Monu Kumar Yadav', score: 78, tone: 'green', rec: 'Recommended' },
  { rank: '02', initials: 'AJ', name: 'Ashish Jaiswal', score: 76, tone: 'green', rec: 'Recommended' },
  { rank: '03', initials: 'SK', name: 'Shreyas K S', score: 75, tone: 'green', rec: 'Recommended' },
  { rank: '04', initials: 'SK', name: 'Sandeep Kumar', score: 70, tone: 'green', rec: 'Consider after Technical Interview' },
  { rank: '05', initials: 'SY', name: 'Sharad Yadav', score: 67, tone: 'amber', rec: 'Consider after Technical Interview' },
  { rank: '06', initials: 'KI', name: 'Kottana Indra Kiran', score: 59, tone: 'red', rec: 'Below 60: Not Recommended' },
];

const TONE = {
  green: { text: 'text-emerald-700', bar: 'bg-emerald-600' },
  amber: { text: 'text-amber-700', bar: 'bg-amber-600' },
  red: { text: 'text-red-600', bar: 'bg-red-500' },
};
const REC_PILL = {
  Recommended: 'bg-emerald-50 text-emerald-700',
  'Consider after Technical Interview': 'bg-blue-50 text-blue-700',
  'Below 60: Not Recommended': 'bg-amber-50 text-amber-700',
};

function ProductMockup() {
  const sideItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Users, label: 'Candidates', active: true },
    { icon: Briefcase, label: 'Jobs' },
    { icon: FileSearch, label: 'Resume Screening' },
    { icon: Bot, label: 'Automation' },
    { icon: Activity, label: 'Hiring Activity' },
  ];
  const ring = 2 * Math.PI * 22;
  return (
    <div className="relative mt-16 max-w-[1040px] mx-auto">
      <div
        className="absolute inset-x-10 -bottom-6 h-24 rounded-[50%] blur-3xl"
        style={{ background: 'rgba(129,104,238,0.28)' }}
        aria-hidden
      />
      <div className="relative rounded-[22px] border border-slate-200/90 bg-white p-1.5 shadow-[0_24px_60px_-24px_rgba(31,20,80,0.35)]">
        <div className="rounded-[17px] border border-slate-200/80 bg-white overflow-hidden">
          {/* window chrome */}
          <div className="relative flex items-center h-9 px-4 border-b border-slate-100 bg-slate-50/60">
            <span className="flex gap-1.5">
              {[0, 1, 2].map((i) => <span key={i} className="w-2 h-2 rounded-full bg-slate-200" />)}
            </span>
            <span className="absolute left-1/2 -translate-x-1/2 font-mono text-[9px] text-slate-500 bg-slate-100 rounded-md px-3 py-0.5">
              app.hirescop.com/candidates
            </span>
          </div>

          <div className="grid md:grid-cols-[150px_minmax(0,1fr)] lg:grid-cols-[150px_minmax(0,1fr)_212px] min-h-[330px] text-left">
            {/* sidebar */}
            <div className="hidden md:block border-r border-slate-100 bg-slate-50/50 p-2.5 space-y-1">
              {sideItems.map(({ icon: Icon, label, active }) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 h-7 px-2 rounded-lg text-[10px] whitespace-nowrap ${
                    active ? 'bg-white border border-slate-200/80 text-slate-900 font-medium shadow-[0_1px_2px_rgba(18,18,28,0.05)]' : 'text-slate-500'
                  }`}
                >
                  <Icon className="w-3 h-3" strokeWidth={1.8} /> {label}
                </div>
              ))}
            </div>

            {/* ranked list */}
            <div className="p-4 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-slate-900">Full Stack Developer</p>
                  <p className="font-mono text-[8.5px] text-slate-400 mt-1">JOB-A10486 · 42 candidates ranked</p>
                </div>
                <span className="inline-flex items-center gap-1.5 h-5 px-2 rounded-md bg-emerald-50 text-[9px] font-medium text-emerald-700 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Analysis complete
                </span>
              </div>
              <div className="mt-3.5 rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
                {candidates.map((c) => (
                  <div key={c.rank} className={`flex items-center gap-2.5 px-3 h-[35px] ${c.rank === '01' ? 'bg-slate-50' : ''}`}>
                    <span className="font-mono text-[8px] text-slate-400 w-3">{c.rank}</span>
                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-[7.5px] font-semibold flex items-center justify-center shrink-0">{c.initials}</span>
                    <span className="flex-1 min-w-0 truncate text-[10px] font-semibold text-slate-900">{c.name}</span>
                    <span className={`w-7 text-[10px] font-semibold tabular-nums ${TONE[c.tone].text}`}>{c.score}%</span>
                    <span className="hidden sm:block w-[62px] h-[3px] rounded-full bg-slate-100 overflow-hidden shrink-0">
                      <span className={`block h-full rounded-full ${TONE[c.tone].bar}`} style={{ width: `${c.score}%` }} />
                    </span>
                    <span className={`hidden sm:block w-[128px] truncate rounded px-1.5 py-0.5 text-[8px] ${REC_PILL[c.rec]}`}>{c.rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* detail panel */}
            <div className="hidden lg:flex flex-col border-l border-slate-100 p-3.5 gap-3 min-h-0">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-semibold flex items-center justify-center">MK</span>
                <div className="leading-tight">
                  <p className="text-[10.5px] font-semibold text-slate-900">Monu Kumar Yadav</p>
                  <p className="text-[8.5px] text-slate-500 mt-0.5">Full Stack Developer</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 p-3">
                <span className="relative w-[50px] h-[50px] shrink-0">
                  <svg viewBox="0 0 50 50" className="w-full h-full -rotate-90" aria-hidden>
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#ECE7FF" strokeWidth="4" />
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#6B47E6" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${ring * 0.78} ${ring}`} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-slate-900">78%</span>
                </span>
                <div className="leading-tight">
                  <p className="text-[8.5px] text-slate-500">Match Score</p>
                  <p className="text-[10.5px] font-semibold text-emerald-700 mt-1">Recommended</p>
                </div>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
                <p className="flex items-center gap-1.5 text-[9px] font-medium text-indigo-700">
                  <Sparkles className="w-2.5 h-2.5" /> AI Candidate Summary
                </p>
                <div className="mt-2.5 space-y-1.5">
                  {['100%', '82%', '64%'].map((w) => <span key={w} className="block h-1 rounded-full bg-indigo-200/70" style={{ width: w }} />)}
                </div>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-1.5">
                <span className="h-7 rounded-lg bg-[#12121C] text-white text-[9.5px] font-medium flex items-center justify-center">Shortlist</span>
                <span className="h-7 rounded-lg border border-slate-200 text-slate-800 text-[9.5px] font-medium flex items-center justify-center">Review</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* floating cards */}
      <div className="hidden md:flex absolute -left-7 top-[104px] items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-[0_14px_30px_-12px_rgba(18,18,28,0.25)]">
        <span className="w-8 h-8 rounded-lg bg-[#12121C] flex items-center justify-center">
          <Timer className="w-4 h-4 text-white" strokeWidth={1.8} />
        </span>
        <span className="leading-tight text-left">
          <span className="block text-[14px] font-semibold text-slate-900">14.7h</span>
          <span className="block text-[9.5px] text-slate-500">saved this month</span>
        </span>
      </div>
      <div className="hidden md:flex absolute -right-5 bottom-[76px] items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-[0_14px_30px_-12px_rgba(18,18,28,0.25)]">
        <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
          <UserCheck className="w-4 h-4 text-emerald-600" strokeWidth={1.8} />
        </span>
        <span className="leading-tight text-left">
          <span className="block text-[11px] font-semibold text-slate-900">Candidate shortlisted</span>
          <span className="block text-[9.5px] text-slate-500">by Career · just now</span>
        </span>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[640px]"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 520px 260px at 50% 150px, rgba(129,104,238,0.2), transparent 70%), linear-gradient(rgba(18,18,28,0.035) 1px, transparent 1px) 0 0 / 44px 44px, linear-gradient(90deg, rgba(18,18,28,0.035) 1px, transparent 1px) 0 0 / 44px 44px',
          WebkitMaskImage: 'linear-gradient(180deg, #000 55%, transparent)',
          maskImage: 'linear-gradient(180deg, #000 55%, transparent)',
        }}
      />
      <div className={`${WRAP} relative pt-16 sm:pt-20 text-center`}>
        <span className="inline-flex items-center gap-2 h-8 pl-3 pr-1 rounded-full bg-white border border-indigo-100 text-[11px] font-medium text-indigo-700 shadow-sm">
          <Sparkles className="w-3 h-3" /> AI-powered resume screening
          <span className="ml-1 h-6 px-2.5 inline-flex items-center rounded-full bg-indigo-50 text-[10.5px]">6 AI agents</span>
        </span>

        <h1 className="mx-auto mt-7 max-w-[600px] text-[40px] sm:text-[52px] leading-[1] font-bold tracking-[-0.04em] text-slate-900">
          Screen every resume.{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">Shortlist the right ones</span>{' '}
          in seconds.
        </h1>
        <p className="mx-auto mt-7 max-w-[460px] text-[13.5px] leading-relaxed text-slate-600">
          HireScop analyzes resumes, matches candidates with jobs, and helps you build the best team — with human review built into every decision.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className={PRIMARY_BTN} style={PRIMARY_BG}>
            Start screening free <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to={{ pathname: '/', hash: 'how-it-works' }}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-800 shadow-[0_1px_2px_rgba(18,18,28,0.04)] hover:bg-slate-50"
          >
            <Play className="w-3 h-3" /> See how it works
          </Link>
        </div>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10.5px] text-slate-500">
          {['~6s per candidate', 'Up to 10 resumes per batch', 'Human review built in'].map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-600" strokeWidth={2.4} /> {t}
            </li>
          ))}
        </ul>

        <ProductMockup />
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- stats */

function Stats() {
  const stats = [
    ['~6s', 'Average AI screening time per candidate'],
    ['10', 'Resumes analyzed in a single batch'],
    ['6', 'AI agents across your hiring workflow'],
    ['0–100', 'Match score with a clear recommendation'],
  ];
  return (
    <section className={`${WRAP} mt-24`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-slate-200/80">
        {stats.map(([value, label], i) => (
          <div key={value} className={`px-5 py-7 border-l border-slate-200/80 ${i >= 2 ? 'max-lg:border-t' : ''} ${i % 2 === 1 ? 'max-lg:border-r' : ''} ${i === 3 ? 'lg:border-r' : ''}`}>
            <p className="text-[34px] font-bold tracking-[-0.03em] leading-none text-slate-900">{value}</p>
            <p className="mt-3 text-[11.5px] leading-relaxed text-slate-500 max-w-[170px]">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- agents */

function Agents() {
  const bars = [
    ['Skills match', 86],
    ['Experience', 74],
    ['Responsibilities', 79],
    ['Qualifications', 70],
  ];
  const agents = [
    { icon: BarChart3, tone: 'bg-blue-50 text-blue-600', title: 'AI Candidate Ranker', body: 'Ranks all candidates based on job requirements and experience.' },
    { icon: Sparkles, tone: 'bg-amber-50 text-amber-600', title: 'AI Candidate Summary', body: "Creates quick AI summary of a candidate's experience and strengths." },
    { icon: MessageSquare, tone: 'bg-purple-50 text-purple-600', title: 'AI Interview Question Generator', body: 'Generates personalized interview questions for each candidate.' },
    { icon: FileEdit, tone: 'bg-emerald-50 text-emerald-600', title: 'AI Job Description Optimizer', body: 'Analyzes and improves job descriptions to attract better candidates.' },
    { icon: TrendingUp, tone: 'bg-indigo-50 text-indigo-600', title: 'AI Hiring Insights', body: 'Get intelligent insights and reports on your hiring pipeline. Coming soon.' },
  ];
  return (
    <section id="product" className={`${WRAP} mt-28 scroll-mt-20`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className={EYEBROW}>Key benefits</p>
          <h2 className={`${H2} mt-4 max-w-[360px]`}>Six AI agents that do the first pass for you.</h2>
        </div>
        <p className="text-[12px] leading-relaxed text-slate-500 max-w-[290px] md:mb-1">
          Turn each agent on when you need it. They share context, so a ranking or summary always reflects the job you wrote.
        </p>
      </div>

      <div
        className="lp-card mt-9 rounded-3xl p-7 text-white grid md:grid-cols-2 gap-8 items-center"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(129,104,238,0.45), transparent 55%), #170F3A' }}
      >
        <div>
          <span className="lp-icon w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
            <FileSearch className="w-4 h-4 text-indigo-200" strokeWidth={1.8} />
          </span>
          <h3 className="mt-14 text-[19px] font-semibold tracking-tight">AI Resume Screener</h3>
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-indigo-200 max-w-[310px]">
            Automatically analyzes resumes and calculates job-match scores — every candidate, against every requirement, in about six seconds.
          </p>
        </div>
        <div className="space-y-2">
          {bars.map(([label, pct]) => (
            <div key={label} className="flex items-center gap-3 h-8 px-3 rounded-lg bg-white/[0.06] border border-white/10 text-[10px]">
              <span className="w-[86px] shrink-0">{label}</span>
              <span className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <span className="block h-full rounded-full bg-[#8B6EF2]" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-8 text-right font-semibold tabular-nums">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {agents.map(({ icon: Icon, tone, title, body }) => (
          <div key={title} className={`${CARD} lp-card p-5`}>
            <span className={`lp-icon w-9 h-9 rounded-xl flex items-center justify-center ${tone}`}>
              <Icon className="w-4 h-4" strokeWidth={1.8} />
            </span>
            <h3 className="mt-6 text-[14px] font-semibold tracking-tight text-slate-900">{title}</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- how it works */

function HowItWorks() {
  const steps = [
    { icon: Upload, title: 'Upload Resumes', body: 'Pick a job and drop in up to 10 PDF resumes.' },
    { icon: FileSearch, title: 'AI Analysis', body: 'Each resume is parsed and compared with your job requirements.' },
    { icon: Target, title: 'Match Score', body: 'Candidates receive a score and a clear recommendation.' },
    { icon: UserCheck, title: 'Shortlist & Hire', body: 'Your team reviews, shortlists, and moves the best people forward.' },
  ];
  return (
    <section id="how-it-works" className={`${WRAP} mt-28 scroll-mt-20`}>
      <div className="text-center">
        <p className={EYEBROW}>How it works</p>
        <h2 className={`${H2} mt-4 max-w-[370px] mx-auto`}>From a stack of PDFs to a ranked shortlist.</h2>
      </div>
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map(({ icon: Icon, title, body }, i) => (
          <div key={title} className={`${CARD} lp-card p-5`}>
            <div className="flex items-start justify-between">
              <span className="lp-icon w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Icon className="w-4 h-4 text-indigo-600" strokeWidth={1.8} />
              </span>
              <span className="font-mono text-[22px] font-semibold text-indigo-100 leading-none">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <h3 className="mt-6 text-[13.5px] font-semibold tracking-tight text-slate-900">{title}</h3>
            <p className="mt-2 text-[11.5px] leading-relaxed text-slate-500">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- workflow */

function Workflow() {
  const chips = ['React', 'Node.js', 'TypeScript', '5+ years', 'PostgreSQL'];
  const steps = [
    { icon: FileText, label: 'Parse resume content' },
    { icon: ArrowLeftRight, label: 'Match against requirements' },
    { icon: Target, label: 'Score 0–100%' },
  ];
  const outputs = [
    ['Recommended', 3, 'bg-emerald-50 text-emerald-700', 'bg-emerald-600'],
    ['Consider after interview', 4, 'bg-blue-50 text-blue-700', 'bg-blue-600'],
    ['Not recommended', 3, 'bg-red-50 text-red-600', 'bg-red-500'],
  ];
  const decisions = [
    { icon: UserCheck, label: 'Shortlist', tone: 'text-emerald-600' },
    { icon: Hourglass, label: 'Move to review', tone: 'text-amber-600' },
    { icon: UserX, label: 'Reject with a note', tone: 'text-red-500' },
  ];
  return (
    <section id="workflow" className={`${WRAP} mt-28 scroll-mt-20`}>
      <div
        className="rounded-[28px] border border-indigo-100/80 p-6 sm:p-9"
        style={{
          background:
            'radial-gradient(rgba(107,71,230,0.16) 1px, transparent 1px) 0 0 / 14px 14px, linear-gradient(180deg, #F3F0FE 0%, #F6F4FE 100%)',
        }}
      >
        <p className={EYEBROW}>Smart hiring workflow</p>
        <h2 className={`${H2} mt-4 max-w-[430px]`}>AI sorts the pile. Your team makes the call.</h2>

        <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className={`${CARD} lp-card p-4`}>
            <p className="font-mono text-[8.5px] tracking-wider text-slate-500">INPUT</p>
            <p className="mt-2 text-[13px] font-semibold text-slate-900">Job requirements</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {chips.map((c) => <span key={c} className="rounded-md bg-slate-100 px-2 py-1 text-[9.5px] text-slate-700">{c}</span>)}
            </div>
            <p className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-500">
              <Files className="lp-icon w-3 h-3 text-indigo-500" strokeWidth={1.8} /> 10 resumes uploaded
            </p>
          </div>

          <div className="lp-card rounded-2xl p-4 text-white" style={{ background: 'radial-gradient(ellipse at top left, rgba(129,104,238,0.5), transparent 60%), #170F3A' }}>
            <p className="font-mono text-[8.5px] tracking-wider text-indigo-300">HIRESCOP AI</p>
            <p className="mt-2 text-[13px] font-semibold">Analyze · Match · Score</p>
            <div className="mt-4 space-y-2">
              {steps.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 h-8 px-2.5 rounded-lg bg-white/[0.07] border border-white/10 text-[10px]">
                  <Icon className="lp-icon w-3 h-3 text-indigo-300" strokeWidth={1.8} /> {label}
                </div>
              ))}
            </div>
          </div>

          <div className={`${CARD} lp-card p-4`}>
            <p className="font-mono text-[8.5px] tracking-wider text-slate-500">OUTPUT</p>
            <p className="mt-2 text-[13px] font-semibold text-slate-900">Ranked recommendations</p>
            <div className="mt-3 space-y-2">
              {outputs.map(([label, n, pill, dot]) => (
                <div key={label} className={`flex items-center gap-2 h-8 px-2.5 rounded-lg text-[10px] ${pill}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dot}`} /> <span className="flex-1">{label}</span>
                  <span className="font-semibold tabular-nums">{n}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${CARD} lp-card p-4 flex flex-col`}>
            <p className="font-mono text-[8.5px] tracking-wider text-slate-500">DECISION</p>
            <p className="mt-2 text-[13px] font-semibold text-slate-900">Human review</p>
            <div className="mt-4 space-y-3">
              {decisions.map(({ icon: Icon, label, tone }) => (
                <p key={label} className="flex items-center gap-2.5 text-[10.5px] text-slate-800">
                  <Icon className={`lp-icon w-3.5 h-3.5 ${tone}`} strokeWidth={1.8} /> {label}
                </p>
              ))}
            </div>
            <p className="mt-auto pt-4 border-t border-slate-100 text-[9.5px] leading-relaxed text-slate-500">
              Every action is logged to Hiring Activity.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- trust */

function Trust() {
  const items = [
    { icon: ClipboardCheck, title: 'Human review on every shortlist', body: 'AI recommends; recruiters decide. Nothing moves forward without a person.' },
    { icon: History, title: 'Complete activity history', body: 'Every screening, shortlist, and rejection is timestamped with who performed it.' },
    { icon: Lock, title: 'Workspace-level access control', body: 'Manage members, roles, and integrations from one settings area.' },
  ];
  return (
    <section className={`${WRAP} mt-28`}>
      <div className="grid md:grid-cols-2 gap-10 items-start">
        <div>
          <p className={EYEBROW}>Enterprise trust</p>
          <h2 className={`${H2} mt-4 max-w-[340px]`}>Built for accountable hiring decisions.</h2>
          <p className="mt-5 text-[12px] leading-relaxed text-slate-500 max-w-[320px]">
            AI-generated results may be inaccurate. HireScop is designed so a person verifies every shortlist before it becomes a hiring decision.
          </p>
        </div>
        <ul className="border-t border-slate-200/80">
          {items.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3.5 py-4 border-b border-slate-200/80">
              <span className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-[0_1px_2px_rgba(18,18,28,0.04)]">
                <Icon className="w-3.5 h-3.5 text-indigo-600" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-[12.5px] font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- faq */

const faqs = [
  {
    q: 'How does HireScop score a resume?',
    a: 'Each resume is compared with the job title, required skills, experience, responsibilities, and qualifications you define. The result is a match score from 0–100% and a recommendation.',
  },
  {
    q: 'How many resumes can I screen at once?',
    a: 'Up to 10 PDF resumes per batch — 2 MB per file and 20 MB in total.',
  },
  {
    q: 'Does AI make the final hiring decision?',
    a: 'No. AI recommends; your team reviews and decides. Every shortlist, review, and rejection is a human action that is logged to Hiring Activity.',
  },
  {
    q: 'Which AI agents are included?',
    a: 'Resume Screener, Candidate Ranker, Candidate Summary, Interview Question Generator, Job Description Optimizer, and Hiring Insights (coming soon).',
  },
  {
    q: 'Can my whole hiring team use it?',
    a: 'Yes. Your workspace shares jobs, candidates, and activity, with members and roles managed from Settings.',
  },
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className={`${WRAP} mt-28 scroll-mt-20`}>
      <div className="text-center">
        <p className={EYEBROW}>FAQ</p>
        <h2 className={`${H2} mt-4`}>Questions, answered.</h2>
      </div>
      <div className={`${CARD} mt-10 max-w-[615px] mx-auto overflow-hidden divide-y divide-slate-100`}>
        {faqs.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full flex items-center justify-between gap-4 px-5 h-14 text-left text-[12.5px] font-medium text-slate-900"
              >
                {item.q}
                <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {isOpen ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                </span>
              </button>
              {isOpen && <p className="px-5 pb-5 -mt-1 text-[11.5px] leading-relaxed text-slate-500 max-w-[520px]">{item.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- cta */

function FinalCta() {
  return (
    <section className={`${WRAP} mt-24`}>
      <div
        className="relative overflow-hidden rounded-[28px] px-6 py-14 text-center text-white"
        style={{
          background:
            'radial-gradient(ellipse 420px 200px at 50% 0, rgba(129,104,238,0.55), transparent 70%), radial-gradient(ellipse 260px 160px at 100% 100%, rgba(59,91,219,0.45), transparent 70%), #170F3A',
        }}
      >
        <h2 className="text-[34px] sm:text-[40px] font-bold tracking-[-0.03em] leading-none">Hire smarter with AI.</h2>
        <p className="mx-auto mt-4 max-w-[390px] text-[12.5px] leading-relaxed text-indigo-200">
          Create a job, upload resumes, and see a ranked shortlist before your next meeting.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-white text-[12.5px] font-semibold text-indigo-900 hover:bg-indigo-50">
            Start screening free <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link to="/login" className="inline-flex items-center h-10 px-5 rounded-xl border border-white/15 bg-white/5 text-[12.5px] font-medium hover:bg-white/10">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ page */

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

  return (
    <div className="min-w-0 max-w-full pb-4 overflow-x-clip">
      <Hero />
      <Stats />
      <Agents />
      <HowItWorks />
      <Workflow />
      <Trust />
      <Faq />
      <FinalCta />
    </div>
  );
}
