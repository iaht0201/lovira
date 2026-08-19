import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Send,
  Loader2,
  Volume2,
  X,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { useAgent } from '../../agent/AgentController';
import { AccessibilitySettings } from '../../types';

interface AgentBarProps {
  settings: AccessibilitySettings;
  onNavigate: (route: string) => void;
}

export const AgentBar: React.FC<AgentBarProps> = ({ settings, onNavigate }) => {
  const {
    agentState,
    statusMessage,
    activeSession,
    isListening,
    startListening,
    stopListening,
    processInput,
    setIsLifeModalOpen,
  } = useAgent();

  const [inputVal, setInputVal] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      processInput(inputVal);
      setInputVal('');
      setIsExpanded(false);
    }
  };

  const getStatusIcon = () => {
    switch (agentState) {
      case 'listening':
        return <Mic className="w-5 h-5 text-red-500 animate-pulse shrink-0" />;
      case 'thinking':
      case 'executing':
        return <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />;
      case 'speaking':
        return <Volume2 className="w-5 h-5 text-emerald-500 animate-bounce shrink-0" />;
      case 'error':
        return <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />;
      default:
        return <Sparkles className="w-5 h-5 text-primary shrink-0" />;
    }
  };

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 pointer-events-none">
      <div
        className={`pointer-events-auto bg-surface/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-xl rounded-2xl p-3 transition-all duration-300 ${
          agentState === 'listening' ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Status and Active Session Badge */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
              {getStatusIcon()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Lovira Life
                </span>
                {activeSession && (
                  <button
                    onClick={() => onNavigate('/session')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-md hover:bg-primary/25 transition-colors truncate max-w-[150px] sm:max-w-[200px]"
                    title="Mở phiên làm việc hiện tại"
                  >
                    <span>{activeSession.title}</span>
                    <ArrowRight className="w-3 h-3 shrink-0" />
                  </button>
                )}
              </div>
              <p className="text-xs text-text-secondary truncate mt-0.5 font-medium">
                {statusMessage}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Life Scenarios Modal Button */}
            <button
              type="button"
              onClick={() => setIsLifeModalOpen(true)}
              aria-label="Chọn tình huống đời sống"
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
              title="Tình huống đời sống"
            >
              <Compass className="w-5 h-5 shrink-0" />
            </button>

            {/* Voice Input Toggle Button */}
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              aria-label={isListening ? 'Dừng lắng nghe' : 'Bật lắng nghe giọng nói'}
              className={`p-2.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-md'
                  : 'bg-primary text-white hover:bg-primary-hover shadow-xs'
              }`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 shrink-0" />
              ) : (
                <Mic className="w-4 h-4 shrink-0" />
              )}
              <span className="text-xs hidden sm:inline">
                {isListening ? 'Đang nghe' : 'Nói với Lovira'}
              </span>
            </button>

            {/* Expand text input toggle */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Đóng ô nhập văn bản' : 'Mở ô nhập văn bản'}
              className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors text-xs font-semibold"
            >
              {isExpanded ? <X className="w-4 h-4" /> : 'Nhập'}
            </button>
          </div>
        </div>

        {/* Expandable Text Input Form */}
        {isExpanded && (
          <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Bạn muốn Lovira hỗ trợ việc gì? (ví dụ: Tôi đang đi khám, đọc chữ trong ảnh...)"
              className="flex-1 px-3 py-2 rounded-xl bg-surface-subtle border border-slate-200 dark:border-slate-700 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-secondary/70"
              autoFocus
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || agentState === 'thinking'}
              className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover disabled:opacity-50 flex items-center gap-1 shrink-0"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span>Gửi</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
