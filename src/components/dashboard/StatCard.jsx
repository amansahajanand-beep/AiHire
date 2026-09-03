import { Briefcase, Users, UserCheck, Target, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../ui/Card';

const iconMap = { Briefcase, Users, UserCheck, Target };

export default function StatCard({ title, value, change, trend, icon }) {
  const Icon = iconMap[icon] || Briefcase;

  return (
    <Card className="hover:shadow-md transition-shadow !p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500 mb-1 truncate">{title}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              )}
              <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                {change} from last month
              </span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
      </div>
    </Card>
  );
}
