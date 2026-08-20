import React, { useEffect, useState } from 'react';
import { Sun, Moon, Mic, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { AccessibilitySettings, UserProfile } from '../../types';
import { useVoiceAccess } from '../voice-access/VoiceSessionManager';

interface HeaderProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  userProfile: UserProfile | null;
  onNavigate: (route: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  userProfile,
  onNavigate,
}) => {
  const { voiceState, activateSession, deactivateSession } = useVoiceAccess();
  const [healthStatus, setHealthStatus] = useState<'checking' | 'ready' | 'offline'>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setHealthStatus('ready');
        } else {
          setHealthStatus('offline');
        }
      })
      .catch(() => setHealthStatus('offline'));
  }, []);

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    onUpdateSettings({ theme: nextTheme });
  };

  const toggleVoiceAccess = () => {
    if (voiceState === 'listening') {
      deactivateSession();
    } else {
      activateSession();
    }
  };

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-border bg-surface flex items-center justify-between flex-shrink-0 z-10">
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
            L
          </div>
          <span className="font-bold text-base text-text-primary">Lovira</span>
        </div>

        {/* System Health Status Pill (Truthful status) */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface-subtle border border-border"
          title={healthStatus === 'ready' ? 'Hệ thống AI Lovira đang sẵn sàng' : 'Đang kiểm tra máy chủ AI'}
        >
          {healthStatus === 'ready' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-text-secondary">AI Sẵn sàng</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-text-secondary">Đang kết nối AI...</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Voice Access Mic Toggle */}
        <button
          onClick={toggleVoiceAccess}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
            voiceState === 'listening'
              ? 'bg-red-500 text-white border-red-600 shadow-sm animate-pulse'
              : 'bg-surface-subtle text-text-primary border-border hover:bg-surface'
          }`}
          title="Bật/Tắt điều khiển bằng giọng nói"
          aria-label="Điều khiển bằng giọng nói"
        >
          <Mic className="w-4 h-4" />
          <span className="hidden sm:inline">
            {voiceState === 'listening' ? 'Đang nghe...' : 'Nói với Lovira'}
          </span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-text-secondary hover:text-text-primary bg-surface-subtle border border-border hover:bg-surface transition-colors"
          title="Chuyển đổi sáng / tối"
          aria-label="Đổi giao diện sáng tối"
        >
          {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Identity / Settings Shortcut */}
        <button
          onClick={() => onNavigate('/settings')}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-subtle border border-border"
          title="Tài khoản & Cài đặt"
        >
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
            {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'K'}
          </div>
          <span className="hidden md:inline max-w-[100px] truncate">
            {userProfile?.displayName || 'Khách Lovira'}
          </span>
        </button>
      </div>
    </header>
  );
};
