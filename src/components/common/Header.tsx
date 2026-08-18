import React from 'react';
import { Sparkles, Sun, Moon, Contrast, UserCheck, Shield } from 'lucide-react';
import { AccessibilitySettings, UserProfile } from '../../types';

interface HeaderProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  userProfile?: UserProfile | null;
  onNavigate: (route: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  userProfile,
  onNavigate,
}) => {
  const toggleContrast = () => {
    onUpdateSettings({ highContrast: !settings.highContrast });
  };

  const cycleFontScale = () => {
    const scales: Array<'100' | '125' | '150' | '175'> = ['100', '125', '150', '175'];
    const currentIndex = scales.indexOf(settings.fontScale);
    const nextIndex = (currentIndex + 1) % scales.length;
    onUpdateSettings({ fontScale: scales[nextIndex] });
  };

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    onUpdateSettings({ theme: nextTheme });
  };

  return (
    <header className="sticky top-0 z-30 bg-[#F5F5F5]/90 dark:bg-[#0d0e12]/90 border-b border-neutral-200 dark:border-neutral-800 backdrop-blur-md px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile Brand Header */}
        <div className="flex items-center gap-3">
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2 font-bold text-[#1A1A1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-base tracking-tight font-light">Lovira</span>
            </button>
          </div>

          <span className="hidden sm:inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full bg-white dark:bg-neutral-900 text-[#1A1A1A] dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <Shield className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
            <span>AI TRỢ NĂNG VIỆT NAM</span>
          </span>
        </div>

        {/* Right: Accessibility Toolbar Shortcuts */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Font Size Switcher */}
          <button
            type="button"
            onClick={cycleFontScale}
            title={`Cỡ chữ hiện tại: ${settings.fontScale}%. Nhấn để thay đổi`}
            aria-label={`Thay đổi cỡ chữ (Hiện tại: ${settings.fontScale}%)`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#1A1A1A] dark:text-neutral-100 font-bold text-xs border border-neutral-200 dark:border-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
          >
            <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">Chữ</span>
            <span className="text-sm font-light">{settings.fontScale}%</span>
          </button>

          {/* High Contrast Toggle */}
          <button
            type="button"
            onClick={toggleContrast}
            title={settings.highContrast ? 'Tắt tương phản cao' : 'Bật tương phản cao'}
            aria-label={settings.highContrast ? 'Tắt chế độ tương phản cao' : 'Bật chế độ tương phản cao'}
            className={`p-2 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] ${
              settings.highContrast
                ? 'bg-[#1A1A1A] text-amber-300 border-amber-400 ring-1 ring-amber-400'
                : 'bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-[#1A1A1A] dark:text-neutral-200 border-neutral-200 dark:border-neutral-800'
            }`}
          >
            <Contrast className="w-4 h-4 sm:w-4 sm:h-4" aria-hidden="true" />
          </button>

          {/* Light/Dark Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={settings.theme === 'dark' ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối'}
            aria-label={settings.theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            className="p-2 rounded-full bg-white hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-[#1A1A1A] dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-[#1A1A1A]" aria-hidden="true" />
            )}
          </button>

          {/* Account Status Badge */}
          <button
            onClick={() => onNavigate('/settings')}
            className="hidden sm:flex items-center gap-2 pl-3 pr-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-[#1A1A1A] dark:text-neutral-200 text-[10px] font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
            title="Trạng thái tài khoản"
          >
            {userProfile?.isAnonymous ? (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="truncate max-w-[100px]">
              {userProfile?.displayName || (userProfile?.isAnonymous ? 'Khách Lovira' : 'Đã liên kết')}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

