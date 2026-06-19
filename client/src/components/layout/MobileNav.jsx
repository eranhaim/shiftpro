import {
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  FileText,
  Users,
} from 'lucide-react';

const mobileNavItems = [
  { id: 'dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
  { id: 'shifts', label: 'משמרות', icon: Calendar },
  { id: 'approval', label: 'אישור', icon: ClipboardCheck },
  { id: 'summaries', label: 'סיכומים', icon: FileText },
  { id: 'chatters', label: 'צ׳אטרים', icon: Users },
];

export default function MobileNav({ activePage, onNavigate }) {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 z-50">
      <div className="flex items-center justify-around py-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${
                isActive ? 'text-blue-400' : 'text-gray-500'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
