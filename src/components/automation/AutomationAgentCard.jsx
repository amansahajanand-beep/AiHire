import {
  FileSearch, BarChart3, MessageSquare, FileEdit, Sparkles, TrendingUp, SlidersHorizontal, Zap, Bell,
} from 'lucide-react';

const iconMap = {
  FileSearch, BarChart3, MessageSquare, FileEdit, Sparkles, TrendingUp,
};

// Soft tile colour per agent icon.
export const tileTone = {
  FileSearch: 'bg-indigo-50 text-indigo-600',
  BarChart3: 'bg-blue-50 text-blue-600',
  MessageSquare: 'bg-purple-50 text-purple-600',
  FileEdit: 'bg-emerald-50 text-emerald-600',
  Sparkles: 'bg-amber-50 text-amber-600',
  TrendingUp: 'bg-slate-100 text-slate-500',
};

export { iconMap };

const descriptions = {
  'AI Resume Screener': 'Automatically analyzes resumes and calculates job-match scores.',
  'AI Candidate Ranker': 'Ranks all candidates based on job requirements and experience.',
  'AI Interview Question Generator': 'Generates personalized interview questions for each candidate.',
  'AI Job Description Optimizer': 'Analyzes and improves job descriptions to attract better candidates.',
  'AI Candidate Summary': "Creates quick AI summary of a candidate's experience and strengths.",
  'AI Hiring Insights': 'Get intelligent insights and reports on your hiring pipeline.',
};

export default function AutomationAgentCard({ agent, status, onStatusChange }) {
  const Icon = iconMap[agent.icon] || Sparkles;
  const description = descriptions[agent.name] || agent.description;

  const isOn = status === 'Active';
  const isComingSoon = status === 'Coming Soon';

  const badge = isOn
    ? { text: 'ON', className: 'bg-emerald-50 text-emerald-700', dot: true }
    : isComingSoon
      ? { text: 'COMING SOON', className: 'bg-slate-100 text-slate-500' }
      : { text: 'AVAILABLE', className: 'bg-slate-100 text-slate-500' };

  const handleAction = () => {
    if (isComingSoon) return;
    if (isOn) return; // Configure — mock only
    onStatusChange('Active');
  };

  const toggle = () => {
    if (isComingSoon) return;
    onStatusChange(isOn ? 'Available' : 'Active');
  };

  return (
    <div
      className={`flex flex-col rounded-2xl p-5 bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)] ${
        isComingSoon ? 'border border-dashed border-slate-300 bg-white/60' : 'border border-slate-200/80'
      }`}
    >
      <div className="flex items-start justify-between mb-5">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${tileTone[agent.icon] || tileTone.Sparkles}`}>
          <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </span>
        <span className={`inline-flex items-center gap-1.5 font-mono text-[9.5px] font-semibold tracking-wider px-2 py-1 rounded-md ${badge.className}`}>
          {badge.dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          {badge.text}
        </span>
      </div>

      <h3 className="text-[14px] font-semibold tracking-tight text-slate-900">{agent.name}</h3>
      <p className="text-xs text-slate-500 flex-1 mt-1.5 mb-5 leading-relaxed">{description}</p>

      <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100">
        {isComingSoon ? (
          <span className="text-xs text-slate-500">In development</span>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={isOn}
              aria-label={`${isOn ? 'Deactivate' : 'Activate'} ${agent.name}`}
              onClick={toggle}
              className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${isOn ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isOn ? 'translate-x-4' : ''}`} />
            </button>
            <span className="text-xs text-slate-600">{isOn ? 'Active' : 'Inactive'}</span>
          </div>
        )}

        {isOn ? (
          <button
            onClick={handleAction}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.8} /> Configure
          </button>
        ) : isComingSoon ? (
          <button
            onClick={handleAction}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50"
          >
            <Bell className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.8} /> Notify Me
          </button>
        ) : (
          <button
            onClick={handleAction}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-[0_1px_2px_rgba(107,71,230,0.4)]"
          >
            <Zap className="w-3.5 h-3.5" /> Enable Agent
          </button>
        )}
      </div>
    </div>
  );
}
