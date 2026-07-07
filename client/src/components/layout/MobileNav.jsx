import { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Database,
  TriangleAlert,
  BarChart3,
  MoreHorizontal,
  X,
} from 'lucide-react';

const primaryItems = [
  { id: 'dashboard', label: 'בקרה', icon: LayoutDashboard },
  { id: 'shifts', label: 'משמרות', icon: Calendar },
  { id: 'summaries', label: 'סיכומים', icon: FileText },
  { id: 'chatters', label: 'צ׳אטרים', icon: Users },
];

const moreItems = [
  { id: 'models', label: 'מיוצגות', icon: Database },
  { id: 'analytics', label: 'אנליטיקס', icon: BarChart3 },
];

export default function MobileNav({ activePage, onNavigate }) {
  const [showMore, setShowMore] = useState(false);
  const isMoreActive = moreItems.some(i => i.id === activePage);

  return (
    <>
      {showMore && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-[52px] inset-x-0 bg-gray-900 border-t border-gray-800 p-3 grid grid-cols-4 gap-2" onClick={e => e.stopPropagation()}>
            {moreItems.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button key={item.id}
                  onClick={() => { onNavigate(item.id); setShowMore(false); }}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition-colors ${isActive ? 'text-blue-400 bg-gray-800' : 'text-gray-400 hover:text-white'}`}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 z-50">
        <div className="flex items-center justify-around py-2 px-1">
          {primaryItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button key={item.id} onClick={() => { onNavigate(item.id); setShowMore(false); }}
                className={`flex flex-col items-center gap-0.5 min-w-0 px-1 py-1 text-xs transition-colors ${isActive ? 'text-blue-400' : 'text-gray-500'}`}>
                <Icon size={20} className="shrink-0" />
                <span className="truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
          <button onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center gap-0.5 min-w-0 px-1 py-1 text-xs transition-colors ${isMoreActive || showMore ? 'text-blue-400' : 'text-gray-500'}`}>
            {showMore ? <X size={20} className="shrink-0" /> : <MoreHorizontal size={20} className="shrink-0" />}
            <span className="truncate max-w-full">עוד</span>
          </button>
        </div>
      </nav>
    </>
  );
}
