import React from 'react';
import {
  LayoutGrid,
  Eye,
  Mic,
  FileText,
  FolderOpen,
  History,
  Settings2,
  HeartHandshake,
  User,
} from 'lucide-react';
import { AccessibilitySettings, UserProfile } from '../../types';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  userProfile?: UserProfile | null;
  settings?: AccessibilitySettings;
  onUpdateSettings?: (newSettings: Partial<AccessibilitySettings>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  userProfile,
}) => {
  const toolItems = [
    { id: 'vision', label: 'Nhìn giúp tôi', icon: Eye, route: '/vision', colorClass: 'text-indigo-500' },
    { id: 'conversation', label: 'Nghe & ghi lại', icon: Mic, route: '/conversation', colorClass: 'text-teal' },
    { id: 'easy-read', label: 'Làm nội dung dễ hiểu', icon: FileText, route: '/easy-read', colorClass: 'text-coral' },
    { id: 'documents', label: 'Hiểu tài liệu', icon: FolderOpen, route: '/documents', colorClass: 'text-blue-500' },
  ];

  const personalItems = [
    { id: 'history', label: 'Lịch sử', icon: History, route: '/history' },
    { id: 'settings', label: 'Cài đặt trợ năng', icon: Settings2, route: '/settings' },
  ];

  const isHomeActive = currentRoute === '/' || currentRoute === '';

  return (
    <aside className="w-64 bg-surface border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col justify-between p-4 shrink-0 overflow-y-auto">
      <div className="space-y-6">
        {/* Logo Branding */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <HeartHandshake className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-none text-text-primary">Lovira</h1>
            <p className="text-xs text-text-secondary mt-1">AI lan tỏa sự thấu hiểu</p>
          </div>
        </div>

        {/* Navigation Group */}
        <nav className="space-y-1" aria-label="Menu chính">
          <button
            onClick={() => onNavigate('/')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors text-left ${
              isHomeActive
                ? 'bg-primary text-white font-semibold shadow-xs'
                : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
            }`}
          >
            <LayoutGrid className="w-5 h-5 shrink-0" />
            <span>Trang chủ</span>
          </button>

          <div className="pt-4 pb-1 px-3 text-xs font-bold text-text-secondary uppercase tracking-wider">
            Tính năng
          </div>

          {toolItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute.startsWith(item.route);

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.route)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-medium text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-soft text-primary font-bold'
                    : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : item.colorClass}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 pb-1 px-3 text-xs font-bold text-text-secondary uppercase tracking-wider">
            Lịch sử & Cài đặt
          </div>

          {personalItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute.startsWith(item.route);

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.route)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-medium text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-soft text-primary font-bold'
                    : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-full bg-surface-subtle flex items-center justify-center font-bold text-text-secondary shrink-0">
          <User className="w-5 h-5 shrink-0" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {userProfile?.displayName || 'Người dùng'}
          </p>
          <p className="text-xs text-text-secondary truncate">
            {userProfile?.isAnonymous ? 'Tài khoản ẩn danh' : userProfile?.email || 'Người dùng'}
          </p>
        </div>
      </div>
    </aside>
  );
};



