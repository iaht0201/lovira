import React, { useState, useEffect, useRef } from 'react';
import { VSLAvatarStick } from './VSLAvatarStick';
import { vslAccessibilityService, VSLEventPayload } from '../../services/vslAccessibilityService';
import { AccessibilitySettings } from '../../types';
import {
  HandMetal,
  Minimize2,
  Maximize2,
  X,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface VSLAccessibilityPanelProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  onNavigate?: (path: string) => void;
}

export const VSLAccessibilityPanel: React.FC<VSLAccessibilityPanelProps> = ({
  settings,
  onUpdateSettings,
  onNavigate,
}) => {
  // Only render if VSL accessibility is enabled in settings
  const isEnabled = Boolean(settings.vslAccessibilityEnabled);

  const [currentText, setCurrentText] = useState<string>('Xin chào! Tôi là Lovira.');
  const [lastDispatchedText, setLastDispatchedText] = useState<string>('Xin chào! Tôi là Lovira.');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [replayKey, setReplayKey] = useState<number>(0);

  // Subscribe to VSL text events from Voice Action / TTS
  useEffect(() => {
    const unsubscribe = vslAccessibilityService.subscribe((payload: VSLEventPayload) => {
      if (payload.text) {
        setLastDispatchedText(payload.text);
        setCurrentText(payload.text);
        setReplayKey((k) => k + 1);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isEnabled) {
    return null;
  }

  const handleReplay = () => {
    setReplayKey((k) => k + 1);
  };

  const handleClose = () => {
    onUpdateSettings({ vslAccessibilityEnabled: false });
  };

  const handlePlaybackStateChange = (state: { isPlaying: boolean; isTranslating: boolean }) => {
    setIsPlaying(state.isPlaying);
    setIsTranslating(state.isTranslating);
    vslAccessibilityService.setSigningActive(state.isPlaying);
  };

  return (
    <aside
      id="vsl-accessibility-floating-panel"
      aria-label="Khung hiển thị Ngôn ngữ Ký hiệu Việt Nam (VSL)"
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none select-none"
    >
      {/* Minimized Bubble State */}
      {isMinimized ? (
        <div
          id="vsl-panel-minimized-bubble"
          className="pointer-events-auto flex items-center gap-2.5 bg-slate-900/95 text-white border border-sky-500/40 backdrop-blur-xl px-3.5 py-2.5 rounded-full shadow-2xl transition-all duration-300 hover:border-sky-400 hover:shadow-sky-500/20"
        >
          <div className="relative flex items-center justify-center">
            <HandMetal size={18} className="text-sky-400" />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <span className="text-xs font-semibold text-slate-200 pr-1">Ngôn ngữ ký hiệu VSL</span>

          <button
            type="button"
            id="vsl-expand-button"
            onClick={() => setIsMinimized(false)}
            className="p-1 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors"
            title="Mở rộng khung ký hiệu"
            aria-label="Mở rộng khung ký hiệu"
          >
            <Maximize2 size={14} />
          </button>

          <button
            type="button"
            id="vsl-close-minimized-button"
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-rose-300 bg-slate-800/60 hover:bg-rose-950/60 rounded-full transition-colors"
            title="Tắt trợ năng ký hiệu"
            aria-label="Tắt trợ năng ký hiệu"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        /* Full Floating Panel (Fixed position, non-draggable as specified) */
        <div
          id="vsl-panel-card"
          className="pointer-events-auto w-[290px] sm:w-[320px] bg-slate-950/95 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col transition-all duration-300 border-t-2 border-t-sky-500"
        >
          {/* Header Bar */}
          <div
            id="vsl-panel-header"
            className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800/80"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <HandMetal size={16} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-wide">Ký hiệu VSL</span>
                  {/* Status Indicator */}
                  {isTranslating ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                      Đang dịch
                    </span>
                  ) : isPlaying ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Đang ký hiệu
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/15 text-sky-300 border border-sky-500/20">
                      Sẵn sàng
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Panel Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                id="vsl-replay-action-btn"
                onClick={handleReplay}
                className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded-lg transition-colors"
                title="Phát lại ký hiệu"
                aria-label="Phát lại ký hiệu"
              >
                <RefreshCw size={14} className={isPlaying ? 'animate-spin' : ''} />
              </button>

              <button
                type="button"
                id="vsl-minimize-action-btn"
                onClick={() => setIsMinimized(true)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title="Thu nhỏ khung"
                aria-label="Thu nhỏ khung"
              >
                <Minimize2 size={14} />
              </button>

              <button
                type="button"
                id="vsl-close-action-btn"
                onClick={handleClose}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                title="Đóng trợ năng ký hiệu"
                aria-label="Đóng trợ năng ký hiệu"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Core Avatar Stick Renderer Container (Fixed Aspect Ratio) */}
          <div
            id="vsl-avatar-wrapper"
            className="relative w-full aspect-[4/3.7] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center overflow-hidden"
          >
            <VSLAvatarStick
              key={`${currentText}_${replayKey}`}
              text={currentText}
              width="100%"
              height="100%"
              showReplayOverlay={false}
              onPlaybackStateChange={handlePlaybackStateChange}
            />

            {/* Subtle Neon Backdrop Accent */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
          </div>

          {/* Bottom Live Feedback & Text Context Bar */}
          <div
            id="vsl-panel-footer"
            className="p-2.5 bg-slate-900/95 border-t border-slate-800/80 flex flex-col gap-2"
          >
            {/* Real-time speech sentence being signed */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-slate-400 truncate">
                  <span className="text-sky-400 font-semibold">Nội dung: </span>
                  {currentText || 'Đang chờ câu thoại từ Voice Action...'}
                </p>
              </div>

              <button
                type="button"
                id="vsl-toggle-transcript-btn"
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors flex-shrink-0"
                title={showTranscript ? 'Thu gọn câu đầy đủ' : 'Xem câu đầy đủ'}
                aria-label={showTranscript ? 'Thu gọn câu đầy đủ' : 'Xem câu đầy đủ'}
              >
                {showTranscript ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* Expandable full sentence view */}
            {showTranscript && (
              <div
                id="vsl-full-transcript-box"
                className="px-2.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed max-h-20 overflow-y-auto"
              >
                {currentText}
              </div>
            )}

            {/* Footer Quick Links */}
            {onNavigate && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/50 text-[11px]">
                <button
                  type="button"
                  id="vsl-open-playground-link"
                  onClick={() => onNavigate('/vsl-playground')}
                  className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors font-medium"
                >
                  <Sparkles size={12} />
                  <span>Mở phòng thử nghiệm VSL</span>
                  <ExternalLink size={10} className="ml-0.5" />
                </button>

                <span className="text-[10px] text-slate-500">5 ngón & khớp xương</span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
