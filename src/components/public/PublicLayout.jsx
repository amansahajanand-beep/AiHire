import { Outlet, useLocation } from 'react-router-dom';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

// Set to false to hide the footer on the Home page.
const SHOW_FOOTER_ON_HOME = false;

export default function PublicLayout() {
  const { pathname } = useLocation();
  const showFooter = SHOW_FOOTER_ON_HOME || pathname !== '/';
  return (
    <div className="min-h-screen bg-[#FBFBFD] text-slate-900 flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      {showFooter && <PublicFooter />}
    </div>
  );
}
