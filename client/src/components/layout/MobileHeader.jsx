import { Menu } from 'lucide-react';

export default function MobileHeader({ onMenuToggle }) {
  return (
    <header className="lg:hidden fixed top-0 inset-x-0 bg-gray-900 border-b border-gray-800 z-50 px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">ShiftPro</h1>
        <button
          onClick={onMenuToggle}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <Menu size={22} />
        </button>
      </div>
    </header>
  );
}
