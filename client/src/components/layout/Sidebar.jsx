import {
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  FileText,
  Users,
  Database,
  Bell,
  MessageCircle,
  TriangleAlert,
  BarChart3,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { id: 'dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
  { id: 'shifts', label: 'לוח משמרות', icon: Calendar },
  { id: 'approval', label: 'אישור משמרות', icon: ClipboardCheck, hasBadge: true },
  { id: 'summaries', label: 'סיכומי יום', icon: FileText },
  { id: 'chatters', label: 'צ׳אטרים', icon: Users },
  { id: 'models', label: 'מיוצגות', icon: Database },
  { id: 'reminders', label: 'תזכורות', icon: Bell },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'errors', label: 'שגיאות', icon: TriangleAlert },
  { id: 'analytics', label: 'אנליטיקס', icon: BarChart3 },
];

export default function Sidebar({ activePage, onNavigate, pendingCount = 0 }) {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-gray-900 border-l border-gray-800 h-full order-first">
      <div className="shrink-0 p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">ShiftPro</h1>
        <p className="text-sm text-gray-400 mt-1">ניהול משמרות</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.hasBadge && pendingCount > 0 && (
                <span className="ms-auto shrink-0 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="shrink-0 p-4 border-t border-gray-800">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-sm text-gray-300 truncate min-w-0">
            {user?.name || user?.email || 'משתמש'}
          </span>
          <button
            onClick={logout}
            className="shrink-0 text-gray-400 hover:text-red-400 transition-colors"
            title="התנתק"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
