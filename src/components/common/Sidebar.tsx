import React from 'react';
import {
  Home,
  Eye,
  Mic,
  BookOpen,
  FileText,
  Clock,
  Settings,
  Sparkles,
  Layers,
  HandMetal,
  Contrast,
  Type,
} from 'lucide-react';
import { AccessibilitySettings, UserProfile } from '../../types';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  userProfile: UserProfile | null;
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  userProfile,
  settings,
  onUpdateSettings,
}) => {
  const navItems = [
    {
      route: '/',
      label: 'Trang chủ',
      icon: Home,
      color: 'text-primary',
    },
    {
      route: '/session',
      label: 'Lovira Life',
      badge: 'Trợ lý',
      icon: Sparkles,
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      route: '/vision',
      label: 'Nhìn giúp tôi',
      icon: Eye,
      color: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      route: '/conversation',
      label: 'Nghe & ghi lại',
      icon: Mic,
      color: 'text-teal-600 dark:text-teal-400',
    },
    {
      route: '/easy-read',
      label: 'Làm nội dung dễ hiểu',
      icon: BookOpen,
      color: 'text-rose-600 dark:text-rose-400',
    },
    {
      route: '/documents',
      label: 'Hiểu tài liệu',
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      route: '/history',
      label: 'Lịch sử',
      icon: Clock,
      color: 'text-slate-600 dark:text-slate-400',
    },
    {
      route: '/vsl-playground',
      label: 'Ký hiệu VSL',
      icon: HandMetal,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      route: '/settings',
      label: 'Cài đặt & Trợ năng',
      icon: Settings,
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <aside
      className="hidden md:flex flex-col w-64 lg:w-72 h-full bg-surface border-r border-border flex-shrink-0 select-none z-20"
      aria-label="Thanh điều hướng chính"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-700 flex items-center justify-center text-white shadow-sm font-bold text-lg">
            L
          </div>
          <div>
            <div className="font-bold text-lg leading-tight text-text-primary tracking-tight">Lovira</div>
            <div className="text-xs text-text-secondary">AI lan tỏa sự thấu hiểu</div>
          </div>
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Menu chức năng">
        {navItems.map((item) => {
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
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-left transition-all ${
                isActive
                  ? 'bg-primary-soft text-primary font-semibold shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Accessibility Controls Footer */}
      <div className="p-3 border-t border-border bg-surface-subtle/50 space-y-2">
        <div className="text-xs font-semibold text-text-secondary px-2">Trợ năng nhanh</div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium border transition-colors ${
              settings.highContrast
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-text-secondary border-border hover:bg-surface-subtle'
            }`}
            title="Đổi tương phản cao"
          >
            <Contrast className="w-3.5 h-3.5" />
            <span>Tương phản</span>
          </button>
          <button
            onClick={() => onUpdateSettings({ vslAccessibilityEnabled: !settings.vslAccessibilityEnabled })}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium border transition-colors ${
              settings.vslAccessibilityEnabled
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-surface text-text-secondary border-border hover:bg-surface-subtle'
            }`}
            title="Bật/Tắt ngôn ngữ ký hiệu VSL"
          >
            <HandMetal className="w-3.5 h-3.5" />
            <span>Ký hiệu VSL</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
