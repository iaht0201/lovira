import React from 'react';
import { useVoiceAccess } from './VoiceSessionManager';
import { Mic, MicOff, Volume2, Loader2, Sparkles, X } from 'lucide-react';
import { AccessibilitySettings } from '../../types';

interface StatusBarProps {
  settings: AccessibilitySettings;
}

export const VoiceStatusBar: React.FC<StatusBarProps> = ({ settings }) => {
  const { voiceState, stopSpeaking, activateSession } = useVoiceAccess();

  if (voiceState === 'disabled') return null;

  const isReduced = settings.reducedMotion;

  // Render status indicator pill
  const renderStatus = () => {
    switch (voiceState) {
      case 'armed':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm text-xs text-text-secondary">
            <Mic className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span>Nói <strong>“Chào Lovira”</strong> để bắt đầu</span>
          </div>
        );

      case 'listening':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full shadow-sm text-xs font-semibold">
            <span className={`w-2.5 h-2.5 rounded-full bg-primary ${isReduced ? '' : 'animate-ping'}`} />
            <span>Lovira đang nghe...</span>
          </div>
        );

      case 'processing':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-400 rounded-full shadow-sm text-xs font-semibold">
            <Loader2 className={`w-3.5 h-3.5 ${isReduced ? '' : 'animate-spin'}`} />
            <span>Đang hiểu yêu cầu...</span>
          </div>
        );

      case 'speaking':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 rounded-full shadow-sm text-xs font-semibold">
            <Volume2 className={`w-3.5 h-3.5 ${isReduced ? '' : 'animate-bounce'}`} />
            <span>Đang phát giọng nói</span>
            <button
              onClick={stopSpeaking}
              className="ml-1 p-0.5 rounded-full hover:bg-teal-500/20 text-teal-600 dark:text-teal-300"
              title="Dừng đọc"
              aria-label="Dừng phát giọng nói"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );

      case 'paused':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full shadow-sm text-xs font-semibold">
            <MicOff className="w-3.5 h-3.5" />
            <span>Giọng nói tạm ngưng (Mic bận)</span>
          </div>
        );

      case 'error':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-full shadow-sm text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span>Lỗi nhận diện. Thử lại sau.</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed bottom-18 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all select-none pointer-events-auto"
      id="lovira-voice-status-bar"
    >
      {renderStatus()}
    </div>
  );
};
