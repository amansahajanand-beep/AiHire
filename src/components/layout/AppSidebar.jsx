import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, FileSearch, Bot, Activity,
  Settings, HelpCircle, LogOut, Hexagon, X,
} from 'lucide-react';
import { logout } from '../../api/auth';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/candidates', label: 'Candidates', icon: Users },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/resume-screening', label: 'Resume Screening', icon: FileSearch },
  { to: '/automation', label: 'Automation Solutions', icon: Bot },
  { to: '/hiring-activity', label: 'Hiring Activity', icon: Activity },
];

const bottomItems = [
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '#', label: 'Help & Support', icon: HelpCircle },
];

export default function AppSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
    }`;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#0F172A] transform transition-transform duration-200 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Hexagon className="w-4 h-4 text-white fill-white/20" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">HireAI</span>
            {onClose && (
              <button onClick={onClose} className="ml-auto lg:hidden text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass} onClick={onClose}>
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="px-3 py-4 border-t border-slate-800 space-y-0.5">
            {bottomItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={label} to={to} className={linkClass} onClick={onClose}>
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors w-full"
            >
              <LogOut className="w-[18px] h-[18px] shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
