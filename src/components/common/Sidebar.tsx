import React from 'react';
import {
  Home,
  Eye,
  Mic,
  FileText,
  BookOpen,
  History,
  Settings,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../../types';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  userProfile?: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Trang chủ', icon: Home, route: '/' },
    { id: 'vision', label: 'Nhìn giúp tôi', icon: Eye, route: '/vision' },
    { id: 'conversation', label: 'Nghe & ghi lại', icon: Mic, route: '/conversation' },
    { id: 'easy-read', label: 'Làm nội dung dễ hiểu', icon: FileText, route: '/easy-read' },
    { id: 'documents', label: 'Hiểu tài liệu', icon: BookOpen, route: '/documents' },
    { id: 'history', label: 'Lịch sử', icon: History, route: '/history' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#1A1A1A] text-neutral-100 min-h-screen border-r border-neutral-800 shrink-0 sticky top-0 h-screen select-none font-sans">
      {/* Brand Logo Header - Clean Minimalism uppercase tracking */}
      <div className="p-6 border-b border-neutral-800/80 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 text-left group focus:outline-none focus:ring-2 focus:ring-white rounded-lg p-1"
        >
          <div className="w-8 h-8 rounded-full bg-white text-[#1A1A1A] flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
              Lovira / AI
            </div>
            <h1 className="text-lg font-light tracking-tight text-white flex items-center gap-1.5">
              Accessibility
            </h1>
          </div>
        </button>
      </div>

      {/* Navigation Category Label */}
      <div className="px-6 pt-5 pb-2 text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-500">
        Tính năng trợ năng
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto" aria-label="Điều hướng chính">
        {navItems.map((item) => {
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
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-white ${
                isActive
                  ? 'bg-white text-[#1A1A1A] font-bold shadow-sm'
                  : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1A1A1A]' : 'text-neutral-400'}`} aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Navigation (Settings) */}
      <div className="p-3 border-t border-neutral-800/80 space-y-1">
        <button
          onClick={() => onNavigate('/settings')}
          aria-current={currentRoute.startsWith('/settings') ? 'page' : undefined}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-white ${
            currentRoute.startsWith('/settings')
              ? 'bg-white text-[#1A1A1A] font-bold'
              : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 text-neutral-400 shrink-0" aria-hidden="true" />
          <span className="truncate">Cài đặt & Trợ năng</span>
        </button>
      </div>
    </aside>
  );
};

