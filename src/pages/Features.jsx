import {
  FileSearch,
  Briefcase,
  Gauge,
  ClipboardList,
  MessageSquare,
  Copy,
  ShieldCheck,
  LayoutDashboard,
  FolderKanban,
  FileText,
  Flag,
  Award,
  TrendingUp,
  BadgeCheck,
} from 'lucide-react';

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

const featureCards = [
  {
    icon: FileSearch,
    title: 'AI Resume Screening',
    body: 'Automatically analyzes uploaded resumes and matches them to the selected job.',
  },
  {
    icon: Briefcase,
    title: 'Job-Specific Screening',
    body: 'Every candidate is screened against that role’s requirements, not a generic keyword list.',
  },
  {
    icon: MessageSquare,
    title: '5 Role-Specific Interview Questions',
    body: 'Generates five interview questions tailored to the candidate and the job.',
  },
  {
    icon: Copy,
    title: 'Duplicate Candidate Detection',
    body: 'Identifies repeat applications so the same profile is not screened twice.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Resume Storage',
    body: 'Resumes are stored securely in your HireAI workspace.',
  },
  {
    icon: LayoutDashboard,
    title: 'Candidate Dashboard',
    body: 'Review screened profiles, scores, and status from one candidate dashboard.',
  },
  {
    icon: FolderKanban,
    title: 'Job Management',
    body: 'Create and manage jobs that drive job-specific screening.',
  },
  {
    icon: FileText,
    title: 'Screening Reports',
    body: 'Structured screening reports for every candidate after AI evaluation.',
  },
];

export default function Features() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Features</h1>
        <p className="text-slate-500 mt-3 leading-relaxed">
          HireAI screens resumes against your jobs, scores every candidate on a 100-point scale, and delivers a full intelligence report your team can act on.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <Gauge className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-slate-900">100-Point Candidate Evaluation</h2>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                Each candidate is scored out of 100 using a fixed weightage across four parameters.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {evaluationWeights.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-3 text-center">
                    <p className="text-lg font-bold text-indigo-600 tracking-tight">{item.weight}</p>
                    <p className="text-xs font-medium text-slate-600 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-slate-900">Candidate Intelligence Report</h2>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                After screening, every profile includes a complete report your recruiters can review in one place.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 mt-5">
                {reportItems.map(({ label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {featureCards.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
