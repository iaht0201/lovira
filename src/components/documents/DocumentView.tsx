import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Send,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  FileCheck,
  HelpCircle,
} from 'lucide-react';
import { AccessibilitySettings, UserProfile, DocumentResult } from '../../types';
import { speakText, stopSpeaking } from '../../lib/speech';
import { saveActivityToFirestore, auth } from '../../lib/firebase';
import { useScreenActionContext } from '../voice-access/ScreenActionRegistry';

interface DocumentViewProps {
  userProfile: UserProfile | null;
  settings: AccessibilitySettings;
}

export const DocumentView: React.FC<DocumentViewProps> = ({
  userProfile,
  settings,
}) => {
  const [file, setFile] = useState<{ name: string; content: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DocumentResult | null>(null);
  const [question, setQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { registerAction, setCurrentScreenInfo } = useScreenActionContext();

  useEffect(() => {
    setCurrentScreenInfo({
      screenId: 'documents',
      title: 'Hiểu tài liệu',
      description: 'Phân tích tài liệu PDF, văn bản hành chính và hỏi đáp nội dung',
    });
  }, [setCurrentScreenInfo]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setFile({ name: selectedFile.name, content: text });
        analyzeDocument(selectedFile.name, text);
      };
      // Read as text for simplicity
      reader.readAsText(selectedFile);
    }
  };

  const analyzeDocument = async (name: string, content: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);
    setChatMessages([]);

    try {
      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-lovira-client': 'web-app',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/gemini/document', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          documentName: name,
          documentContent: content.slice(0, 15000), // Limit size for initial parse
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Lỗi khi phân tích tài liệu.');
      }

      const resData = json.data as DocumentResult;
      setResult(resData);

      // Save to Firebase history
      if (userProfile?.uid) {
        saveActivityToFirestore(userProfile.uid, {
          type: 'document',
          title: 'Tài liệu: ' + name,
          preview: resData.summary,
          data: resData,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể phân tích tài liệu lúc này. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !result) return;
    const userQ = question.trim();
    setQuestion('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userQ }]);
    setIsAsking(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-lovira-client': 'web-app',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/gemini/document-qa', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          documentContent: file?.content.slice(0, 15000) || '',
          question: userQ,
          previousMessages: chatMessages,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Lỗi khi trả lời câu hỏi.');
      }

      const reply = json.data?.answer || 'Lovira không tìm thấy thông tin phù hợp trong tài liệu.';
      setChatMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      if (settings.autoReadResponses) {
        speakText(reply);
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Có lỗi xảy ra khi xử lý câu hỏi. Vui lòng thử lại.' },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleReadText = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(text, () => setIsSpeaking(false));
    }
  };

  // Register screen actions
  useEffect(() => {
    const unregUpload = registerAction({
      id: 'documents.upload',
      label: 'Tải lên tài liệu',
      aliases: ['chọn tài liệu', 'mở file'],
      execute: () => fileInputRef.current?.click(),
    });

    return () => {
      unregUpload();
    };
  }, [registerAction]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Hiểu tài liệu</h1>
        <p className="text-sm text-text-secondary">
          Phân tích hợp đồng, hóa đơn, công văn hành chính và hỏi đáp nội dung chi tiết.
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-surface rounded-3xl border border-border p-6 shadow-xs space-y-4">
        {file ? (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-text-primary">{file.name}</div>
                <div className="text-xs text-text-secondary">Tài liệu đang mở</div>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-border hover:bg-surface-subtle text-text-primary"
            >
              Đổi tài liệu
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-blue-500/50 rounded-2xl p-8 text-center space-y-3 cursor-pointer transition-colors"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 mx-auto flex items-center justify-center">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <div className="font-bold text-base text-text-primary">Tải tài liệu lên để đọc hiểu</div>
              <div className="text-xs text-text-secondary mt-0.5">
                Hỗ trợ tệp TXT, Markdown, tài liệu văn bản hoặc sao chép nội dung
              </div>
            </div>
            <button className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 shadow-xs">
              Chọn tệp từ máy
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.json,.pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 rounded-3xl bg-surface border border-border text-center space-y-3">
          <Sparkles className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
          <div className="font-bold text-base text-text-primary">Lovira đang đọc tài liệu…</div>
          <div className="text-xs text-text-secondary">Đang trích xuất ý chính, điều khoản và thời hạn</div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {/* Document Analysis Result & Q&A */}
      {result && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="space-y-2 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Tóm tắt tài liệu
                </span>
                <button
                  onClick={() => handleReadText(result.summary)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-subtle border border-border hover:bg-surface text-text-primary"
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isSpeaking ? 'Dừng đọc' : 'Đọc'}</span>
                </button>
              </div>
              <p className="text-lg font-medium text-text-primary leading-relaxed">
                {result.summary}
              </p>
            </div>

            {/* Key Clauses & Deadlines */}
            {result.keyPoints && result.keyPoints.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  <span>Ý chính & Quy định quan trọng</span>
                </h3>
                <ul className="space-y-2">
                  {result.keyPoints.map((pt, i) => (
                    <li key={i} className="p-3.5 rounded-xl bg-surface-subtle border border-border text-sm text-text-primary">
                      • {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Document Q&A Section */}
          <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Hỏi đáp về tài liệu này</span>
            </h3>

            {chatMessages.length > 0 && (
              <div className="space-y-3 max-h-[300px] overflow-y-auto p-3 bg-surface-subtle rounded-2xl border border-border">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-white ml-8 font-medium'
                        : 'bg-surface border border-border text-text-primary mr-8 font-normal'
                    }`}
                  >
                    <div className="text-[11px] opacity-70 mb-1">
                      {msg.role === 'user' ? 'Bạn' : 'Lovira AI'}
                    </div>
                    {msg.text}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                placeholder="Hỏi về thời hạn, điều kiện, mức phí trong tài liệu..."
                className="flex-1 p-3.5 rounded-2xl bg-surface-subtle border border-border text-text-primary placeholder:text-text-disabled focus:ring-2 focus:ring-primary focus:outline-none text-sm"
              />
              <button
                onClick={handleAskQuestion}
                disabled={!question.trim() || isAsking}
                className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all disabled:opacity-50"
                aria-label="Gửi câu hỏi"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
