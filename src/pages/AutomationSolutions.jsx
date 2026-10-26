import { Fragment, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import AutomationAgentCard, { iconMap, tileTone } from '../components/automation/AutomationAgentCard';
import { automationAgents } from '../data/mockData';

// Order agents hand work off to each other in the screening chain.
const CHAIN = [
  'AI Job Description Optimizer',
  'AI Resume Screener',
  'AI Candidate Ranker',
  'AI Candidate Summary',
  'AI Interview Question Generator',
];
const CHAIN_LABEL = {
  'AI Job Description Optimizer': 'JD Optimizer',
  'AI Resume Screener': 'Resume Screener',
  'AI Candidate Ranker': 'Candidate Ranker',
  'AI Candidate Summary': 'Candidate Summary',
  'AI Interview Question Generator': 'Interview Questions',
};

export default function AutomationSolutions() {
  const [statuses, setStatuses] = useState(() => Object.fromEntries(automationAgents.map((a) => [a.id, a.status])));
  const setStatus = (id, status) => setStatuses((prev) => ({ ...prev, [id]: status }));

  const count = (s) => automationAgents.filter((a) => statuses[a.id] === s).length;
  const counts = [
    { label: 'active', n: count('Active'), dot: 'bg-emerald-500' },
    { label: 'available', n: count('Available'), dot: 'bg-slate-400' },
    { label: 'coming soon', n: count('Coming Soon'), dot: 'border border-slate-400' },
  ];

  const chain = CHAIN.map((name) => automationAgents.find((a) => a.name === name)).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-none">Automation Solutions</h1>
          <p className="text-sm text-slate-500 mt-2.5">Leverage AI agents to automate your hiring workflow.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          {counts.map((c) => (
            <span key={c.label} className="inline-flex items-center gap-2 h-8 px-3 rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(18,18,28,0.04)]">
              <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
              <b className="font-semibold text-slate-900">{c.n}</b> {c.label}
            </span>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_2px_rgba(18,18,28,0.04)]"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(107,71,230,0.08), transparent 55%), #fff' }}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[9.5px] tracking-wider text-slate-500">AGENT WORKFLOW</p>
            <h2 className="mt-2 text-[15px] font-semibold tracking-tight text-slate-900">How your agents hand off work</h2>
          </div>
          <p className="text-[11px] text-slate-500">Inactive agents are skipped in the chain</p>
        </div>

        <div className="mt-5 overflow-x-auto pb-1">
          <div className="flex items-stretch min-w-[820px]">
            {chain.map((agent, i) => {
              const on = statuses[agent.id] === 'Active';
              const Icon = iconMap[agent.icon];
              return (
                <Fragment key={agent.id}>
                  <div
                    className={`flex-1 min-w-0 rounded-xl border p-3.5 ${
                      on ? 'border-indigo-100 bg-white' : 'border-slate-100 bg-slate-50/70 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${on ? tileTone[agent.icon] : 'bg-slate-100 text-slate-400'}`}>
                        <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-900 truncate">{CHAIN_LABEL[agent.name]}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[10.5px] text-slate-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {on ? 'Running' : 'Off'}
                    </p>
                  </div>
                  {i < chain.length - 1 && (
                    <span className="flex items-center px-1.5 text-indigo-300 shrink-0">
                      <ArrowRight className="w-4 h-4" strokeWidth={1.6} />
                    </span>
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {automationAgents.map((agent) => (
          <AutomationAgentCard
            key={agent.id}
            agent={agent}
            status={statuses[agent.id]}
            onStatusChange={(s) => setStatus(agent.id, s)}
          />
        ))}
      </div>
    </div>
  );
}
