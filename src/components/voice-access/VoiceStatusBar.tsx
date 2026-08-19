import React from 'react';
import { useVoiceAccess } from './VoiceSessionManager';
import { Mic, MicOff, Volume2, Loader2, Sparkles, X } from 'lucide-react';
import { AccessibilitySettings } from '../../types';

interface StatusBarProps {
  settings: AccessibilitySettings;
}

export const VoiceStatusBar: React.FC<StatusBarProps> = ({ settings }) => {
  const { voiceState, stopSpeaking, activateSession, deactivateSession } = useVoiceAccess();

  if (voiceState === 'disabled') return null;

  const isReduced = settings.reducedMotion;

  // Render status indicator pill
  const renderStatus = () => {
    switch (voiceState) {
      case 'armed':
        return (
          <button
            onClick={() => activateSession()}
            className="flex items-center gap-2 px-3.5 py-2 bg-card hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-primary/40 hover:border-primary text-text-primary rounded-full shadow-md text-xs font-semibold cursor-pointer transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Nhấp đúp chuột hoặc bấm vào đây để ra lệnh"
            aria-label="Kích hoạt điều khiển bằng giọng nói"
          >
            <Mic className="w-4 h-4 text-primary" />
            <span>Nhấp đúp hoặc bấm để ra lệnh</span>
          </button>
        );

      case 'listening':
        return (
          <button
            onClick={() => deactivateSession()}
            className="flex items-center gap-2 px-3.5 py-2 bg-primary text-white border-2 border-primary rounded-full shadow-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 animate-pulse"
            title="Đang lắng nghe câu lệnh. Bấm vào đây để hủy."
            aria-label="Đang nghe câu lệnh. Bấm để dừng."
          >
            <span className={`w-2.5 h-2.5 rounded-full bg-white ${isReduced ? '' : 'animate-ping'}`} />
            <span>Đang nghe bạn nói... (Bấm để dừng)</span>
          </button>
        );

      case 'processing':
        return (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300 rounded-full shadow-md text-xs font-semibold">
            <Loader2 className={`w-4 h-4 ${isReduced ? '' : 'animate-spin'}`} />
            <span>Đang xử lý câu lệnh...</span>
          </div>
        );

      case 'speaking':
        return (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 rounded-full shadow-md text-xs font-semibold">
            <Volume2 className={`w-4 h-4 ${isReduced ? '' : 'animate-bounce'}`} />
            <span>Đang phản hồi</span>
            <button
              onClick={stopSpeaking}
              className="ml-1 p-0.5 rounded-full hover:bg-teal-500/20 text-teal-600 dark:text-teal-200"
              title="Dừng đọc"
              aria-label="Dừng phát giọng nói"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );

      case 'paused':
        return (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-full shadow-sm text-xs font-semibold">
            <MicOff className="w-4 h-4" />
            <span>Giọng nói tạm ngưng (Micro đang bận)</span>
          </div>
        );

      case 'error':
        return (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-full shadow-sm text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span>Chưa nhận được câu lệnh.</span>
            <button
              onClick={() => activateSession()}
              className="underline font-bold ml-1 text-rose-800 dark:text-rose-200"
            >
              Thử lại
            </button>
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
