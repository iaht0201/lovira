import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  Send,
  AlertTriangle,
  Copy,
  Check,
  Calendar,
  PhoneCall,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { ReadAloudButton } from '../common/ReadAloudButton';
import { VoiceInputButton } from '../common';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { DocumentAnalysis, UserProfile, AccessibilitySettings } from '../../types';
import { DEMO_DOCUMENTS } from '../../constants';
import { extractTextFromDocument, DocumentExtractResult } from '../../lib/documentProcessor';
import { analyzeDocument, askDocumentQuestion } from '../../services/api';
import { saveActivityHistory } from '../../lib/firebase';
import { useRegisterScreenActions } from '../voice-access/ScreenActionRegistry';
import { LoviraSpeechManager } from '../voice-access/SpeechManager';

interface DocumentViewProps {
  userProfile?: UserProfile | null;
  settings: AccessibilitySettings;
}

export const DocumentView: React.FC<DocumentViewProps> = ({
  userProfile,
  settings,
}) => {
  const [extractedDoc, setExtractedDoc] = useState<DocumentExtractResult | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);

  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processDocumentFile(file);
    }
  };

  const processDocumentFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('Tệp quá lớn. Lovira hỗ trợ tài liệu dung lượng tối đa 10MB (khoảng 30 trang).');
      return;
    }

    setExtracting(true);
    setError(null);
    setAnalysis(null);
    setQaHistory([]);

    try {
      const docResult = await extractTextFromDocument(file, (msg) => {
        setProgressMsg(msg);
      });
      setExtractedDoc(docResult);

      if (docResult.text) {
        runDocumentAnalysis(docResult.text, docResult.fileName);
      }
    } catch (err: unknown) {
      console.error('Document extraction error:', err);
      const msg = err instanceof Error ? err.message : 'Không thể đọc tệp tài liệu này.';
      setError(msg);
    } finally {
      setExtracting(false);
    }
  };

  const handleLoadDemo = (demo: { name: string; content: string }) => {
    setAnalysis(null);
    setQaHistory([]);
    setError(null);

    const docResult: DocumentExtractResult = {
      text: demo.content,
      fileName: demo.name,
      fileType: 'txt',
    };
    setExtractedDoc(docResult);
    runDocumentAnalysis(demo.content, demo.name);
  };

  const runDocumentAnalysis = async (text: string, fileName: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await analyzeDocument(
        text,
        fileName,
        localStorage.getItem('lovira_custom_gemini_key') || undefined
      );
      setAnalysis(data);

      if (userProfile?.uid) {
        saveActivityHistory(
          userProfile.uid,
          'document',
          data.title || fileName || 'Tài liệu',
          data.summary,
          { fileName, text, analysis: data }
        );
      }
    } catch (err: unknown) {
      console.error('Document analysis error:', err);
      const msg = err instanceof Error ? err.message : 'Chưa thể phân tích tài liệu này.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !extractedDoc?.text || qaLoading) return;

    const q = question.trim();
    setQuestion('');
    setQaLoading(true);

    const updatedHistory = [...qaHistory, { role: 'user' as const, content: q }];
    setQaHistory(updatedHistory);

    try {
      const answer = await askDocumentQuestion(
        extractedDoc.text,
        q,
        qaHistory,
        localStorage.getItem('lovira_custom_gemini_key') || undefined
      );

      setQaHistory((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      console.error('Ask question error:', err);
      setQaHistory((prev) => [
        ...prev,
        { role: 'assistant', content: 'Lovira chưa thể trả lời câu hỏi này. Vui lòng thử lại.' },
      ]);
    } finally {
      setQaLoading(false);
    }
  };

  const handleCopyAnalysis = () => {
    if (!analysis) return;
    const text = `[Tài liệu: ${analysis.title || 'Phân tích'}]\n${analysis.summary}\n\n[Yêu cầu / Hồ sơ cần có]\n${analysis.requirements.join('\n')}\n\n[Hạn chót & Thời gian]\n${analysis.importantDates.join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useRegisterScreenActions({
    screenId: 'documents',
    screenTitle: 'Hiểu tài liệu',
    screenState: {
      hasDocument: !!extractedDoc?.text,
      hasAnalysis: !!analysis,
      fileName: extractedDoc?.fileName,
      isLoading: loading || extracting,
    },
    actions: [
      {
        id: 'loadDemo',
        label: 'Tải tài liệu mẫu',
        aliases: ['tải tài liệu mẫu', 'dùng tài liệu mẫu', 'tài liệu mẫu', 'xem mẫu tài liệu', 'ví dụ'],
        description: 'Nạp tài liệu mẫu hành chính công để trải nghiệm thử',
        handler: () => handleLoadDemo(DEMO_DOCUMENTS[0]),
      },
      {
        id: 'reanalyze',
        label: 'Phân tích lại tài liệu',
        aliases: ['phân tích lại tài liệu', 'quét lại', 'chạy lại', 'phân tích lại'],
        description: 'Phân tích lại tệp tài liệu hiện tại',
        prerequisites: {
          isSatisfied: !!extractedDoc?.text,
          missingReason: 'Chưa có tài liệu nào để phân tích lại. Bạn hãy tải lên tệp PDF hoặc chọn tài liệu mẫu trước nhé.',
        },
        handler: () => {
          if (extractedDoc?.text) {
            runDocumentAnalysis(extractedDoc.text, extractedDoc.fileName);
          }
        },
      },
      {
        id: 'readAnalysis',
        label: 'Đọc tóm tắt tài liệu',
        aliases: ['đọc tóm tắt tài liệu', 'đọc to phân tích', 'đọc kết quả tài liệu', 'đọc to', 'đọc tóm tắt'],
        description: 'Đọc to nội dung phân tích tài liệu và các thủ tục cần chú ý',
        prerequisites: {
          isSatisfied: !!analysis,
          missingReason: 'Chưa có kết quả phân tích tài liệu nào để đọc.',
        },
        handler: () => {
          if (analysis) {
            const text = `${analysis.title || 'Tài liệu'}. Tóm tắt: ${analysis.summary}. Yêu cầu hồ sơ: ${analysis.requirements.join('. ')}. Thời gian: ${analysis.importantDates.join('. ')}`;
            LoviraSpeechManager.speak(text, { rate: settings.speechRate || 1.0 });
          }
        },
      },
      {
        id: 'copyAnalysis',
        label: 'Sao chép phân tích',
        aliases: ['sao chép phân tích', 'copy kết quả tài liệu', 'sao chép'],
        description: 'Sao chép nội dung tóm tắt và danh sách hồ sơ vào khay nhớ tạm',
        prerequisites: {
          isSatisfied: !!analysis,
          missingReason: 'Chưa có kết quả phân tích nào để sao chép.',
        },
        handler: () => handleCopyAnalysis(),
      },
      {
        id: 'askQuestion',
        label: 'Hỏi về tài liệu',
        aliases: ['hỏi về tài liệu', 'hỏi nội dung', 'tra cứu tài liệu'],
        description: 'Đặt câu hỏi cụ thể về thông tin có trong tài liệu',
        prerequisites: {
          isSatisfied: !!extractedDoc?.text,
          missingReason: 'Chưa có tài liệu nào để hỏi. Bạn hãy tải lên tệp tài liệu trước nhé.',
        },
        handler: (params) => {
          if (params?.question) {
            setQuestion(params.question);
          }
        },
      },
      {
        id: 'clear',
        label: 'Đóng tài liệu',
        aliases: ['đóng tài liệu', 'xóa tài liệu', 'tải tài liệu khác', 'làm mới'],
        description: 'Đóng tài liệu hiện tại để chọn tài liệu mới',
        prerequisites: {
          isSatisfied: !!extractedDoc,
          missingReason: 'Chưa có tài liệu nào đang mở.',
        },
        handler: () => {
          setExtractedDoc(null);
          setAnalysis(null);
          setQaHistory([]);
          setError(null);
        },
      },
    ],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Hiểu tài liệu</h2>
          <p className="text-sm text-text-secondary mt-1">Tải PDF, DOCX hoặc TXT để Lovira tóm tắt, trích xuất yêu cầu hồ sơ và trả lời câu hỏi tài liệu.</p>
        </div>

        <label className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0">
          <Upload className="w-4 h-4 shrink-0" /> Tải tài liệu lên
          <input
            type="file"
            accept=".pdf,.docx,.txt,image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {!extractedDoc ? (
        <div className="space-y-6">
          <div className="bg-surface border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[260px] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center shrink-0">
              <Upload className="w-6 h-6 shrink-0" />
            </div>
            <div>
              <p className="font-bold text-sm text-text-primary">Tải lên tài liệu PDF, DOCX, TXT hoặc ảnh quét</p>
              <p className="text-xs text-text-secondary mt-1">
                Tối đa 10MB (khoảng 30 trang). Lovira sẽ trích xuất văn bản, giản lược ý chính và trả lời thắc mắc.
              </p>
            </div>
            <label className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-xs cursor-pointer">
              Chọn tệp từ máy
              <input
                type="file"
                accept=".pdf,.docx,.txt,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="bg-surface border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-3">
            <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-primary" /> Mẫu tài liệu thực tế có sẵn:
            </span>
            <div className="flex flex-wrap gap-2">
              {DEMO_DOCUMENTS.map((demo, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleLoadDemo(demo)}
                  className="px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-xs text-text-primary font-medium border border-slate-200 dark:border-slate-800"
                >
                  📄 {demo.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Extracted Text Column */}
          <div className="lg:col-span-5 bg-surface border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 min-h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-surface-subtle text-text-secondary">
                  {extractedDoc.fileType.toUpperCase()}
                </span>
                <p className="text-sm font-bold text-text-primary truncate mt-1">
                  {extractedDoc.fileName}
                </p>
              </div>
              <label className="text-xs font-semibold text-primary hover:underline cursor-pointer shrink-0">
                Đổi tệp
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {extractedDoc.warning && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{extractedDoc.warning}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-text-secondary">Văn bản trích xuất được:</span>
              <div className="max-h-[380px] overflow-y-auto p-4 rounded-xl bg-surface-subtle text-xs text-text-primary leading-relaxed whitespace-pre-wrap font-mono">
                {extractedDoc.text || 'Chưa trích xuất được văn bản.'}
              </div>
            </div>
          </div>

          {/* AI Analysis Column */}
          <div className="lg:col-span-7 bg-surface border border-slate-200 dark:border-slate-800 p-6 rounded-2xl min-h-[500px] flex flex-col justify-between">
            {(extracting || loading) ? (
              <LoadingSpinner message={extracting ? progressMsg || 'Đang đọc tài liệu...' : 'Lovira đang phân tích nội dung...'} />
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
                <p className="font-bold">{error}</p>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-base text-text-primary">Kết quả phân tích</h3>
                  <div className="flex items-center gap-2">
                    <ReadAloudButton
                      text={`${analysis.title || ''}. ${analysis.summary}`}
                      settings={settings}
                      size="sm"
                    />
                    <button
                      onClick={handleCopyAnalysis}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-text-primary hover:bg-surface-subtle flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                      {analysis.title || 'Tóm tắt tổng quan'}
                    </h4>
                    <p className="text-sm text-text-primary leading-relaxed bg-surface-subtle p-3.5 rounded-xl">
                      {analysis.summary}
                    </p>
                  </div>

                  {analysis.requirements && analysis.requirements.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-primary" /> Hồ sơ & Giấy tờ cần chuẩn bị
                      </h4>
                      <ul className="text-sm text-text-primary space-y-1 list-disc list-inside">
                        {analysis.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.importantDates && analysis.importantDates.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-coral uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-coral" /> Hạn chót & Thời gian
                      </h4>
                      <ul className="text-sm text-coral space-y-1 list-disc list-inside font-medium">
                        {analysis.importantDates.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Q&A section */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                    <HelpCircle className="w-4 h-4 text-primary" /> Hỏi đáp về tài liệu
                  </h4>

                  {qaHistory.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {qaHistory.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl text-xs ${
                            msg.role === 'user'
                              ? 'bg-primary text-white ml-6 font-semibold'
                              : 'bg-surface-subtle text-text-primary mr-6'
                          }`}
                        >
                          <p className="leading-relaxed">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleAskQuestion} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Đặt câu hỏi về tài liệu..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface text-xs text-text-primary focus:border-primary"
                    />
                    <VoiceInputButton
                      currentValue={question}
                      onTranscript={(newText) => setQuestion(newText)}
                      promptMessage="Xin mời bạn nói câu hỏi cần tra cứu trong tài liệu này..."
                      label="Nói câu hỏi tra cứu tài liệu"
                      size="sm"
                      showGuidedPrompt={true}
                    />
                    <button
                      type="submit"
                      disabled={qaLoading || !question.trim()}
                      className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
