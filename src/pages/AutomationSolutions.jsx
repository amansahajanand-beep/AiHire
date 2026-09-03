import AutomationAgentCard from '../components/automation/AutomationAgentCard';
import { automationAgents } from '../data/mockData';

export default function AutomationSolutions() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Automation Solutions</h1>
        <p className="text-slate-500 mt-1">Leverage AI agents to automate your hiring workflow.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {automationAgents.map((agent) => (
          <AutomationAgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
