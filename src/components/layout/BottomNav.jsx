import { NavLink } from 'react-router-dom';
import { Lightbulb, FolderKanban, User } from 'lucide-react';

const items = [
  { to: '/automation', label: 'Insights', icon: Lightbulb },
  { to: '/dashboard', label: 'Home', icon: FolderKanban },
  { to: '/settings', label: 'Profile', icon: User },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-full transition-colors ${
                isActive ? 'text-indigo-600' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-full ${isActive ? 'bg-indigo-50' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium sr-only">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
