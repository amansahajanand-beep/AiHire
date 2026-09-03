import { useState } from 'react';
import { Bell, ChevronDown, Menu, Search } from 'lucide-react';
import { getStoredUser } from '../../api/config';
import { getInitials } from '../../utils/helpers';

export default function TopNavbar({ onMenuClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const user = getStoredUser() || { name: 'User', email: '', role: 'Admin' };
  const displayName = user.name || 'User';
  const role = user.client_id ? `Client ${user.client_id}` : (user.role || 'Admin');

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6 h-16 flex items-center gap-4">
      <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-xl hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white" />
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-white">{getInitials(displayName)}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{displayName}</p>
              <p className="text-xs text-slate-400">{role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg border border-slate-200 shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
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
