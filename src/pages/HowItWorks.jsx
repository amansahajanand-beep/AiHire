import {
  FileText, Star, AlertTriangle, BarChart3, ThumbsUp, ChevronRight, ChevronDown, UploadCloud, X,
} from 'lucide-react';

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
  { label: 'Experience', weight: 30 },
  { label: 'Skills', weight: 40 },
  { label: 'Stability', weight: 15 },
  { label: 'Education', weight: 15 },
];

// Report rows shown in the step 4 mockup (the items the section has always listed, minus the score ring).
const reportRows = [
  { label: 'Executive Summary', icon: FileText },
  { label: 'Candidate Strengths', icon: Star },
  { label: 'Risk Flags', icon: AlertTriangle },
  { label: 'Career Progression', icon: BarChart3 },
  { label: 'Hiring Recommendation', icon: ThumbsUp },
];

// Site theme (index.css): primary indigo #6366F1 / #4F46E5, with the matching light indigo tints.
const PRIMARY = '#6366F1';
const PRIMARY_DARK = '#4F46E5';
const accentGradient = `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DARK})`;

// Below @3xl the cards stack with a down arrow under each; from @3xl they sit in 3 columns (arrows after
// cards 1, 2 and 4); from @6xl all five share one row (arrows after cards 1-4).
const arrowAfter = ['hidden @3xl:flex', 'hidden @3xl:flex', 'hidden @6xl:flex', 'hidden @3xl:flex', null];

function Bar({ className = '', tone = 'bg-indigo-100' }) {
  return <div className={`h-[7px] rounded-full ${tone} ${className}`} />;
}

// Donut ring that scales with the card block's width (cqw) so it never crowds its label.
function Ring({ percent, min = 34, max = 46, vw = 3.2, stroke = 5, children }) {
  const size = 44;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: `clamp(${min}px, ${vw}cqw, ${max}px)`, aspectRatio: '1' }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90 w-full h-full">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E0E7FF" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={PRIMARY_DARK}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(c * percent) / 100} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// Small illustrated avatar (drawn, not a photo): used on the resume cards and the report header.
function Avatar({ variant = 'a', className = '' }) {
  const hair = variant === 'a' ? '#1E1B4B' : '#1E1B4B';
  const shirt = variant === 'a' ? '#818CF8' : PRIMARY_DARK;
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="8" fill="#E0E7FF" />
      <path d="M6 40c1-8 7-12 14-12s13 4 14 12z" fill={shirt} />
      {variant === 'b' && <path d="M18.5 28l1.5 6 1.5-6z" fill="#1E1B4B" />}
      <circle cx="20" cy="17" r="7" fill="#F4CDAF" />
      {variant === 'a' ? (
        <path d="M12.5 18c-1-8 4-11 8-11s9 3 7.5 11c-1-4-3-6-7.5-6s-6.5 2-8 6z" fill={hair} />
      ) : (
        <path d="M13 16c0-6 4-8.5 7-8.5S27 10 27 16c-2-3-4-4-7-4s-5 1-7 4z" fill={hair} />
      )}
    </svg>
  );
}

