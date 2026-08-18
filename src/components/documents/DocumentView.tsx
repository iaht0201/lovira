import React, { useState } from 'react';
import {
  BookOpen,
  Upload,
  FileText,
  Sparkles,
  Send,
  AlertTriangle,
  Copy,
  Check,
  Calendar,
  PhoneCall,
  ShieldAlert,
  HelpCircle,
  Clock,
  FileCheck,
} from 'lucide-react';
import { ReadAloudButton } from '../common/ReadAloudButton';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { DocumentAnalysis, UserProfile, AccessibilitySettings } from '../../types';
import { DEMO_DOCUMENTS } from '../../constants';
import { extractTextFromDocument, DocumentExtractResult } from '../../lib/documentProcessor';
import { analyzeDocument, askDocumentQuestion } from '../../services/api';
import { saveActivityHistory } from '../../lib/firebase';

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

  // Document Q&A state
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

  return (
    <div className="space-y-8 pb-12">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-light text-[#1A1A1A] dark:text-white flex items-center gap-2.5">
            <span>Hiểu tài liệu</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-light">
            Tải PDF, DOCX hoặc TXT để Lovira tóm tắt, trích xuất yêu cầu hồ sơ và trả lời câu hỏi tài liệu.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A] font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 cursor-pointer transition-colors shadow-xs focus-within:ring-2 focus-within:ring-[#1A1A1A] shrink-0">
          <Upload className="w-3.5 h-3.5" />
          <span>Chọn tài liệu</span>
          <input
            type="file"
            accept=".pdf,.docx,.txt,image/*"
            onChange={handleFileUpload}
            className="sr-only"
          />
        </label>
      </div>

      {/* Main Content Layout */}
      {!extractedDoc ? (
        /* Empty Upload Dropzone */
        <div className="space-y-6">
          <div className="border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl p-12 text-center bg-white dark:bg-neutral-900 hover:border-neutral-400 transition-colors space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#1A1A1A] dark:text-white mx-auto flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-base font-light text-[#1A1A1A] dark:text-white">
                Tải lên tài liệu PDF, DOCX hoặc TXT
              </h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto font-light">
                Lovira sẽ tự động đọc từng trang, giải thích nghĩa đơn giản và giúp bạn hỏi đáp thông tin.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A] font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 cursor-pointer transition-colors shadow-xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Duyệt tệp từ thiết bị</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt,image/*"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
          </div>

          {/* Demo Files Section */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 flex items-center gap-2">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Hoặc thử mẫu tài liệu thực tế Việt Nam:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {DEMO_DOCUMENTS.map((demo, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleLoadDemo(demo)}
                  className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#1A1A1A] dark:text-neutral-200 text-xs font-medium border border-neutral-200 dark:border-neutral-700 transition-colors"
                >
                  📄 {demo.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Document Analysis Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Extracted Text & Stats */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {extractedDoc.fileType.toUpperCase()}
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-1">
                  {extractedDoc.fileName}
                </h2>
              </div>

              <label className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer shrink-0">
                Đổi tệp
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,image/*"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            </div>

            {extractedDoc.warning && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{extractedDoc.warning}</span>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Văn bản đã trích xuất từ tài liệu:
              </span>
              <div className="max-h-[360px] overflow-y-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono">
                {extractedDoc.text || 'Chưa trích xuất được nội dung chữ.'}
              </div>
            </div>
          </div>

          {/* Right Column: AI Analysis & Q&A */}
          <div className="lg:col-span-7 space-y-6">
            {(extracting || loading) && (
              <LoadingSpinner
                message={extracting ? progressMsg || 'Đang đọc tài liệu…' : 'Lovira đang phân tích tài liệu…'}
                subMessage="Đang trích xuất thời hạn, khoản phí, giấy tờ cần chuẩn bị và tổng hợp ý chính."
              />
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                {error}
              </div>
            )}

            {analysis && !loading && !extracting && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                {/* Header & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                    Phân tích tài liệu Lovira
                  </span>

                  <div className="flex items-center gap-2">
                    <ReadAloudButton
                      text={`${analysis.title || ''}. ${analysis.summary}. ${analysis.requirements.join('. ')}`}
                      speechRate={settings.speechRate}
                      size="sm"
                    />

                    <button
                      onClick={handleCopyAnalysis}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>

                {/* Title & Summary */}
                <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 space-y-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                    {analysis.title || 'Tóm tắt tổng quan'}
                  </h2>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>

                {/* Requirements / Papers Needed */}
                {analysis.requirements && analysis.requirements.length > 0 && (
                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>Hồ sơ & Giấy tờ cần chuẩn bị</span>
                    </h3>
                    <ul className="space-y-1.5 text-sm text-slate-800 dark:text-slate-200 font-semibold">
                      {analysis.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0"></span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Important Dates */}
                {analysis.importantDates && analysis.importantDates.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>Thời hạn & Mốc thời gian</span>
                    </h3>
                    <ul className="list-disc list-inside text-xs text-slate-800 dark:text-slate-200 space-y-1 font-semibold">
                      {analysis.importantDates.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contacts & Warnings */}
                {analysis.contacts && analysis.contacts.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <PhoneCall className="w-4 h-4 text-emerald-600" />
                      <span>Thông tin liên hệ / Hotline</span>
                    </h3>
                    <ul className="list-disc list-inside text-xs text-slate-800 dark:text-slate-200 space-y-1">
                      {analysis.contacts.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Interactive Q&A Session */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Hỏi đáp trực tiếp về tài liệu này</span>
                  </h3>

                  {qaHistory.length > 0 && (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {qaHistory.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                            msg.role === 'user'
                              ? 'bg-indigo-600 text-white ml-8 font-semibold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-8'
                          }`}
                        >
                          <p className="font-bold opacity-80">{msg.role === 'user' ? 'Bạn' : 'Lovira'}:</p>
                          <p className="leading-relaxed">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleAskQuestion} className="flex gap-2">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Hỏi về phí, thời hạn, địa điểm hoặc quy trình..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="submit"
                      disabled={qaLoading || !question.trim()}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
