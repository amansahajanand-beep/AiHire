import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';
import useClickOutside from '../../hooks/useClickOutside';
import { getStoredUser } from '../../api/config';
import Avatar from '../ui/Avatar';

const PAGE_TITLES = [
  ['/dashboard', 'Dashboard'],
  ['/candidates/', 'Candidate'],
  ['/candidates', 'Candidates'],
  ['/jobs/create', 'Create Job'],
  ['/jobs/', 'Job'],
  ['/jobs', 'Jobs'],
  ['/resume-screening', 'Resume Screening'],
  ['/ai-analysis', 'AI Analysis'],
  ['/automation', 'Automation Solutions'],
  ['/hiring-activity', 'Hiring Activity'],
  ['/settings', 'Settings'],
];

export default function TopNavbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const pageTitle = (PAGE_TITLES.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix)) || [])[1] || 'Dashboard';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const menuRef = useRef(null);
  useClickOutside(menuRef, () => setDropdownOpen(false), dropdownOpen);
  const [storedUser, setStoredUser] = useState(getStoredUser);
  useEffect(() => {
    const sync = () => setStoredUser(getStoredUser());
    window.addEventListener('hireai:user-updated', sync);
    return () => window.removeEventListener('hireai:user-updated', sync);
  }, []);
  const user = storedUser || { name: 'User', email: '', role: 'Admin' };
  const displayName = user.name || 'User';
  const role = user.role || 'Admin';

  return (
    <header className="sticky top-0 z-30 bg-[#FBFBFC]/90 backdrop-blur px-4 sm:px-6 lg:px-10 h-[60px] flex items-center gap-4 lg:rounded-t-[22px]">
      <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
        <Menu className="w-5 h-5" />
      </button>

      <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-[13px] text-slate-500 shrink-0">
        <span className="truncate max-w-[160px]">{user.company || 'Workspace'}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="font-medium text-slate-900">{pageTitle}</span>
      </nav>

      <div className="flex-1 min-w-0 flex justify-end">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <NotificationBell />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Avatar name={displayName} src={user.avatar} />
            <div className="hidden sm:block text-left">
              <p className="text-[13px] font-semibold text-slate-900 leading-tight">{displayName}</p>
              <p className="text-[11px] text-slate-500">{role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <>
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-700">{displayName}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                  {user.client_id && <p className="text-xs text-indigo-600 mt-1">{user.client_id}</p>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
