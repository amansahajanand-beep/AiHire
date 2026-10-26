import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, FileSearch, Bot, Activity,
  Settings, HelpCircle, LogOut, X,
} from 'lucide-react';
import { logout } from '../../api/auth';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resetHiringData } from '../../store';
import logo from '../../assets/logo.png';

const sections = [
  {
    label: 'Hiring',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/candidates', label: 'Candidates', icon: Users, count: 'candidates' },
      { to: '/jobs', label: 'Jobs', icon: Briefcase, count: 'jobs' },
    ],
  },
  {
    label: 'AI Workflows',
    items: [
      { to: '/resume-screening', label: 'Resume Screening', icon: FileSearch },
      { to: '/automation', label: 'Automation Solutions', icon: Bot },
      { to: '/hiring-activity', label: 'Hiring Activity', icon: Activity },
    ],
  },
];

const bottomItems = [
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '#', label: 'Help & Support', icon: HelpCircle },
];

export default function AppSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const jobCount = useAppSelector((s) => s.jobs.items.length);
  const candidateCount = useAppSelector((s) => s.candidates.lists['all::all']?.items?.length ?? 0);
  const counts = { jobs: jobCount, candidates: candidateCount };

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-colors ${
      isActive
        ? 'bg-white text-slate-900 shadow-[0_1px_2px_rgba(18,18,28,0.08),0_0_0_1px_rgba(18,18,28,0.04)]'
        : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
    }`;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[236px] bg-[#F2F2F5] transform transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full px-3 pt-4 pb-3">
          <div className="flex items-center justify-between gap-2 px-1.5">
            <img
              src={logo}
              alt="HireScop"
              className="h-10 w-auto max-w-[170px] object-contain object-left"
            />
            {onClose && (
              <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-slate-700 shrink-0">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <nav className="mt-7 flex-1 overflow-y-auto space-y-5">
            {sections.map((section) => (
              <div key={section.label}>
                <p className="eyebrow px-2.5 mb-1.5">{section.label}</p>
                <div className="space-y-0.5">
                  {section.items.map(({ to, label, icon: Icon, count }) => (
                    <NavLink key={to} to={to} className={linkClass} onClick={onClose}>
                      {({ isActive }) => (
                        <>
                          <Icon className={`w-[17px] h-[17px] shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} strokeWidth={1.8} />
                          <span className="flex-1 min-w-0 leading-tight">{label}</span>
                          {count && counts[count] > 0 && (
                            <span className="text-[10.5px] font-medium text-slate-500 bg-slate-200/70 rounded-md px-1.5 py-px tabular-nums">
                              {counts[count]}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <button
            onClick={() => {
              onClose?.();
              navigate('/resume-screening');
            }}
            className="w-full text-left rounded-xl bg-white border border-slate-200/80 p-3 mb-2 hover:border-indigo-200 transition-colors shadow-[0_1px_2px_rgba(18,18,28,0.04)]"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-indigo-50 flex items-center justify-center text-[11px]">✦</span>
              <p className="text-[12.5px] font-semibold text-slate-900 flex-1">AI screening ready</p>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1.5 leading-relaxed">
              AI-generated results may be inaccurate. Please verify before making hiring decisions.
            </p>
          </button>

          <div className="border-t border-slate-200/80 pt-2 space-y-0.5">
            {bottomItems.map(({ to, label, icon: Icon }) =>
              to === '#' ? (
                <a key={label} href="#" onClick={(e) => { e.preventDefault(); onClose?.(); }} className={linkClass({ isActive: false })}>
                  <Icon className="w-[17px] h-[17px] shrink-0 text-slate-500" strokeWidth={1.8} />
                  <span>{label}</span>
                </a>
              ) : (
                <NavLink key={label} to={to} className={linkClass} onClick={onClose}>
                  <Icon className="w-[17px] h-[17px] shrink-0 text-slate-500" strokeWidth={1.8} />
                  <span>{label}</span>
                </NavLink>
              ),
            )}
            <button
              onClick={() => {
                logout();
                resetHiringData(dispatch);
                navigate('/login');
              }}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-white/70 hover:text-slate-900 transition-colors w-full"
            >
              <LogOut className="w-[17px] h-[17px] shrink-0 text-slate-500" strokeWidth={1.8} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
