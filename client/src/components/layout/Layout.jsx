import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import MobileHeader from './MobileHeader';
import Dashboard from '../dashboard/Dashboard';
import ShiftSchedule from '../shifts/ShiftSchedule';
import ShiftApproval from '../approval/ShiftApproval';
import DailySummaries from '../summaries/DailySummaries';
import Chatters from '../chatters/Chatters';
import Models from '../models/Models';
import Errors from '../errors/Errors';
import Analytics from '../analytics/Analytics';
import { getPendingShifts } from '../../services/api';

const pages = {
  dashboard: Dashboard,
  shifts: ShiftSchedule,
  approval: ShiftApproval,
  summaries: DailySummaries,
  chatters: Chatters,
  models: Models,
  errors: Errors,
  analytics: Analytics,
};

export default function Layout() {
  const [activePage, setActivePage] = useState('dashboard');
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    getPendingShifts()
      .then((data) => setPendingCount(Array.isArray(data) ? data.length : data.count ?? 0))
      .catch(() => {});
  }, [activePage]);

  const PageComponent = pages[activePage] || Dashboard;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        pendingCount={pendingCount}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <div className="hidden lg:flex items-center justify-start sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-3 z-40">
          <span className="text-sm text-gray-400">ShiftPro — ניהול משמרות</span>
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-950 pt-[52px] pb-[60px] lg:pt-0 lg:pb-0">
          <PageComponent />
        </main>

        <MobileNav activePage={activePage} onNavigate={setActivePage} />
      </div>
    </div>
  );
}
