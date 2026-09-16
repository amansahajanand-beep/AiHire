import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import TopNavbar from './TopNavbar';
import BottomNav from './BottomNav';
import { useAppDispatch } from '../../store/hooks';
import { fetchDashboardTotals, fetchScreeningOverview, fetchHiringPipeline } from '../../store/slices/dashboardSlice';
import { fetchJobs } from '../../store/slices/jobsSlice';
import { fetchCandidates } from '../../store/slices/candidatesSlice';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useAppDispatch();

  // Warm the cache once when the authenticated shell mounts.
  useEffect(() => {
    dispatch(fetchDashboardTotals());
    dispatch(fetchScreeningOverview({ weeks: 5 }));
    dispatch(fetchHiringPipeline());
    dispatch(fetchJobs());
    dispatch(fetchCandidates());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
