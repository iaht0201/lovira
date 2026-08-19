import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Trash2,
  HelpCircle,
  Clock,
  ListOrdered,
} from 'lucide-react';
import { ReadAloudButton } from '../common/ReadAloudButton';
import { VoiceInputButton } from '../common/VoiceInputButton';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EasyReadResult, UserProfile, AccessibilitySettings } from '../../types';
import { SAMPLE_EASY_READ_TEXTS } from '../../constants';
import { simplifyTextEasyRead } from '../../services/api';
import { saveActivityHistory } from '../../lib/firebase';
import { useRegisterScreenActions } from '../voice-access/ScreenActionRegistry';
import { LoviraSpeechManager } from '../voice-access/SpeechManager';

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

  useRegisterScreenActions({
    screenId: 'easy-read',
    screenTitle: 'Làm nội dung dễ hiểu',
    screenState: {
      hasInputText: !!inputText.trim(),
      hasResult: !!result,
      level,
      isLoading: loading,
    },
    actions: [
      {
        id: 'simplify',
        label: 'Làm dễ hiểu',
        aliases: ['làm dễ hiểu', 'giản lược văn bản', 'đơn giản hóa', 'rút gọn', 'xử lý văn bản'],
        description: 'Chuyển văn bản thành dạng dễ hiểu, câu ngắn, rõ nghĩa',
        prerequisites: {
          isSatisfied: !!inputText.trim(),
          missingReason: 'Chưa có văn bản nào trong ô nhập liệu. Bạn hãy nhập hoặc dán văn bản trước nhé.',
        },
        handler: () => handleSimplify(),
      },
      {
        id: 'setLevelEasy',
        label: 'Mức Cực kỳ đơn giản',
        aliases: ['cực kỳ đơn giản', 'dễ hiểu nhất', 'mức dễ nhất', 'đơn giản nhất'],
        description: 'Đặt mức độ làm dễ hiểu sang cực kỳ đơn giản',
        handler: () => setLevel('easy'),
      },
      {
        id: 'setLevelStandard',
        label: 'Mức Tiêu chuẩn',
        aliases: ['mức tiêu chuẩn', 'tiêu chuẩn', 'dễ hiểu vừa'],
        description: 'Đặt mức độ làm dễ hiểu sang tiêu chuẩn',
        handler: () => setLevel('standard'),
      },
      {
        id: 'setLevelStep',
        label: 'Mức Từng bước',
        aliases: ['từng bước', 'hướng dẫn từng bước', 'dạng các bước'],
        description: 'Đặt mức độ làm dễ hiểu sang định dạng từng bước',
        handler: () => setLevel('step'),
      },
      {
        id: 'loadSample',
        label: 'Dùng văn bản mẫu',
        aliases: ['dùng văn bản mẫu', 'tải mẫu', 'ví dụ', 'văn bản mẫu'],
        description: 'Nạp văn bản ví dụ mẫu vào ô nhập liệu',
        handler: () => handleLoadSample(SAMPLE_EASY_READ_TEXTS[0]),
      },
      {
        id: 'clear',
        label: 'Xóa trắng',
        aliases: ['xóa trắng', 'xóa văn bản', 'xóa hết', 'làm mới'],
        description: 'Xóa sạch văn bản nhập và kết quả hiện tại',
        prerequisites: {
          isSatisfied: !!inputText.trim() || !!result,
          missingReason: 'Ô nhập liệu đang trống.',
        },
        handler: () => handleClear(),
      },
      {
        id: 'readResult',
        label: 'Đọc kết quả dễ hiểu',
        aliases: ['đọc kết quả dễ hiểu', 'đọc văn bản dễ hiểu', 'đọc kết quả', 'đọc to'],
        description: 'Đọc to nội dung văn bản đã được làm dễ hiểu',
        prerequisites: {
          isSatisfied: !!result,
          missingReason: 'Chưa có kết quả văn bản dễ hiểu nào để đọc.',
        },
        handler: () => {
          if (result) {
            const text = `${result.title || ''}. Tóm tắt: ${result.summary}. Nội dung dễ hiểu: ${result.simplifiedText}`;
            LoviraSpeechManager.speak(text, { rate: settings.speechRate || 1.0 });
          }
        },
      },
      {
        id: 'copyResult',
        label: 'Sao chép kết quả',
        aliases: ['sao chép kết quả', 'copy kết quả', 'sao chép văn bản'],
        description: 'Sao chép nội dung văn bản dễ hiểu vào khay nhớ tạm',
        prerequisites: {
          isSatisfied: !!result,
          missingReason: 'Chưa có kết quả nào để sao chép.',
        },
        handler: () => handleCopy(),
      },
    ],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Làm nội dung dễ hiểu</h2>
          <p className="text-sm text-text-secondary mt-1">Chuyển các văn bản hành chính, thông báo phức tạp thành dạng dễ đọc, câu ngắn, rõ nghĩa.</p>
        </div>
      </div>

      {/* Level Selector & Mobile Workspace Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Mobile Tab Switcher (Visible on Mobile < lg) */}
        <div className="flex lg:hidden bg-surface border border-slate-200 dark:border-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMobileTab('input')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeMobileTab === 'input'
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Văn bản gốc
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab('result')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors relative ${
              activeMobileTab === 'result'
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Nội dung dễ hiểu
            {result && activeMobileTab !== 'result' && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            )}
          </button>
        </div>

        {/* Level Selector */}
        <div className="flex bg-surface border border-slate-200 dark:border-slate-800 p-1 rounded-xl shrink-0">
          {[
            { id: 'standard', label: 'Tiêu chuẩn' },
            { id: 'easy', label: 'Dễ hiểu' },
            { id: 'step', label: 'Từng bước' },
          ].map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id as any)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                level === l.id
                  ? 'bg-primary-soft text-primary font-bold'
                  : 'text-text-secondary hover:text-text-primary font-semibold'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Input */}
        <div
          className={`space-y-4 bg-surface border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl flex flex-col justify-between min-h-[450px] ${
            activeMobileTab === 'input' ? 'block' : 'hidden lg:flex'
          }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-text-primary">Văn bản gốc</h3>
              <div className="flex items-center gap-2">
                <VoiceInputButton
                  currentValue={inputText}
                  onTranscript={(newText) => setInputText(newText)}
                  promptMessage="Xin mời bạn đọc hoặc nói đoạn văn bản cần làm dễ hiểu nhé, tôi đang lắng nghe..."
                  label="Lắng nghe & Tự nhập văn bản"
                  size="sm"
                  showGuidedPrompt={true}
                />
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-semibold text-text-secondary hover:text-rose-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Dán văn bản phức tạp, hợp đồng, thông báo hành chính hoặc bài hướng dẫn vào đây..."
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface text-sm text-text-primary focus:border-primary leading-relaxed break-words-safe"
            ></textarea>

            {/* Samples */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-text-secondary block">
                Mẫu văn bản có sẵn:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_EASY_READ_TEXTS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLoadSample(sample)}
                    className="px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-xs text-text-primary font-medium text-left border border-slate-200 dark:border-slate-800 break-words-safe"
                  >
                    {sample.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleSimplify}
              disabled={loading || !inputText.trim()}
              className="w-full py-3 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 shrink-0" /> Làm dễ hiểu ngay
            </button>
          </div>
        </div>

        {/* Right Column: Result */}
        <div
          className={`bg-surface border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl flex flex-col justify-between min-h-[450px] ${
            activeMobileTab === 'result' ? 'block' : 'hidden lg:flex'
          }`}
        >
          {loading ? (
            <LoadingSpinner message="Lovira đang chuyển văn bản sang dạng dễ hiểu..." />
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs space-y-2">
              <p className="font-bold">{error}</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-text-primary">Nội dung dễ hiểu</h3>
                <div className="flex items-center gap-2">
                  <ReadAloudButton
                    text={`${result.title || ''}. ${result.summary}. ${result.simplifiedText}`}
                    settings={settings}
                    size="sm"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-text-primary hover:bg-surface-subtle flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {result.title && (
                <h4 className="text-base sm:text-lg font-bold text-text-primary break-words-safe">{result.title}</h4>
              )}

              <div className="p-3.5 rounded-xl bg-surface-subtle text-sm text-text-primary leading-relaxed break-words-safe">
                <strong>Tóm tắt:</strong> {result.summary}
              </div>

              {result.steps && result.steps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                    <ListOrdered className="w-4 h-4" /> Các bước thực hiện
                  </h4>
                  <ol className="space-y-2 text-sm text-text-primary font-medium">
                    {result.steps.map((st, i) => (
                      <li key={i} className="flex items-start gap-2 break-words-safe">
                        <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">
                          {i + 1}
                        </span>
                        <span>{st}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Nội dung chi tiết</h4>
                <div className="p-4 rounded-xl bg-surface-subtle text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words-safe">
                  {result.simplifiedText}
                </div>
              </div>

              {result.difficultTerms && result.difficultTerms.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                    <HelpCircle className="w-4 h-4 text-primary" /> Giải thích từ khó
                  </h4>
                  <div className="space-y-1.5">
                    {result.difficultTerms.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-surface-subtle text-xs border border-slate-100 dark:border-slate-800 break-words-safe">
                        <span className="font-bold text-primary">{item.term}:</span>{' '}
                        <span className="text-text-primary">{item.explanation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-text-primary">Nội dung dễ hiểu</h3>
              </div>
              <div className="p-8 text-center text-text-secondary text-sm">
                Dán văn bản và nhấn "Làm dễ hiểu ngay" để xem kết quả tại đây.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
