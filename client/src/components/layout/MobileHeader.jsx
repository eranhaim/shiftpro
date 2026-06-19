import { Menu, Send } from 'lucide-react';

export default function MobileHeader({ onMenuToggle }) {
  return (
    <header className="lg:hidden fixed top-0 inset-x-0 bg-gray-900 border-b border-gray-800 z-50 px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">ShiftPro</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
            <Send size={14} />
            <span>שלח הודעה</span>
          </button>
          <button
            onClick={onMenuToggle}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>
    </header>
  );
}
