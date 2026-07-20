import { useState, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import MobileHeader from './MobileHeader';
import Dashboard from '../dashboard/Dashboard';
import ShiftSchedule from '../shifts/ShiftSchedule';
import DailySummaries from '../summaries/DailySummaries';
import Chatters from '../chatters/Chatters';
import Models from '../models/Models';

import Analytics from '../analytics/Analytics';
import WhatsAppBroadcastModal from '../whatsapp/WhatsAppBroadcastModal';

const pages = {
  dashboard: Dashboard,
  shifts: ShiftSchedule,
  summaries: DailySummaries,
  chatters: Chatters,
  models: Models,

  analytics: Analytics,
};

export default function Layout() {
  const [activePage, setActivePageRaw] = useState(() => localStorage.getItem('activePage') || 'dashboard');
  const [pageKey, setPageKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const setActivePage = useCallback((page) => {
    localStorage.setItem('activePage', page);
    if (page === activePage) {
      setPageKey(k => k + 1);
    }
    setActivePageRaw(page);
  }, [activePage]);

  const PageComponent = pages[activePage] || Dashboard;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <MobileHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

        <div className="hidden lg:flex items-center justify-between shrink-0 bg-gray-900 border-b border-gray-800 px-6 py-3 z-40">
          <span className="text-sm text-gray-400 truncate">ShiftPro — ניהול משמרות</span>
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="flex items-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            <MessageCircle size={16} />
            <span>שלח הודעה לצ׳אטרים</span>
          </button>
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-950 pt-[52px] pb-[60px] lg:pt-0 lg:pb-0">
          <PageComponent key={pageKey} onNavigate={setActivePage} />
        </main>

        <MobileNav activePage={activePage} onNavigate={setActivePage} />
      </div>

      {showWhatsAppModal && (
        <WhatsAppBroadcastModal onClose={() => setShowWhatsAppModal(false)} />
      )}
    </div>
  );
}
