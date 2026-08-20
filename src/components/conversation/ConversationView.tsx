import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  FileText,
  Clock,
  ListTodo,
  AlertCircle,
} from 'lucide-react';
import { AccessibilitySettings, UserProfile, ConversationResult } from '../../types';
import { speakText, stopSpeaking } from '../../lib/speech';
import { LoviraMicCoordinator } from '../voice-access/MicrophoneCoordinator';
import { saveActivityToFirestore, auth } from '../../lib/firebase';
import { useScreenActionContext } from '../voice-access/ScreenActionRegistry';

interface ConversationViewProps {
  userProfile: UserProfile | null;
  settings: AccessibilitySettings;
}

interface Utterance {
  id: string;
  speaker: 'user' | 'other';
  text: string;
  timestamp: string;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  userProfile,
  settings,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<Utterance[]>([]);
  const [interimText, setInterimText] = useState('');
  const [activeSpeaker, setActiveSpeaker] = useState<'other' | 'user'>('other');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [result, setResult] = useState<ConversationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const recognitionRef = useRef<any>(null);
  const { registerAction, setCurrentScreenInfo } = useScreenActionContext();

  useEffect(() => {
    setCurrentScreenInfo({
      screenId: 'conversation',
      title: 'Nghe & ghi lại',
      description: 'Lắng nghe trực tiếp, tạo phụ đề lớn và tóm lược ý chính',
    });
  }, [setCurrentScreenInfo]);

