import { useState } from 'react';
import {
  FileSearch, UserCheck, Briefcase, Upload, Eye, XCircle, Calendar,
} from 'lucide-react';
import Card from '../components/ui/Card';
import FilterDropdown from '../components/ui/FilterDropdown';
import { hiringActivities } from '../data/mockData';

const iconMap = { FileSearch, UserCheck, Briefcase, Upload, Eye, XCircle };

const typeColors = {
  screened: 'bg-violet-100 text-violet-600',
  shortlisted: 'bg-blue-100 text-blue-600',
  review: 'bg-indigo-100 text-indigo-600',
  upload: 'bg-emerald-100 text-emerald-600',
  job: 'bg-amber-100 text-amber-600',
  rejected: 'bg-red-100 text-red-600',
};

function formatFullTimestamp(ts) {
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function HiringActivity() {
  const [typeFilter, setTypeFilter] = useState('All');

  const activities = [
    { id: '1', type: 'screened', title: 'Resume screened', description: "John Smith's resume for Frontend Developer", user: 'AI', timestamp: '2024-05-20T10:30:00', icon: 'FileSearch' },
    { id: '2', type: 'shortlisted', title: 'Candidate shortlisted', description: 'Sarah Lee shortlisted for UI/UX Designer', user: 'Admin', timestamp: '2024-05-19T14:15:00', icon: 'UserCheck' },
    { id: '3', type: 'job', title: 'New job published', description: 'Backend Developer job published', user: 'Admin', timestamp: '2024-05-18T11:00:00', icon: 'Briefcase' },
    { id: '4', type: 'upload', title: 'Resume uploaded', description: '5 new resumes uploaded for Senior Frontend Developer', user: 'Admin', timestamp: '2024-05-17T09:45:00', icon: 'Upload' },
    { id: '5', type: 'review', title: 'Candidate moved to review', description: 'Alex Kumar moved to human review', user: 'Admin', timestamp: '2024-05-16T16:20:00', icon: 'Eye' },
    { id: '6', type: 'rejected', title: 'Job closed', description: 'QA Engineer position closed', user: 'Admin', timestamp: '2024-05-15T12:00:00', icon: 'XCircle' },
    ...hiringActivities.slice(0, 0),
  ];

  const filtered = typeFilter === 'All' ? activities : activities.filter((a) => a.type === typeFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hiring Activity</h1>
        <p className="text-slate-500 mt-1">Track all recent activities in your hiring process.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <FilterDropdown
          value={typeFilter}
          options={[
            { value: 'All', label: 'All Activities' },
            { value: 'screened', label: 'Screened' },
            { value: 'shortlisted', label: 'Shortlisted' },
            { value: 'upload', label: 'Uploads' },
            { value: 'job', label: 'Jobs' },
            { value: 'review', label: 'Reviews' },
            { value: 'rejected', label: 'Closed' },
          ]}
          onChange={setTypeFilter}
        />
        <div className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400" />
          01 May 2024 - 30 May 2024
        </div>
      </div>

      <Card>
        <div className="space-y-0">
          {filtered.map((activity, index) => {
            const Icon = iconMap[activity.icon] || FileSearch;
            return (
              <div key={activity.id} className="flex gap-4 relative">
                {index < filtered.length - 1 && (
                  <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-100" />
                )}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${typeColors[activity.type] || 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 pb-8">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{activity.description}</p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-xs text-slate-400">{formatFullTimestamp(activity.timestamp)}</p>
                    <p className="text-xs font-medium text-indigo-600 mt-0.5">by {activity.user}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