// AI robot with a laptop and a note. Drawn symmetrically around x=90 so it sits dead-centre above the panel.
// No ground shadow or other loose curves: every shape stays inside the viewBox and clear of the panel below.
function Robot() {
  return (
    <svg viewBox="0 0 180 128" className="block mx-auto w-[88%] max-w-[230px]" aria-hidden>
      {/* spark marks beside the head (pale, straight) */}
      <path d="M40 42l8 4M37 52l10 1M140 42l-8 4M143 52l-10 1" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" />
      {/* antenna */}
      <path d="M90 22V12" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
      <circle cx="90" cy="10" r="4" fill="#4F46E5" />
      {/* ear cups */}
      <rect x="54" y="40" width="9" height="22" rx="4.5" fill="#4F46E5" />
      <rect x="117" y="40" width="9" height="22" rx="4.5" fill="#4F46E5" />
      {/* head */}
      <rect x="60" y="22" width="60" height="52" rx="22" fill="#FFFFFF" stroke="#A5B4FC" strokeWidth="2.5" />
      <rect x="68" y="32" width="44" height="32" rx="14" fill="#1E1B4B" />
      <circle cx="80" cy="46" r="5" fill="#A5F3FC" />
      <circle cx="100" cy="46" r="5" fill="#A5F3FC" />
      <path d="M84 55q6 5 12 0" stroke="#A5F3FC" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* torso */}
      <rect x="70" y="78" width="40" height="30" rx="13" fill="#FFFFFF" stroke="#A5B4FC" strokeWidth="2.5" />
      <circle cx="90" cy="93" r="5" fill="#EEF2FF" stroke="#6366F1" strokeWidth="2" />
      {/* left arm resting at the side */}
      <rect x="58" y="82" width="9" height="20" rx="4.5" fill="#C7D2FE" />
      {/* right arm reaching the laptop */}
      <path d="M110 90h12" stroke="#C7D2FE" strokeWidth="9" strokeLinecap="round" />
      {/* laptop: screen, base and the hand on top */}
      <path d="M118 84h34l-4 22h-30z" fill="#4338CA" />
      <circle cx="135" cy="94" r="2.5" fill="#C7D2FE" />
      <rect x="112" y="106" width="46" height="5" rx="2.5" fill="#312E81" />
      <circle cx="121" cy="90" r="5.5" fill="#C7D2FE" stroke="#FFFFFF" strokeWidth="1.5" />
      {/* note card */}
      <rect x="22" y="84" width="28" height="27" rx="5" fill="#FFFFFF" stroke="#A5B4FC" strokeWidth="2" />
      <rect x="27" y="91" width="13" height="4" rx="2" fill="#818CF8" />
      <rect x="27" y="98" width="18" height="3" rx="1.5" fill="#C7D2FE" />
      <rect x="27" y="104" width="12" height="3" rx="1.5" fill="#E0E7FF" />
    </svg>
  );
}

// ---- Illustrated previews (decorative mock interfaces) ----------------------------------------

