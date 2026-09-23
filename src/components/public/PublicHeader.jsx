import { Link, NavLink, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';

const navItems = [
  { to: { pathname: '/', hash: 'features' }, label: 'Features', hash: '#features' },
  { to: { pathname: '/', hash: 'how-it-works' }, label: 'How It Works', hash: '#how-it-works' },
  { to: '/pricing', label: 'Pricing' },
];

export default function PublicHeader() {
  const location = useLocation();
  return (
    <header className="sticky top-0 z-40 pt-4">
      <div className="w-[85%] mx-auto h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 bg-white/95 border border-slate-200 shadow-sm backdrop-blur-sm rounded-xl min-w-0">
        <Link to="/" className="flex items-center shrink-0 min-w-0">
          <img
            src={logo}
            alt="HireAI"
            className="h-11 w-auto max-w-[200px] object-contain"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) => {
                const active = item.hash
                  ? location.pathname === '/' && location.hash === item.hash
                  : isActive;
                return `text-sm font-medium transition-colors ${
                  active ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'
                }`;
              }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <nav className="flex md:hidden items-center gap-1.5 min-w-0">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) => {
                  const active = item.hash
                    ? location.pathname === '/' && location.hash === item.hash
                    : isActive;
                  return `text-xs font-medium ${active ? 'text-indigo-600' : 'text-slate-600'}`;
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg border border-indigo-600 bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 hover:border-indigo-700 shrink-0"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
