import React from 'react';
import { Home, Eye, Mic, FileText, Menu } from 'lucide-react';

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
    { id: 'vision', label: 'Vision', icon: Eye, route: '/vision' },
    { id: 'conversation', label: 'Nghe', icon: Mic, route: '/conversation' },
    { id: 'easy-read', label: 'Easy Read', icon: FileText, route: '/easy-read' },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 text-[#1A1A1A] dark:text-neutral-200 px-3 py-1.5 shadow-xl rounded-full max-w-md mx-auto"
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
              className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] ${
                isActive
                  ? 'text-[#1A1A1A] dark:text-white font-bold'
                  : 'text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'scale-110 text-[#1A1A1A] dark:text-white' : ''}`} aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-wider leading-none truncate max-w-full">{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={onOpenMoreMenu}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 px-1 rounded-full transition-colors text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] ${
            currentRoute.startsWith('/documents') || currentRoute.startsWith('/history') || currentRoute.startsWith('/settings')
              ? 'text-[#1A1A1A] dark:text-white font-bold'
              : ''
          }`}
        >
          <Menu className="w-4 h-4 mb-0.5" aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-wider leading-none truncate">Thêm</span>
        </button>
      </div>
    </nav>
  );
};

