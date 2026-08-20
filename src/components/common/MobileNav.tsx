import React from 'react';
import { Home, Eye, Mic, BookOpen, Menu } from 'lucide-react';

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
  const items = [
    { route: '/', label: 'Trang chủ', icon: Home },
    { route: '/vision', label: 'Nhìn', icon: Eye },
    { route: '/conversation', label: 'Nghe', icon: Mic },
    { route: '/easy-read', label: 'Dễ hiểu', icon: BookOpen },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around px-2 z-30"
      aria-label="Thanh điều hướng di động"
    >
      {items.map((item) => {
        const isActive =
          item.route === '/'
            ? currentRoute === '/'
            : currentRoute.startsWith(item.route);
        const Icon = item.icon;

        return (
          <button
            key={item.route}
            onClick={() => onNavigate(item.route)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-colors ${
              isActive ? 'text-primary font-semibold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight truncate">{item.label}</span>
          </button>
        );
      })}

      {/* More Button */}
      <button
        onClick={onOpenMoreMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-text-secondary hover:text-text-primary"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span className="text-[11px] leading-tight">Thêm</span>
      </button>
    </nav>
  );
};