  useEffect(() => {
    // Check SpeechRecognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'vi-VN';

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const final = event.results[i][0].transcript.trim();
            if (final) {
              setTranscript((prev) => [
                ...prev,
                {
                  id: `utt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                  speaker: activeSpeaker,
                  text: final,
                  timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
            }
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimText(interim);
      };

      recognition.onerror = (e: any) => {
        console.warn('SpeechRecognition error:', e);
        if (e.error === 'not-allowed') {
          setErrorMsg('Không có quyền sử dụng micro. Vui lòng cho phép quyền micro trong trình duyệt.');
          stopListening();
        }
      };

      recognition.onend = () => {
        if (isListening) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognitionRef.current = recognition;
    } else {
      setErrorMsg('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói trực tiếp.');
    }

    return () => {
      stopListening();
    };
  }, [activeSpeaker, isListening]);

  const startListening = () => {
    setErrorMsg(null);
    LoviraMicCoordinator.requestAccess('conversation');
    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch (err) {
      console.warn('Recognition start error:', err);
    }
  };

  const stopListening = () => {
    LoviraMicCoordinator.releaseAccess('conversation');
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsListening(false);
    setInterimText('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleGenerateSummary = async () => {
    if (transcript.length === 0) return;
    setIsLoadingSummary(true);
    setErrorMsg(null);

    const fullTranscript = transcript
      .map((u) => `${u.speaker === 'user' ? 'Tôi' : 'Đối phương'}: ${u.text}`)
      .join('\n');

    try {
      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-lovira-client': 'web-app',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/gemini/conversation', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transcript: fullTranscript,
          goal: 'Tóm lược nội dung trao đổi, phát hiện lời dặn và việc cần làm.',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Lỗi khi tóm tắt cuộc trò chuyện.');
      }

      const resData = json.data as ConversationResult;
      setResult(resData);

      // Save to Firebase history
      if (userProfile?.uid) {
        saveActivityToFirestore(userProfile.uid, {
          type: 'conversation',
          title: 'Cuộc trò chuyện: ' + (resData.summary ? resData.summary.slice(0, 35) + '...' : 'Ghi chép lời nói'),
          preview: resData.summary,
          data: { transcript, result: resData },
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể tạo tóm tắt lúc này. Vui lòng thử lại.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleClearTranscript = () => {
    setTranscript([]);
    setInterimText('');
    setResult(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Register screen actions
  useEffect(() => {
    const unregStart = registerAction({
      id: 'conversation.start',
      label: 'Bắt đầu nghe',
      aliases: ['ghi âm', 'bật nghe'],
      execute: () => startListening(),
    });
    const unregStop = registerAction({
      id: 'conversation.stop',
      label: 'Dừng nghe',
      aliases: ['tắt nghe', 'ngừng ghi'],
      execute: () => stopListening(),
    });
    const unregSum = registerAction({
      id: 'conversation.summarize',
      label: 'Tóm tắt cuộc trò chuyện',
      aliases: ['tóm tắt', 'tóm lược'],
      execute: () => handleGenerateSummary(),
    });

    return () => {
      unregStart();
      unregStop();
      unregSum();
    };
  }, [registerAction, transcript]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Nghe & ghi lại</h1>
          <p className="text-sm text-text-secondary">
            Chuyển lời nói trực tiếp thành văn bản lớn, ghi chép ý chính và lời dặn.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleListening}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shadow-sm transition-all ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'bg-primary hover:bg-primary-hover text-white'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span>{isListening ? 'Đang nghe (Bấm để dừng)' : 'Bắt đầu nghe'}</span>
          </button>
        </div>
      </div>

      {/* Speaker Selector & Clear */}
      <div className="flex items-center justify-between gap-2 p-2 bg-surface rounded-2xl border border-border">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-text-secondary pl-2 hidden sm:inline">
            Người đang nói:
          </span>
          <button
            onClick={() => setActiveSpeaker('other')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSpeaker === 'other'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Đối phương (Bác sĩ, cán bộ, bạn bè)
          </button>
          <button
            onClick={() => setActiveSpeaker('user')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSpeaker === 'user'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Tôi (Người dùng)
          </button>
        </div>

        {transcript.length > 0 && (
          <button
            onClick={handleClearTranscript}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-text-secondary hover:text-red-500 hover:bg-surface-subtle transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa làm lại</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {/* Live Transcript Stream */}
      <div className="bg-surface rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-4 min-h-[300px] flex flex-col justify-between">
        <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1">
          {transcript.length === 0 && !interimText ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-text-secondary space-y-2">
              <Mic className="w-12 h-12 text-text-disabled mb-2" />
              <div className="font-bold text-base text-text-primary">Chưa có nội dung ghi âm</div>
              <p className="text-sm max-w-sm">
                Bấm <strong>&quot;Bắt đầu nghe&quot;</strong> và đặt thiết bị gần người nói để bắt đầu ghi phụ đề trực tiếp.
              </p>
            </div>
          ) : (
            <>
              {transcript.map((u) => (
                <div
                  key={u.id}
                  className={`p-4 rounded-2xl text-base leading-relaxed ${
                    u.speaker === 'user'
                      ? 'bg-primary-soft/60 border border-primary/20 text-text-primary ml-6'
                      : 'bg-surface-subtle border border-border text-text-primary mr-6'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-text-secondary mb-1">
                    <span>{u.speaker === 'user' ? 'Tôi' : 'Đối phương'}</span>
                    <span>{u.timestamp}</span>
                  </div>
                  <div className="text-base font-medium">{u.text}</div>
                </div>
              ))}

              {interimText && (
                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-900 dark:text-teal-200 animate-pulse text-base italic leading-relaxed">
                  <span className="text-xs font-semibold block not-italic mb-1 text-teal-700 dark:text-teal-300">
                    Đang nói…
                  </span>
                  {interimText}
                </div>
              )}
            </>
          )}
        </div>

        {/* Generate Summary CTA */}
        {transcript.length > 0 && (
          <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-text-secondary">
              Đã ghi được {transcript.length} lượt nói
            </span>
            <button
              onClick={handleGenerateSummary}
              disabled={isLoadingSummary}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoadingSummary ? 'Đang tóm tắt…' : 'Tóm tắt & Lấy việc cần làm'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary and Action Items Output */}
      {result && (
        <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-2 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Tóm tắt cuộc trò chuyện
              </span>
              <button
                onClick={() => handleCopy(result.summary)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-subtle border border-border hover:bg-surface text-text-primary"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã chép' : 'Chép'}</span>
              </button>
            </div>
            <p className="text-lg font-medium text-text-primary leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* Key Facts */}
          {result.keyFacts && result.keyFacts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Ý chính & Lời dặn quan trọng</span>
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.keyFacts.map((fact, i) => (
                  <li
                    key={i}
                    className="p-3.5 rounded-xl bg-surface-subtle border border-border text-sm text-text-primary leading-relaxed"
                  >
                    • {fact}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items / Tasks */}
          {result.actionItems && result.actionItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-primary" />
                <span>Việc cần thực hiện</span>
              </h3>
              <div className="space-y-2">
                {result.actionItems.map((item, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-surface-subtle border border-border flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded-md border-2 border-primary/60 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-sm text-text-primary font-medium">{item}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
