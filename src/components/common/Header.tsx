import React from 'react';
import { HeartHandshake, Sun, Moon, Contrast, User } from 'lucide-react';
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

  const setFontScale = (scaleStr: '100' | '125' | '150' | '175') => {
    onUpdateSettings({ fontScale: scaleStr });
  };

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    onUpdateSettings({ theme: nextTheme });
  };

  return (
    <header className="h-16 bg-surface border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between z-20 shrink-0 sticky top-0 backdrop-blur-md">
      {/* Brand Logo & Tagline */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 text-left focus:outline-none rounded-xl"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <HeartHandshake className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <span className="font-bold text-xl leading-none text-text-primary tracking-tight">Lovira</span>
            <span className="text-xs text-text-secondary ml-2 font-medium hidden sm:inline">Love goes Viral</span>
          </div>
        </button>
      </div>

      {/* Quick Accessibility & User Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Font Scale Toolbar */}
        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl">
          {(['100', '125', '150', '175'] as const).map((scale) => (
            <button
              key={scale}
              onClick={() => setFontScale(scale)}
              title={`Cỡ chữ ${scale}%`}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                settings.fontScale === scale
                  ? 'bg-surface text-text-primary shadow-xs font-extrabold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {scale}%
            </button>
          ))}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Đổi giao diện sáng/tối"
          title={settings.theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          className="w-10 h-10 rounded-xl bg-surface border border-slate-200 dark:border-slate-800 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors shrink-0"
        >
          {settings.theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <Moon className="w-5 h-5 shrink-0" />
          )}
        </button>

        {/* High Contrast Toggle Button */}
        <button
          onClick={toggleContrast}
          aria-label="Bật/Tắt chế độ tương phản cao"
          title="Bật/Tắt chế độ tương phản cao"
          className={`px-3 py-2 rounded-xl bg-surface border border-slate-200 dark:border-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 ${
            settings.highContrast
              ? 'bg-yellow-400 text-black border-yellow-500 font-extrabold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Contrast className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Tương phản cao</span>
        </button>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

        {/* Account Info */}
        <button
          onClick={() => onNavigate('/settings')}
          className="flex items-center gap-3 text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-full bg-primary-soft text-primary font-bold flex items-center justify-center text-sm shrink-0">
            <User className="w-4 h-4 shrink-0" />
          </div>
          <div className="text-left hidden lg:block">
            <p className="text-xs font-semibold text-text-primary truncate max-w-[120px]">
              {userProfile?.displayName || 'Khách'}
            </p>
            <p className="text-[11px] text-text-secondary truncate">
              {userProfile?.isAnonymous ? 'Tài khoản ẩn danh' : userProfile?.email || 'Người dùng'}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
};

