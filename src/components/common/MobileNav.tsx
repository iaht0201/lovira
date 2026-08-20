import React from 'react';
import { Home, Eye, Mic, FileText, Menu, Gamepad2 } from 'lucide-react';

interface MobileNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenMoreMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentRoute,
  onNavigate,
  onOpenMoreMenu,
}) => {
  const primaryItems = [
    { id: 'dashboard', label: 'Trang chủ', icon: Home, route: '/' },
    { id: 'vision', label: 'Nhìn', icon: Eye, route: '/vision' },
    { id: 'conversation', label: 'Nghe', icon: Mic, route: '/conversation' },
    { id: 'vsl-playground', label: 'Ký hiệu', icon: Gamepad2, route: '/vsl-playground' },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-40 bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-md border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 px-3 py-2 shadow-xl rounded-full max-w-md mx-auto"
      aria-label="Điều hướng di động"
    >
      <div className="grid grid-cols-5 items-center justify-between">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.route === '/'
              ? currentRoute === '/' || currentRoute === ''
              : currentRoute.startsWith(item.route);

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.route)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 shrink-0 ${isActive ? 'scale-110 text-indigo-600 dark:text-indigo-400' : ''}`} aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-wider leading-none truncate max-w-full">{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={onOpenMoreMenu}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-1 rounded-full transition-colors text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            currentRoute.startsWith('/documents') || currentRoute.startsWith('/history') || currentRoute.startsWith('/settings') || currentRoute.startsWith('/easy-read')
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : ''
          }`}
        >
          <Menu className="w-4 h-4 mb-0.5 shrink-0" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-wider leading-none truncate">Thêm</span>
        </button>
      </div>
    </nav>
  );
};

