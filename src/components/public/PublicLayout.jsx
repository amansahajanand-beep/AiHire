import { Outlet, useLocation } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

// Temporarily hidden on the Home page only: set to true to show the footer there again (the Footer is untouched).
const SHOW_FOOTER_ON_HOME = false;

export default function PublicLayout() {
  const { pathname } = useLocation();
  const showFooter = SHOW_FOOTER_ON_HOME || pathname !== '/';
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      {showFooter && <PublicFooter />}
    </div>
  );
}
