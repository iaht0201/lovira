import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Trash2,
  BookOpen,
  AlertTriangle,
  HelpCircle,
  Clock,
  ListOrdered,
} from 'lucide-react';
import { ReadAloudButton } from '../common/ReadAloudButton';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EasyReadResult, UserProfile, AccessibilitySettings } from '../../types';
import { SAMPLE_EASY_READ_TEXTS } from '../../constants';
import { simplifyTextEasyRead } from '../../services/api';
import { saveActivityHistory } from '../../lib/firebase';

interface EasyReadViewProps {
  userProfile?: UserProfile | null;
  settings: AccessibilitySettings;
}

export const EasyReadView: React.FC<EasyReadViewProps> = ({
  userProfile,
  settings,
}) => {
  const [inputText, setInputText] = useState('');
  const [level, setLevel] = useState<'standard' | 'easy' | 'step'>('easy');
  const [activeMobileTab, setActiveMobileTab] = useState<'input' | 'result'>('input');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EasyReadResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSimplify = async () => {
    if (!inputText.trim()) {
      setError('Vui lòng nhập văn bản cần làm dễ hiểu.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await simplifyTextEasyRead(
        inputText,
        level,
        localStorage.getItem('lovira_custom_gemini_key') || undefined
      );
      setResult(data);
      setActiveMobileTab('result');

      if (userProfile?.uid) {
        saveActivityHistory(
          userProfile.uid,
          'easy-read',
          data.title || `Văn bản Easy Read - ${inputText.slice(0, 30)}…`,
          data.summary,
          { inputText, result: data, level }
        );
      }
    } catch (err: unknown) {
      console.error('Easy read error:', err);
      const msg = err instanceof Error ? err.message : 'Chưa thể làm dễ hiểu văn bản này.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = (sample: { title: string; text: string }) => {
    setInputText(sample.text);
    setResult(null);
    setError(null);
  };

  const handleClear = () => {
    setInputText('');
    setResult(null);
    setError(null);
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = `[${result.title || 'Easy Read'}]\n${result.summary}\n\n[Nội dung Dễ hiểu]\n${result.simplifiedText}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-light text-[#1A1A1A] dark:text-white flex items-center gap-2.5">
            <span>Làm nội dung dễ hiểu</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-light">
            Chuyển các văn bản hành chính, thông báo phức tạp thành dạng dễ đọc, câu ngắn, rõ nghĩa.
          </p>
        </div>

        {/* Level Controls */}
        <div className="flex p-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
          {[
            { id: 'standard', label: 'Tiêu chuẩn' },
            { id: 'easy', label: 'Dễ hiểu' },
            { id: 'step', label: 'Từng bước' },
          ].map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] ${
                level === l.id
                  ? 'bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A] shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Tabs Toggle */}
      <div className="flex md:hidden rounded-full bg-neutral-100 dark:bg-neutral-800 p-1 border border-neutral-200 dark:border-neutral-700">
        <button
          onClick={() => setActiveMobileTab('input')}
          className={`flex-1 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            activeMobileTab === 'input'
              ? 'bg-white dark:bg-neutral-900 text-[#1A1A1A] dark:text-white shadow-xs'
              : 'text-neutral-400'
          }`}
        >
          Bản gốc
        </button>
        <button
          onClick={() => setActiveMobileTab('result')}
          disabled={!result}
          className={`flex-1 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            activeMobileTab === 'result'
              ? 'bg-white dark:bg-neutral-900 text-[#1A1A1A] dark:text-white shadow-xs'
              : 'text-neutral-400 opacity-50'
          }`}
        >
          Kết quả Easy Read
        </button>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Input */}
        <div
          className={`space-y-4 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs ${
            activeMobileTab === 'result' ? 'hidden md:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-base font-light text-[#1A1A1A] dark:text-white">Văn bản gốc</h2>

            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider hover:bg-rose-50 dark:hover:bg-rose-950/50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          </div>

          <textarea
            rows={10}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Dán văn bản phức tạp, hợp đồng, thông báo hành chính hoặc bài hướng dẫn vào đây…"
            className="w-full p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-[#1A1A1A] dark:text-white text-sm sm:text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
          ></textarea>

          {/* Sample Presets */}
          <div className="space-y-2 pt-2">
            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
              Hoặc chọn mẫu văn bản thực tế tại Việt Nam:
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_EASY_READ_TEXTS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleLoadSample(sample)}
                  className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#1A1A1A] dark:text-neutral-200 text-xs font-medium text-left truncate max-w-full border border-neutral-200 dark:border-neutral-700"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={handleSimplify}
              disabled={loading || !inputText.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A] font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Làm dễ hiểu ngay</span>
            </button>
          </div>
        </div>

        {/* Right Column: Easy Read Output */}
        <div
          className={`space-y-6 ${
            activeMobileTab === 'input' ? 'hidden md:block' : 'block'
          }`}
        >
          {!result && !loading && (
            <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 mx-auto flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[#1A1A1A] dark:text-white">Chưa có kết quả Easy Read</h3>
              <p className="text-xs text-neutral-400 font-light max-w-xs mx-auto">
                Dán văn bản gốc hoặc chọn mẫu bên trái, sau đó nhấn "Làm dễ hiểu ngay".
              </p>
            </div>
          )}

          {loading && (
            <LoadingSpinner
              message="Lovira đang làm nội dung dễ hiểu hơn…"
              subMessage="Đang giản lược câu chữ, loại bỏ từ ngữ hành chính rườm rà và trích xuất các ý chính."
            />
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
              {error}
            </div>
          )}

          {result && !loading && (
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6">
              {/* Header & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700">
                  Nội dung Dễ hiểu (Easy Read)
                </span>

                <div className="flex items-center gap-2">
                  <ReadAloudButton
                    text={`${result.title || ''}. ${result.summary}. ${result.simplifiedText}`}
                    speechRate={settings.speechRate}
                    size="sm"
                  />

                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#1A1A1A] dark:text-neutral-200 text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {/* Title if present */}
              {result.title && (
                <h2 className="text-xl font-light text-[#1A1A1A] dark:text-white">
                  {result.title}
                </h2>
              )}

              {/* Core Summary */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-1">
                  Ý cốt lõi
                </div>
                <p className="text-base font-normal text-[#1A1A1A] dark:text-white leading-relaxed">
                  {result.summary}
                </p>
              </div>

              {/* Step-by-Step list if available */}
              {result.steps && result.steps.length > 0 && (
                <div className="space-y-3 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4" />
                    <span>Các bước thực hiện</span>
                  </h3>
                  <ol className="space-y-2 text-sm text-slate-900 dark:text-slate-100 font-semibold">
                    {result.steps.map((st, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center shrink-0 font-bold">
                          {i + 1}
                        </span>
                        <span className="mt-0.5">{st}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Main Simplified Text */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Nội dung đã được đơn giản hóa
                </h3>
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-base sm:text-lg leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-wrap font-sans">
                  {result.simplifiedText}
                </div>
              </div>

              {/* Key Points */}
              {result.keyPoints && result.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Điểm cần nhớ
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-800 dark:text-slate-200">
                    {result.keyPoints.map((kp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Important Dates */}
              {result.importantDates && result.importantDates.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Thời gian & Ngày quan trọng</span>
                  </h3>
                  <ul className="list-disc list-inside text-xs text-slate-800 dark:text-slate-200 space-y-1 font-semibold">
                    {result.importantDates.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Difficult Terms Glossary */}
              {result.difficultTerms && result.difficultTerms.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-indigo-500" />
                    <span>Giải thích từ khó</span>
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {result.difficultTerms.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-xs border border-slate-200 dark:border-slate-700 space-y-0.5">
                        <span className="font-bold text-indigo-700 dark:text-indigo-300">{item.term}:</span>{' '}
                        <span className="text-slate-700 dark:text-slate-300">{item.explanation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
