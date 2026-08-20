import React from 'react';
import { useVoiceAccess } from './VoiceSessionManager';
import { Mic, MicOff, Volume2, AlertCircle, Sparkles } from 'lucide-react';
import { AccessibilitySettings } from '../../types';

export const VoiceStatusBar: React.FC<{ settings: AccessibilitySettings }> = ({ settings }) => {
  const { voiceState, lastAction, stopSpeaking } = useVoiceAccess();

  if (voiceState === 'disabled' && !settings.voiceAccessEnabled) {
    return null;
  }

  const getStatusBadge = () => {
    switch (voiceState) {
      case 'listening':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Đang lắng nghe câu lệnh...
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium text-xs">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            Đang xử lý ý định...
          </span>
        );
      case 'speaking':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-medium text-xs">
            <Volume2 className="w-3.5 h-3.5 animate-bounce" />
            Đang đọc phản hồi...
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-700 dark:text-red-300 font-medium text-xs">
            <AlertCircle className="w-3.5 h-3.5" />
            Lỗi kết nối giọng nói
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 text-text-secondary font-medium text-xs">
            <Mic className="w-3.5 h-3.5" />
            Sẵn sàng nhận lệnh giọng nói
          </span>
        );
    }
  };

  return (
    <div
      aria-live="polite"
      className="fixed top-2 right-4 z-40 flex items-center gap-2 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-border shadow-sm text-sm"
    >
      {getStatusBadge()}
      {voiceState === 'speaking' && (
        <button
          onClick={stopSpeaking}
          className="ml-1 text-xs text-text-secondary hover:text-text-primary px-2 py-0.5 rounded bg-surface-subtle hover:bg-surface border border-border"
          title="Dừng đọc"
        >
          Dừng
        </button>
      )}
    </div>
  );
};
