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
          setTranscript((prev) => (prev ? prev + ' ' + newText : newText));
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
        // Automatically restart if still meant to be listening and not paused
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
    <div className="space-y-8 pb-12">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">Lovira / Speech & Conversation</div>
          <h1 className="text-2xl font-light text-[#1A1A1A] dark:text-white flex items-center gap-2.5 mt-1">
            <span>Nghe & ghi lại (Conversation Assistant)</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-light">
            Chuyển lời nói trực tiếp thành văn bản hiển thị và nhận tóm tắt ý chính bằng AI.
          </p>
        </div>

        {/* Live Mic Status Indicator */}
        <div className="flex items-center gap-3">
          {isListening ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-100 text-[#1A1A1A] dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>{isPaused ? 'Đã tạm dừng' : 'Micro đang hoạt động'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 text-[10px] font-bold uppercase tracking-wider border border-neutral-200 dark:border-neutral-700">
              <MicOff className="w-3 h-3" />
              <span>Chưa bật micro</span>
            </div>
          )}
        </div>
      </div>

      {/* Unsupported Notice */}
      {!isSupported && (
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-[#1A1A1A] dark:text-white flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold uppercase tracking-wider">Trình duyệt này chưa hỗ trợ nhận diện giọng nói trực tiếp.</p>
            <p className="font-light">Bạn vẫn có thể nhập hoặc dán nội dung cuộc trò chuyện bên dưới để Lovira tóm tắt bằng AI.</p>
          </div>
        </div>
      )}

      {/* Control Buttons Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        {isSupported && (
          <>
            {!isListening ? (
              <button
                type="button"
                onClick={startListening}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A] font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Bắt đầu nghe</span>
              </button>
            ) : isPaused ? (
              <button
                type="button"
                onClick={resumeListening}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors shadow-md"
              >
                <Play className="w-4 h-4" />
                <span>Tiếp tục</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseListening}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 transition-colors shadow-md"
              >
                <Pause className="w-4 h-4" />
                <span>Tạm dừng</span>
              </button>
            )}

            {isListening && (
              <button
                type="button"
                onClick={stopListening}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                <Square className="w-4 h-4" />
                <span>Kết thúc</span>
              </button>
            )}
          </>
        )}

        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Xóa</span>
        </button>

        <div className="ml-auto">
          <button
            type="button"
            onClick={handleSummarize}
            disabled={loading || !getFullContent()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tóm tắt bằng AI</span>
          </button>
        </div>
      </div>

      {/* Main Transcript & Manual Input Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Transcript Box */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Văn bản cuộc trò chuyện
            </h2>
            {transcript && <ReadAloudButton text={transcript} speechRate={settings.speechRate} size="sm" />}
          </div>

          <div
            ref={transcriptContainerRef}
            className="min-h-[240px] max-h-[360px] overflow-y-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-base leading-relaxed text-slate-900 dark:text-slate-100 space-y-2 font-sans"
          >
            {transcript ? (
              <p className="whitespace-pre-wrap">{transcript}</p>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 italic text-sm">
                Nội dung trò chuyện nhận diện qua micro sẽ xuất hiện tại đây…
              </p>
            )}

            {interimText && (
              <p className="text-indigo-600 dark:text-indigo-400 font-semibold italic text-sm animate-pulse">
                {interimText}…
              </p>
            )}
          </div>

          {/* Mandatory Text Fallback Box */}
          <div className="space-y-2 pt-2">
            <label htmlFor="manual-transcript" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Nhập hoặc dán bổ sung nội dung cuộc trò chuyện:
            </label>
            <textarea
              id="manual-transcript"
              rows={4}
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Nhập hoặc dán bản ghi cuộc trò chuyện tại đây…"
              className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>
        </div>

        {/* Right: AI Summary Column */}
        <div className="space-y-6">
          {loading && (
            <LoadingSpinner
              message="Lovira đang tóm tắt cuộc trò chuyện…"
              subMessage="Đang tổng hợp các ý chính, quyết định và việc cần làm."
            />
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
              {error}
            </div>
          )}

          {summary && !loading && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Tóm tắt cuộc trò chuyện
                </span>

                <div className="flex items-center gap-2">
                  <ReadAloudButton
                    text={`${summary.summary}. ${summary.keyPoints.join('. ')}`}
                    speechRate={settings.speechRate}
                    size="sm"
                  />

                  <button
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {/* Main Summary */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Tóm tắt tổng quan
                </h3>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {summary.summary}
                </p>
              </div>

              {/* Key Points */}
              {summary.keyPoints && summary.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Ý chính trao đổi
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-800 dark:text-slate-200">
                    {summary.keyPoints.map((kp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {summary.actionItems && summary.actionItems.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Việc cần làm tiếp theo
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-800 dark:text-slate-200">
                    {summary.actionItems.map((act, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0"></span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Easy Read Navigation Action */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => onNavigate('/easy-read')}
                  className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                >
                  <FileText className="w-4 h-4" />
                  <span>Chuyển sang Easy Read</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
