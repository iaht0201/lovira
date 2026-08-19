import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Loader2, X } from 'lucide-react';
import { LoviraMicCoordinator } from '../voice-access/MicrophoneCoordinator';
import { createSpeechRecognitionInstance } from '../../lib/speech';
import { speakText, stopSpeaking } from '../../lib/speech';

export interface VoiceInputButtonProps {
  /** Callback when transcript text is produced */
  onTranscript: (newText: string, mode: 'append' | 'replace') => void;
  /** Current text in the input (used for appending spaces properly) */
  currentValue?: string;
  /** Custom prompt spoken aloud in "Yêu cầu tự nhập" mode */
  promptMessage?: string;
  /** Custom label for button / accessibility */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the secondary "Yêu cầu tự nhập" (voice guided) button */
  showGuidedPrompt?: boolean;
  /** Additional custom class names */
  className?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  currentValue = '',
  promptMessage = 'Xin mời bạn nói nội dung cần nhập, tôi đang lắng nghe...',
  label = 'Nhập bằng giọng nói',
  size = 'md',
  showGuidedPrompt = true,
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const currentValueRef = useRef(currentValue);
  const silenceTimerRef = useRef<any>(null);
  const interimBufferRef = useRef<string>('');
  currentValueRef.current = currentValue;

  const clearSilenceTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const stopDictation = useCallback(() => {
    clearSilenceTimers();
    setIsListening(false);
    setIsPrompting(false);

    // If there's uncommitted interim text when stopping, append it cleanly
    if (interimBufferRef.current.trim()) {
      const trimmed = interimBufferRef.current.trim();
      const prev = currentValueRef.current;
      const separator = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
      const combined = prev + separator + trimmed;
      onTranscript(combined, 'replace');
      interimBufferRef.current = '';
    }

    setInterimText('');
    LoviraMicCoordinator.releaseMic('AGENT_COMMAND');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, [clearSilenceTimers, onTranscript]);

  useEffect(() => {
    return () => {
      stopDictation();
    };
  }, [stopDictation]);

  const startDictation = useCallback(() => {
    setErrorMessage(null);
    stopSpeaking();
    clearSilenceTimers();
    interimBufferRef.current = '';

    const micGranted = LoviraMicCoordinator.requestMic('AGENT_COMMAND');
    if (!micGranted) {
      setErrorMessage('Micro đang bận bởi tính năng khác. Vui lòng thử lại sau.');
      return;
    }

    setIsListening(true);
    setInterimText('');

    // Safety timeout: If user doesn't say anything for 6 seconds after opening mic, auto-stop
    silenceTimerRef.current = setTimeout(() => {
      stopDictation();
    }, 6000);

    const instance = createSpeechRecognitionInstance(
      (transcriptText, isFinal) => {
        if (!transcriptText) return;

        clearSilenceTimers();

        if (isFinal) {
          const trimmed = transcriptText.trim();
          if (trimmed) {
            const prev = currentValueRef.current;
            const separator = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
            const combined = prev + separator + trimmed;
            onTranscript(combined, 'replace');
            interimBufferRef.current = '';
          }
          setInterimText('');

          // Auto-stop gracefully 1.0s after receiving final sentence
          silenceTimerRef.current = setTimeout(() => {
            stopDictation();
          }, 1000);
        } else {
          interimBufferRef.current = transcriptText;
          setInterimText(transcriptText);

          // If user pauses for 1.8s while in interim, automatically commit and finish
          silenceTimerRef.current = setTimeout(() => {
            stopDictation();
          }, 1800);
        }
      },
      (error) => {
        console.warn('[VoiceInputButton] Speech error:', error);
        stopDictation();
        if (error === 'not-allowed') {
          setErrorMessage('Vui lòng cấp quyền micro để sử dụng tính năng nhập giọng nói.');
        } else if (error !== 'aborted') {
          setErrorMessage('Chưa nhận diện được giọng nói. Bạn hãy thử lại nhé.');
        }
      },
      () => {
        // onEnd callback - finish gracefully
        setIsListening(false);
        LoviraMicCoordinator.releaseMic('AGENT_COMMAND');
      }
    ) as any;

    if (instance) {
      recognitionRef.current = instance;
      try {
        instance.start();
      } catch (err) {
        console.error('[VoiceInputButton] Failed to start recognition:', err);
        stopDictation();
        setErrorMessage('Không thể khởi động micro lúc này.');
      }
    } else {
      stopDictation();
      setErrorMessage('Trình duyệt chưa hỗ trợ nhận diện giọng nói tiếng Việt.');
    }
  }, [onTranscript, stopDictation]);

  const handleToggleListening = () => {
    if (isListening || isPrompting) {
      stopDictation();
      stopSpeaking();
    } else {
      startDictation();
    }
  };

  const handleGuidedPrompt = () => {
    if (isListening || isPrompting) {
      stopDictation();
      stopSpeaking();
      return;
    }

    setIsPrompting(true);
    setErrorMessage(null);

    // Speak the guide prompt, then automatically engage microphone
    speakText(promptMessage, {
      rate: 1.0,
      onEnd: () => {
        setIsPrompting(false);
        startDictation();
      },
      onError: () => {
        setIsPrompting(false);
        startDictation();
      },
    });
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'px-3 py-2 text-sm',
  }[size];

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Primary Voice Dictation Button */}
      <button
        type="button"
        onClick={handleToggleListening}
        aria-label={isListening ? 'Dừng lắng nghe nhập liệu' : label}
        title={isListening ? 'Bấm để dừng ghi âm' : `${label} (Lắng nghe trực tiếp)`}
        className={`relative rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${sizeClasses} ${
          isListening
            ? 'bg-rose-500 text-white shadow-md animate-pulse ring-2 ring-rose-300 dark:ring-rose-900'
            : isPrompting
            ? 'bg-amber-500 text-white shadow-md animate-bounce'
            : 'bg-surface border border-slate-200 dark:border-slate-800 text-text-secondary hover:text-primary hover:border-primary/40 hover:bg-surface-subtle'
        }`}
      >
        {isListening ? (
          <>
            <Mic className="w-4 h-4 text-white animate-pulse shrink-0" />
            {size !== 'sm' && <span className="text-xs font-bold">Đang nghe...</span>}
          </>
        ) : isPrompting ? (
          <>
            <Volume2 className="w-4 h-4 text-white animate-spin shrink-0" />
            {size !== 'sm' && <span className="text-xs font-bold">Đang hướng dẫn...</span>}
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 shrink-0 text-primary" />
            {size === 'lg' && <span>Nói để nhập</span>}
          </>
        )}
      </button>

