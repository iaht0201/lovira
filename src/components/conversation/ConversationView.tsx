import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Trash2,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Bookmark,
} from 'lucide-react';
import {
  isSpeechRecognitionSupported,
  createSpeechRecognitionInstance,
} from '../../lib/speech';
import { ReadAloudButton } from '../common/ReadAloudButton';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ConversationSummary, UserProfile, AccessibilitySettings } from '../../types';
import { summarizeConversation } from '../../services/api';
import { saveActivityHistory } from '../../lib/firebase';

interface ConversationViewProps {
  userProfile?: UserProfile | null;
  settings: AccessibilitySettings;
  onNavigate: (route: string) => void;
}

function mergeTranscripts(prev: string, newText: string): string {
  const current = prev.trim();
  const incoming = newText.trim();
  if (!incoming) return current;
  if (!current) return incoming;

  const currentLower = current.toLowerCase();
  const incomingLower = incoming.toLowerCase();

  // 1. Exact match or prev ends with incoming
  if (currentLower.endsWith(incomingLower)) {
    return current;
  }

  // 2. Incoming is a progressive expansion containing current at start ("Xin" -> "Xin chào" -> "Xin chào 123")
  if (incomingLower.startsWith(currentLower)) {
    return incoming;
  }

  // 3. Check word-level overlap
  const currentWords = current.split(/\s+/);
  const incomingWords = incoming.split(/\s+/);
  const maxCheck = Math.min(currentWords.length, incomingWords.length);

  let overlapCount = 0;
  for (let k = maxCheck; k > 0; k--) {
    const currentSuffix = currentWords.slice(currentWords.length - k).join(' ').toLowerCase();
    const incomingPrefix = incomingWords.slice(0, k).join(' ').toLowerCase();
    if (currentSuffix === incomingPrefix) {
      overlapCount = k;
      break;
    }
  }

  if (overlapCount > 0) {
    const nonOverlapping = incomingWords.slice(overlapCount).join(' ');
    return nonOverlapping ? `${current} ${nonOverlapping}` : current;
  }

  return `${current} ${incoming}`;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  userProfile,
  settings,
  onNavigate,
}) => {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [manualInput, setManualInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [copied, setCopied] = useState(false);

  const recognitionRef = useRef<any>(null);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcript, interimText]);

  const startListening = () => {
    if (!isSupported) return;

    setError(null);
    setIsListening(true);
    setIsPaused(false);

    const instance = createSpeechRecognitionInstance(
      (newText, isFinal) => {
        if (isFinal) {
          setTranscript((prev) => mergeTranscripts(prev, newText));
          setInterimText('');
        } else {
          setInterimText(newText);
        }
      },
      (err) => {
        console.warn('Speech error:', err);
        if (err === 'not-allowed') {
          setError('Lovira chưa được phép sử dụng micro. Bạn vẫn có thể nhập nội dung bằng bàn phím.');
          setIsListening(false);
        }
      },
      () => {
        if (isListening && !isPaused && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // ignore
          }
        }
      }
    );

    if (instance) {
      recognitionRef.current = instance;
      try {
        (instance as any).start();
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
  };

  const pauseListening = () => {
    setIsPaused(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
  };

  const resumeListening = () => {
    setIsPaused(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        startListening();
      }
    } else {
      startListening();
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setIsPaused(false);
    setInterimText('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
  };

  const handleClear = () => {
    stopListening();
    setTranscript('');
    setManualInput('');
    setInterimText('');
    setSummary(null);
    setError(null);
  };

  const getFullContent = () => {
    const combined = [transcript, manualInput].filter(Boolean).join('\n\n');
    return combined.trim();
  };

  const handleSummarize = async () => {
    const text = getFullContent();
    if (!text) {
      setError('Vui lòng ghi âm hoặc nhập nội dung cuộc trò chuyện trước khi tóm tắt.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await summarizeConversation(
        text,
        localStorage.getItem('lovira_custom_gemini_key') || undefined
      );
      setSummary(data);

      if (userProfile?.uid) {
        saveActivityHistory(
          userProfile.uid,
          'conversation',
          `Cuộc trò chuyện - ${text.slice(0, 30)}…`,
          data.summary,
          { transcript: text, summary: data }
        );
      }
    } catch (err: unknown) {
      console.error('Summarize error:', err);
      const msg = err instanceof Error ? err.message : 'Chưa thể tóm tắt cuộc trò chuyện này.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!summary) return;
    const text = `[Tóm tắt cuộc trò chuyện]\n${summary.summary}\n\n[Ý chính]\n${summary.keyPoints.join('\n')}\n\n[Quyết định]\n${summary.decisions.join('\n')}\n\n[Việc cần làm]\n${summary.actionItems.join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Nghe & ghi lại</h2>
        <p className="text-sm text-text-secondary mt-1">Theo dõi lời nói bằng văn bản trực tiếp và tạo bản tóm tắt có cấu trúc rõ ràng.</p>
      </div>

      {!isSupported && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold">Trình duyệt chưa hỗ trợ nhận diện giọng nói trực tiếp.</p>
            <p className="mt-0.5">Bạn vẫn có thể nhập hoặc dán nội dung cuộc trò chuyện bên dưới để Lovira tóm tắt bằng AI.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Live Transcription Panel (6 Cols) */}
        <div className="lg:col-span-6 bg-surface border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between min-h-[500px]">
          <div className="space-y-4">
            {/* Header Status */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isListening && !isPaused ? 'bg-teal animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                <span className="font-bold text-sm text-text-primary">
                  {isListening ? (isPaused ? 'Đã tạm dừng' : 'Đang lắng nghe trực tiếp') : 'Sẵn sàng ghi âm'}
                </span>
              </div>
              {isListening && !isPaused && (
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-teal rounded-full animate-bounce"></span>
                  <span className="w-1 h-4 bg-teal rounded-full animate-bounce [animation-delay:0.1s]"></span>
                  <span className="w-1 h-2 bg-teal rounded-full animate-bounce [animation-delay:0.2s]"></span>
                </div>
              )}
            </div>

            {/* Live Transcript Box */}
            <div
              ref={transcriptContainerRef}
              className="p-4 rounded-xl bg-surface-subtle min-h-[220px] max-h-[300px] overflow-y-auto space-y-2 text-sm text-text-primary leading-relaxed"
            >
              {transcript ? (
                <p className="whitespace-pre-wrap">{transcript}</p>
              ) : (
                <p className="text-text-secondary italic text-xs">
                  Văn bản ghi âm qua micro sẽ tự động xuất hiện tại đây...
                </p>
              )}
              {interimText && (
                <p className="text-teal font-semibold italic text-xs animate-pulse">
                  {interimText}...
                </p>
              )}
            </div>

            {/* Manual Input Area */}
            <div className="space-y-1.5 pt-2">
              <label htmlFor="manual-transcript" className="block text-xs font-semibold text-text-secondary">
                Hoặc dán bổ sung văn bản cuộc trò chuyện:
              </label>
              <textarea
                id="manual-transcript"
                rows={3}
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Nhập hoặc dán nội dung..."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface text-xs text-text-primary focus:border-primary"
              ></textarea>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {!isListening ? (
                <button
                  type="button"
                  onClick={startListening}
                  className="px-4 py-2.5 rounded-xl bg-teal text-white text-xs font-semibold hover:bg-teal-hover flex items-center gap-1.5"
                >
                  <Mic className="w-4 h-4 shrink-0" /> Bắt đầu nghe
                </button>
              ) : isPaused ? (
                <button
                  type="button"
                  onClick={resumeListening}
                  className="px-4 py-2.5 rounded-xl bg-teal text-white text-xs font-semibold hover:bg-teal-hover flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4 shrink-0" /> Tiếp tục
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pauseListening}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-text-primary hover:bg-surface-subtle flex items-center gap-1.5"
                >
                  <Pause className="w-4 h-4 shrink-0" /> Tạm dừng
                </button>
              )}

              {isListening && (
                <button
                  type="button"
                  onClick={stopListening}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 flex items-center gap-1.5"
                >
                  <Square className="w-4 h-4 shrink-0" /> Kết thúc
                </button>
              )}

              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-rose-600 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4 shrink-0" /> Xóa
              </button>
            </div>

            <button
              type="button"
              onClick={handleSummarize}
              disabled={loading || !getFullContent()}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 shrink-0" /> Tạo bản tóm tắt
            </button>
          </div>
        </div>

        {/* Right: Summary Panel (6 Cols) */}
        <div className="lg:col-span-6 bg-surface border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between min-h-[500px]">
          {loading ? (
            <LoadingSpinner message="Lovira đang tổng hợp tóm tắt cuộc trò chuyện..." />
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs space-y-2">
              <p className="font-bold">{error}</p>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-text-primary">Bản tóm tắt cuộc trò chuyện</h3>
                <div className="flex items-center gap-2">
                  <ReadAloudButton
                    text={`${summary.summary}. ${summary.keyPoints.join('. ')}`}
                    settings={settings}
                    size="sm"
                  />
                  <button
                    onClick={handleCopySummary}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-text-primary hover:bg-surface-subtle flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Ý chính</h4>
                  <p className="text-sm text-text-primary leading-relaxed bg-surface-subtle p-3.5 rounded-xl">
                    {summary.summary}
                  </p>
                </div>

                {summary.keyPoints && summary.keyPoints.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Các điểm thảo luận</h4>
                    <ul className="text-sm text-text-primary space-y-1.5 list-disc list-inside">
                      {summary.keyPoints.map((kp, i) => (
                        <li key={i}>{kp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.actionItems && summary.actionItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-coral uppercase tracking-wider mb-2">Việc cần làm</h4>
                    <ul className="text-sm text-coral space-y-1.5 list-disc list-inside font-medium">
                      {summary.actionItems.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-text-primary">Bản tóm tắt cuộc trò chuyện</h3>
              </div>
              <div className="p-8 text-center text-text-secondary text-sm">
                Bật micro ghi âm hoặc dán văn bản bên trái, sau đó nhấn "Tạo bản tóm tắt" để xem kết quả tại đây.
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => onNavigate('/easy-read')}
              className="px-4 py-2 rounded-xl bg-coral-soft text-coral text-xs font-bold hover:bg-coral/20 flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 shrink-0" /> Chuyển sang nội dung dễ hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
