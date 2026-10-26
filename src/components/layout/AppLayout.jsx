import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import TopNavbar from './TopNavbar';
import BottomNav from './BottomNav';
import { useAppDispatch } from '../../store/hooks';
import { fetchDashboardTotals, fetchScreeningOverview, fetchHiringPipeline } from '../../store/slices/dashboardSlice';
import { fetchJobs } from '../../store/slices/jobsSlice';
import { fetchCandidates } from '../../store/slices/candidatesSlice';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDashboard = useLocation().pathname === '/dashboard';
  const dispatch = useAppDispatch();

  // Warm the cache once when the authenticated shell mounts.
  useEffect(() => {
    dispatch(fetchDashboardTotals());
    dispatch(fetchScreeningOverview());
    dispatch(fetchHiringPipeline());
    dispatch(fetchJobs());
    dispatch(fetchCandidates());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#F2F2F5] overflow-x-clip">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[236px] lg:pr-3 lg:py-3 lg:h-screen">
        <div className="lg:h-full lg:overflow-y-auto bg-[#FBFBFC] lg:rounded-[22px] lg:border lg:border-slate-200/80 lg:shadow-[0_1px_2px_rgba(18,18,28,0.04)]">
          <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
          <main className={`app-main pt-6 pb-24 lg:pb-12 ${isDashboard ? 'px-0' : 'px-4 sm:px-6 lg:px-10'}`}>
            <div className={isDashboard ? 'mx-auto w-[90%] max-w-none' : 'mx-auto w-full max-w-[1240px]'}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