      {/* Guided Voice Prompt ("Yêu cầu tự nhập") */}
      {showGuidedPrompt && !isListening && (
        <button
          type="button"
          onClick={handleGuidedPrompt}
          disabled={isPrompting}
          aria-label="Yêu cầu tự nhập bằng giọng nói (Lovira sẽ hướng dẫn và tự động lắng nghe)"
          title="Yêu cầu tự nhập: Lovira sẽ đọc lời nhắc rồi tự động bật micro cho bạn nói"
          className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-surface text-text-secondary hover:text-primary hover:border-primary/40 hover:bg-surface-subtle font-semibold transition-colors flex items-center gap-1 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
            size === 'sm' ? 'p-1.5 text-[11px]' : 'px-2.5 py-1.5 text-xs'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="hidden sm:inline">Tự nhập</span>
        </button>
      )}

      {/* Live Interim Floating / Banner Indicator */}
      {isListening && interimText && (
        <div
          role="status"
          aria-live="polite"
          className="text-xs text-primary font-medium italic max-w-xs truncate animate-pulse bg-primary/10 px-2 py-1 rounded-md"
        >
          &ldquo;{interimText}&rdquo;
        </div>
      )}

      {/* Error Tooltip / Notice */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-1 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 px-2 py-1 rounded-lg"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-0.5 hover:text-rose-800"
            aria-label="Đóng thông báo"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