function JobFormPreview() {
  return (
    <div className="rounded-2xl bg-white shadow-md border border-indigo-50 p-4 space-y-3.5">
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-3">
        <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap">Job Title</span>
        <span className="h-8 rounded-lg border border-slate-200 px-2.5 flex items-center text-[11px] text-slate-700 whitespace-nowrap overflow-hidden">HR Executive</span>
        <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap">Experience</span>
        <span className="h-8 rounded-lg border border-slate-200 px-2.5 flex items-center text-[11px] text-slate-700 whitespace-nowrap overflow-hidden">2 - 4 Years</span>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 items-start">
        <span className="text-[11px] font-bold text-slate-800 pt-1 whitespace-nowrap">Key Skills</span>
        <div className="flex flex-col items-start gap-1.5">
          {['Recruitment', 'Communication', 'MS Office'].map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100"
            >
              {skill}
              <X className="w-2.5 h-2.5 text-indigo-500" strokeWidth={3} />
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-800 mb-1.5">Key Requirements</p>
        <div className="rounded-lg bg-indigo-50/70 p-3 space-y-2">
          <Bar className="w-full" tone="bg-indigo-100" />
          <Bar className="w-full" tone="bg-indigo-100" />
          <Bar className="w-full" tone="bg-indigo-100" />
          <Bar className="w-2/3" tone="bg-indigo-100" />
        </div>
      </div>
    </div>
  );
}

function ResumeCard({ variant, className = '' }) {
  return (
    <div className={`absolute w-[47%] rounded-lg bg-white border border-indigo-100 shadow-md p-2.5 ${className}`}>
      <div className="flex items-center gap-2 mb-2.5">
        <Avatar variant={variant} className="w-8 h-8 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Bar />
          <Bar className="w-2/3" />
        </div>
      </div>
      <div className="space-y-1.5 pb-3.5">
        <Bar tone="bg-slate-200" />
        <Bar tone="bg-slate-200" className="w-5/6" />
        <Bar tone="bg-slate-200" className="w-2/3" />
        <Bar tone="bg-slate-200" className="w-3/4" />
      </div>
      <span className="absolute -bottom-2 right-2 text-[9px] font-bold bg-indigo-600 text-white rounded px-1.5 py-px shadow-sm">PDF</span>
    </div>
  );
}

function UploadPreview() {
  return (
    <div>
      <div className="relative h-[142px] mx-auto w-[96%] mb-4">
        <ResumeCard variant="a" className="left-0 top-5 -rotate-6 z-0" />
        <ResumeCard variant="b" className="left-[26.5%] top-0 z-10" />
        <ResumeCard variant="a" className="left-[53%] top-5 rotate-6 z-0" />
      </div>
      <div className="rounded-xl border-2 border-dashed border-indigo-300 bg-white/80 px-3 py-5 flex flex-col items-center text-center">
        <UploadCloud className="w-12 h-12 text-indigo-600" strokeWidth={1.5} />
        <p className="text-xs font-medium text-slate-700 mt-2">Drag &amp; drop resumes here</p>
        <p className="text-[11px] text-slate-500 my-1.5">or</p>
        <span className="inline-flex h-9 items-center rounded-lg px-5 text-xs font-semibold text-white shadow-md" style={{ background: accentGradient }}>
          Upload Resumes
        </span>
      </div>
    </div>
  );
}

function ScreeningPreview() {
  return (
    <div className="flex flex-col items-center">
      <Robot />
      <div className="w-full rounded-2xl bg-white shadow-md border border-indigo-50 p-3 mt-1 relative">
        <p className="text-xs font-bold text-slate-900 text-center mb-3">100-Point Evaluation</p>
        <div className="grid grid-cols-2 gap-x-1 gap-y-3.5">
          {evaluationWeights.map((item) => (
            <div
              key={item.label}
              className="flex flex-row items-center gap-1.5 min-w-0 text-left @min-[768px]:@max-[859px]:flex-col @min-[768px]:@max-[859px]:text-center @min-[1152px]:@max-[1329px]:flex-col @min-[1152px]:@max-[1329px]:text-center"
            >
              <Ring percent={item.weight} min={34} max={42} vw={2.8}>
                <span className="text-[10px] font-bold text-slate-900">{item.weight}%</span>
              </Ring>
              <span className="text-[9.5px] font-medium text-slate-700 leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportPreview() {
  return (
    <div className="rounded-2xl bg-white shadow-md border border-indigo-50 p-4">
      <p className="text-[11px] font-bold text-slate-900 mb-3">Candidate Report</p>
      <div className="flex items-center gap-2.5 mb-4">
        <Avatar variant="b" className="w-12 h-12 shrink-0" />
        <div className="flex-1 space-y-2">
          <Bar tone="bg-slate-200" />
          <Bar tone="bg-slate-200" className="w-2/3" />
        </div>
        <Ring percent={78} min={46} max={56} vw={4} stroke={4.5}>
          <span className="text-center leading-none">
            <span className="block text-[8px] font-semibold text-slate-700">Score</span>
            <span className="block text-[9px] font-bold text-slate-900 mt-0.5">78/100</span>
          </span>
        </Ring>
      </div>
      <div className="space-y-3">
        {reportRows.map(({ label, icon: Icon }) => (
          <div key={label} className="flex items-start gap-2.5">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm" style={{ background: accentGradient }}>
              <Icon className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-bold text-slate-900 leading-tight">{label}</p>
              <Bar tone="bg-indigo-100" className="w-full mt-1.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Browser-style window with the three traffic-light dots and five numbered question rows.
function InterviewPreview() {
  return (
    <div className="rounded-2xl bg-white border border-indigo-100 shadow-md overflow-hidden">
      <div className="h-8 flex items-center gap-1.5 px-3.5" style={{ background: accentGradient }}>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
      </div>
      <div className="p-3.5 space-y-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex items-center gap-2.5 rounded-xl bg-indigo-50/60 px-2 py-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-extrabold flex items-center justify-center shrink-0">
              {n}
            </span>
            <div className="flex-1 space-y-1.5">
              <Bar className="w-full" tone="bg-indigo-200/70" />
              <Bar className="w-3/5" tone="bg-indigo-200/70" />
            </div>
            <span className="text-sm font-bold text-indigo-300">?</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const previews = [JobFormPreview, UploadPreview, ScreeningPreview, ReportPreview, InterviewPreview];

function Sparks({ flip = false }) {
  return (
    <svg viewBox="0 0 44 44" className={`w-9 h-9 sm:w-11 sm:h-11 shrink-0 ${flip ? '-scale-x-100' : ''}`} aria-hidden>
      <path d="M8 22h28M13 10l23 7M13 34l23-7" stroke={PRIMARY} strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function HowItWorks() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          <Sparks />
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">How It Works</h1>
          <Sparks flip />
        </div>
        <p className="text-slate-600 mt-4 text-base sm:text-lg leading-relaxed">
          From job requirement to interview-ready insights in five steps.
        </p>
      </div>

      {/*
        The home page wraps every section in a column that is only 60% of the screen wide, which is why five
        cards used to wrap. This block centres itself on the page and may be wider than that column (never
        wider than 94% of the screen); the card layout adapts to this block's own width.
      */}
      <div className="@container relative left-1/2 mt-16 w-[min(94vw,1360px)] -translate-x-1/2">
        <div className="grid grid-cols-1 @3xl:grid-cols-3 @6xl:grid-cols-5 gap-x-5 gap-y-16">
          {steps.map((step, i) => {
            const Preview = previews[i];
            const connector = arrowAfter[i];
            return (
              <div
                key={step.n}
                className="relative flex flex-col rounded-[26px] border border-indigo-100 px-5 pb-6 pt-12 shadow-sm"
                style={{
                  background: 'linear-gradient(180deg, #EEF2FF 0%, #F8FAFF 100%)',
                  boxShadow: '0 16px 36px -20px rgba(79, 70, 229, 0.35)',
                }}
              >
                <span
                  className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full text-white text-2xl font-extrabold flex items-center justify-center ring-[5px] ring-white"
                  style={{ background: accentGradient, boxShadow: '0 12px 22px -8px rgba(79, 70, 229, 0.7)' }}
                >
                  {step.n}
                </span>
                <h2 className="text-[clamp(18px,1.5cqw,22px)] font-extrabold text-slate-900 text-center leading-tight">{step.title}</h2>
                <p className="text-sm text-slate-600 text-center mt-2.5 leading-snug">{step.body}</p>
                <div className="mt-6 flex-1 flex flex-col justify-end">
                  <Preview />
                </div>

                {connector && (
                  <span
                    aria-hidden
                    className={`${connector} absolute top-1/2 -right-[33px] z-10 w-[46px] h-[46px] -translate-y-1/2 items-center justify-center rounded-full text-white ring-4 ring-white`}
                    style={{ background: accentGradient, boxShadow: '0 10px 18px -6px rgba(79, 70, 229, 0.6)' }}
                  >
                    <ChevronRight className="w-6 h-6" strokeWidth={2.6} />
                  </span>
                )}
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className="@3xl:hidden absolute -bottom-[44px] left-1/2 z-10 -translate-x-1/2 w-10 h-10 flex items-center justify-center rounded-full text-white shadow-md ring-4 ring-white"
                    style={{ background: accentGradient }}
                  >
                    <ChevronDown className="w-5 h-5" strokeWidth={2.6} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
