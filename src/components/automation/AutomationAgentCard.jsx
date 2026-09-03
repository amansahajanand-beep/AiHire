import { useState } from 'react';
import {
  FileSearch, BarChart3, MessageSquare, FileEdit, Sparkles, TrendingUp,
} from 'lucide-react';
import Card from '../ui/Card';

const iconMap = {
  FileSearch, BarChart3, MessageSquare, FileEdit, Sparkles, TrendingUp,
};

const descriptions = {
  'AI Resume Screener': 'Automatically analyzes resumes and calculates job-match scores.',
  'AI Candidate Ranker': 'Ranks all candidates based on job requirements and experience.',
  'AI Interview Question Generator': 'Generates personalized interview questions for each candidate.',
  'AI Job Description Optimizer': 'Analyzes and improves job descriptions to attract better candidates.',
  'AI Candidate Summary': "Creates quick AI summary of a candidate's experience and strengths.",
  'AI Hiring Insights': 'Get intelligent insights and reports on your hiring pipeline.',
};

export default function AutomationAgentCard({ agent }) {
  const [status, setStatus] = useState(agent.status);
  const Icon = iconMap[agent.icon] || Sparkles;
  const description = descriptions[agent.name] || agent.description;

  const isOn = status === 'Active';
  const isComingSoon = status === 'Coming Soon';

  const badge = isOn
    ? { text: 'ON', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    : isComingSoon
      ? { text: 'Coming Soon', className: 'bg-slate-100 text-slate-500 border-slate-200' }
      : { text: 'Available', className: 'bg-slate-100 text-slate-500 border-slate-200' };

  const handleAction = () => {
    if (isComingSoon) return;
    if (isOn) return; // Configure — mock only
    setStatus('Active');
  };

  return (
    <Card className="flex flex-col !p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.className}`}>
          {badge.text}
        </span>
      </div>

      <h3 className="text-base font-bold text-slate-900 mb-1.5">{agent.name}</h3>
      <p className="text-sm text-slate-500 flex-1 mb-5 leading-relaxed">{description}</p>

      <button
        onClick={handleAction}
        className="w-full py-2.5 rounded-lg border border-slate-200 bg-white text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors"
      >
        {isOn ? 'Configure' : isComingSoon ? 'Notify Me' : 'Enable Agent'}
      </button>
    </Card>
  );
}
