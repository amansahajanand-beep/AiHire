import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, FileSearch, Bot, Activity,
  Settings, HelpCircle, LogOut, Sparkles, X,
} from 'lucide-react';
import { logout } from '../../api/auth';
import { useAppDispatch } from '../../store/hooks';
import { resetHiringData } from '../../store';
import logo from '../../assets/logo.png';

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
  const dispatch = useAppDispatch();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-[3px] ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 border-indigo-600'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
    }`;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between gap-2 px-5 pt-6 pb-4">
            <div className="min-w-0 flex-1">
              <img
                src={logo}
                alt="HireScope"
                className="h-11 w-auto max-w-full object-contain object-left"
              />
            </div>
            {onClose && (
              <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-slate-700 shrink-0">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="px-5 mb-2">
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Workspace</p>
          </div>

          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={linkClass} onClick={onClose}>
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="px-3 pb-3 space-y-0.5">
            {bottomItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={label} to={to} className={linkClass} onClick={onClose}>
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
            <button
              onClick={() => {
                logout();
                resetHiringData(dispatch);
                navigate('/login');
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors w-full border-l-[3px] border-transparent"
            >
              <LogOut className="w-[18px] h-[18px] shrink-0" />
              <span>Logout</span>
            </button>
          </div>

          <div className="px-4 pb-5">
            <button
              onClick={() => {
                onClose?.();
                navigate('/resume-screening');
              }}
              className="w-full text-left rounded-xl bg-indigo-50 border border-indigo-100 p-3.5 hover:bg-indigo-100/70 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-indigo-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-indigo-900">AI screening ready</p>
                  <p className="text-xs text-indigo-600/80 mt-0.5 leading-relaxed">
                    Select a job to start matching resumes.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
