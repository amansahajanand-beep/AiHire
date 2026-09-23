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
        <div className="mt-5 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5 lg:gap-2">
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
