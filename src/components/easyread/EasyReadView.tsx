import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  ListOrdered,
  HelpCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { AccessibilitySettings, UserProfile, EasyReadResult } from '../../types';
import { speakText, stopSpeaking } from '../../lib/speech';
import { vslAccessibilityService } from '../../services/vslAccessibilityService';
import { saveActivityToFirestore, auth } from '../../lib/firebase';
import { useScreenActionContext } from '../voice-access/ScreenActionRegistry';

interface EasyReadViewProps {
  userProfile: UserProfile | null;
  settings: AccessibilitySettings;
}

export const EasyReadView: React.FC<EasyReadViewProps> = ({
  userProfile,
  settings,
}) => {
  const [inputText, setInputText] = useState('');
  const [level, setLevel] = useState<'ultra-simple' | 'standard' | 'steps'>('standard');
  const [includeGlossary, setIncludeGlossary] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EasyReadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const { registerAction, setCurrentScreenInfo } = useScreenActionContext();

  useEffect(() => {
    setCurrentScreenInfo({
      screenId: 'easy-read',
      title: 'Làm nội dung dễ hiểu',
      description: 'Chuyển văn bản phức tạp thành ngôn ngữ dễ hiểu, câu ngắn và giải thích từ khó',
    });
  }, [setCurrentScreenInfo]);

  const handleSimplify = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-lovira-client': 'web-app',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/gemini/easy-read', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: inputText,
          level,
          includeGlossary,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Lỗi khi đơn giản hóa nội dung.');
      }

      const resData = json.data as EasyReadResult;
      setResult(resData);

      // Auto-read response if enabled
      if (settings.autoReadResponses && resData.simplified) {
        handleReadText(resData.simplified);
      }

      // Present to VSL
      if (settings.vslAccessibilityEnabled && resData.summary) {
        vslAccessibilityService.presentSignResponse(resData.summary, 'life-agent');
      }

      // Save to Firebase
      if (userProfile?.uid) {
        saveActivityToFirestore(userProfile.uid, {
          type: 'easy-read',
          title: 'Dễ hiểu: ' + (inputText.slice(0, 30) + '...'),
          preview: resData.summary || resData.simplifiedText?.slice(0, 100) || resData.simplified?.slice(0, 100) || '',
          data: resData,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể làm dễ hiểu lúc này. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadText = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(text, { onEnd: () => setIsSpeaking(false) });
    }
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setInputText(clip);
    } catch {
      // ignore
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Register screen actions
  useEffect(() => {
    const unregSimp = registerAction({
      id: 'easyread.simplify',
      label: 'Làm dễ hiểu văn bản',
      aliases: ['đơn giản hóa', 'làm dễ hiểu'],
      execute: () => handleSimplify(),
    });
    const unregRead = registerAction({
      id: 'easyread.readAloud',
      label: 'Đọc nội dung dễ hiểu',
      aliases: ['đọc nội dung', 'đọc dễ hiểu'],
      execute: () => {
        if (result?.simplified) {
          handleReadText(result.simplified);
        }
      },
    });

    return () => {
      unregSimp();
      unregRead();
    };
  }, [registerAction, inputText, result]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Làm nội dung dễ hiểu</h1>
        <p className="text-sm text-text-secondary">
          Viết lại câu từ phức tạp thành văn bản đơn giản, giải thích từ chuyên ngành và chia từng bước.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-surface rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="input-easy-read" className="font-bold text-sm text-text-primary">
            Văn bản gốc cần làm dễ hiểu
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePaste}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Dán từ bộ nhớ tạm
            </button>
            {inputText && (
              <button
                onClick={() => setInputText('')}
                className="text-xs text-text-secondary hover:text-red-500"
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        <textarea
          id="input-easy-read"
          rows={5}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Dán thông báo hành chính, đơn thuốc, bài báo hoặc điều khoản phức tạp vào đây..."
          className="w-full p-4 rounded-2xl bg-surface-subtle border border-border text-text-primary placeholder:text-text-disabled focus:ring-2 focus:ring-primary focus:outline-none text-base leading-relaxed resize-y"
        />

        {/* Configuration Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-text-secondary">Mức độ:</span>
            {[
              { id: 'standard', label: 'Dễ hiểu chuẩn' },
              { id: 'ultra-simple', label: 'Siêu đơn giản' },
              { id: 'steps', label: 'Từng bước một' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setLevel(m.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  level === m.id
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-surface-subtle text-text-secondary hover:text-text-primary'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleSimplify}
            disabled={!inputText.trim() || isLoading}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-xs transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? 'Đang viết lại…' : 'Làm dễ hiểu ngay'}</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {/* Simplified Output Box */}
      {result && (
        <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Summary */}
          {result.summary && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200 space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                Tóm tắt cốt lõi
              </div>
              <div className="text-base font-semibold">{result.summary}</div>
            </div>
          )}

          {/* Main Simplified Text */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-rose-600" />
                <span>Nội dung đã làm dễ hiểu</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleReadText(result.simplified)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-subtle border border-border hover:bg-surface text-text-primary"
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isSpeaking ? 'Dừng đọc' : 'Đọc'}</span>
                </button>
                <button
                  onClick={() => handleCopy(result.simplified)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-subtle border border-border hover:bg-surface text-text-primary"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã chép' : 'Chép'}</span>
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface-subtle border border-border text-base sm:text-lg leading-relaxed text-text-primary whitespace-pre-line font-medium">
              {result.simplified}
            </div>
          </div>

          {/* Steps (If any) */}
          {result.steps && result.steps.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-rose-600" />
                <span>Các bước thực hiện</span>
              </h3>
              <div className="space-y-2">
                {result.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-surface-subtle border border-border flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 text-sm sm:text-base font-medium text-text-primary">
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Glossary (If any) */}
          {result.glossary && result.glossary.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-rose-600" />
                <span>Giải thích từ khó & chuyên ngành</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.glossary.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-1"
                  >
                    <div className="font-bold text-sm text-text-primary">{item.term}</div>
                    <div className="text-xs text-text-secondary leading-relaxed">
                      {item.definition}
                    </div>
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
