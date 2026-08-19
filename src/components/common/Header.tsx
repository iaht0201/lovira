import React from 'react';
import { HeartHandshake, Sun, Moon, Contrast, User, Type } from 'lucide-react';
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

  const cycleFontScale = () => {
    const scales: Array<'100' | '125' | '150' | '175'> = ['100', '125', '150', '175'];
    const currentIndex = scales.indexOf(settings.fontScale as any);
    const nextIndex = currentIndex === -1 ? 1 : (currentIndex + 1) % scales.length;
    setFontScale(scales[nextIndex]);
  };

  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    onUpdateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  return (
    <header className="h-14 sm:h-16 bg-surface/95 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 lg:px-8 flex items-center justify-between z-20 shrink-0 sticky top-0 backdrop-blur-md transition-colors">
      {/* Left branding on mobile / spacer on desktop */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 text-left focus:outline-hidden md:hidden group"
          aria-label="Trang chủ Lovira"
        >
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-text-primary tracking-tight">Lovira</span>
        </button>
      </div>

      {/* Quick Accessibility & User Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 min-w-0 shrink-0">
        {/* Font Scale: Mobile compact cycle button */}
        <button
          onClick={cycleFontScale}
          aria-label={`Đổi cỡ chữ, hiện tại là ${settings.fontScale}%`}
          title={`Cỡ chữ: ${settings.fontScale}% (Nhấn để chuyển nấc tiếp theo)`}
          className="sm:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-subtle border border-slate-200 dark:border-slate-800 text-xs font-bold text-text-primary hover:bg-surface hover:border-primary/40 active:scale-95 transition-all shrink-0"
        >
          <Type className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>{settings.fontScale}%</span>
        </button>

        {/* Font Scale: Tablet/Desktop segmented bar */}
        <div className="hidden sm:flex items-center gap-0.5 bg-surface-subtle p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          {(['100', '125', '150', '175'] as const).map((scale) => (
            <button
              key={scale}
              onClick={() => setFontScale(scale)}
              title={`Cỡ chữ ${scale}%`}
              aria-label={`Đặt cỡ chữ ${scale}%`}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                settings.fontScale === scale
                  ? 'bg-primary text-white shadow-xs font-extrabold'
                  : 'text-text-primary hover:bg-surface'
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
          title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface border border-slate-200 dark:border-slate-700 flex items-center justify-center text-text-primary hover:bg-surface-subtle active:scale-95 transition-all shrink-0"
        >
          {isDark ? (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-300 shrink-0" />
          )}
        </button>

        {/* High Contrast Toggle Button */}
        <button
          onClick={toggleContrast}
          aria-label="Bật/Tắt chế độ tương phản cao"
          title="Bật/Tắt chế độ tương phản cao"
          className={`h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 border-2 active:scale-95 ${
            settings.highContrast
              ? '!bg-amber-300 !text-slate-950 !border-amber-400 font-black shadow-xs'
              : 'bg-surface border-slate-200 dark:border-slate-700 text-text-primary hover:bg-surface-subtle'
          }`}
        >
          <Contrast className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">
            {settings.highContrast ? 'Tương phản cao' : 'Tương phản'}
          </span>
        </button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block shrink-0"></div>

        {/* Account Info */}
        <button
          onClick={() => onNavigate('/settings')}
          aria-label="Cài đặt tài khoản"
          className="flex items-center gap-2.5 text-left focus:outline-hidden p-0.5 rounded-xl hover:bg-surface-subtle transition-colors shrink-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 border border-primary/20">
            <User className="w-4 h-4 shrink-0" />
          </div>
          <div className="text-left hidden lg:block min-w-0">
            <p className="text-xs font-semibold text-text-primary truncate max-w-[110px]">
              {userProfile?.displayName || 'Khách'}
            </p>
            <p className="text-[11px] text-text-secondary truncate max-w-[110px]">
              {userProfile?.isAnonymous ? 'Ẩn danh' : userProfile?.email || 'Người dùng'}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
};

