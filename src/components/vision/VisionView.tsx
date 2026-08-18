import React, { useState, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  AlertTriangle,
  Send,
  Copy,
  Check,
  RotateCcw,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { CameraModal } from './CameraModal';
import { ReadAloudButton } from '../common/ReadAloudButton';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { VisionResult, UserProfile, AccessibilitySettings } from '../../types';
import { analyzeVision } from '../../services/api';
import { saveActivityHistory } from '../../lib/firebase';

interface VisionViewProps {
  userProfile?: UserProfile | null;
  settings: AccessibilitySettings;
  initialAction?: string;
}

export const VisionView: React.FC<VisionViewProps> = ({
  userProfile,
  settings,
  initialAction,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [visionMode, setVisionMode] = useState<'scene' | 'text' | 'object' | 'quick'>('scene');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VisionResult | null>(null);

  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAnswers, setFollowUpAnswers] = useState<Array<{ q: string; a: string }>>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialAction === 'camera') {
      setIsCameraOpen(true);
    }
  }, [initialAction]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      setResult(null);
      setFollowUpAnswers([]);
      setError(null);
      runVisionAnalysis(base64, visionMode);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const runVisionAnalysis = async (
    base64Img: string,
    mode: 'scene' | 'text' | 'object' | 'quick'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeVision(
        base64Img,
        mode,
        undefined,
        localStorage.getItem('lovira_custom_gemini_key') || undefined
      );
      setResult(data);

      if (userProfile?.uid) {
        saveActivityHistory(
          userProfile.uid,
          'vision',
          `Phân tích ảnh - ${mode === 'scene' ? 'Khung cảnh' : mode === 'text' ? 'Đọc chữ' : mode === 'object' ? 'Vật thể' : 'Tóm tắt'}`,
          data.summary,
          { visionResult: data, mode }
        );
      }
    } catch (err: unknown) {
      console.error('Vision analysis error:', err);
      const msg = err instanceof Error ? err.message : 'Chưa thể phân tích hình ảnh này.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (mode: 'scene' | 'text' | 'object' | 'quick') => {
    setVisionMode(mode);
    if (selectedImage) {
      runVisionAnalysis(selectedImage, mode);
    }
  };

  const handleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpQuestion.trim() || !selectedImage || followUpLoading) return;

    const q = followUpQuestion.trim();
    setFollowUpQuestion('');
    setFollowUpLoading(true);

    try {
      const res = await fetch('/api/gemini/document-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: `Đây là thông tin từ hình ảnh: ${JSON.stringify(result)}`,
          question: q,
          customApiKey: localStorage.getItem('lovira_custom_gemini_key') || undefined,
        }),
      });
      const data = await res.json();
      const answer = data.answer || 'Tôi chưa tìm thấy câu trả lời rõ ràng trong ảnh.';

      setFollowUpAnswers((prev) => [...prev, { q, a: answer }]);
    } catch (err) {
      console.error('Followup error:', err);
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = `[Mô tả từ Lovira]\n${result.summary}\n\n[Chi tiết]\n${result.details.join('\n')}\n\n[Văn bản đọc được]\n${result.detectedText.join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">Lovira / Vision</div>
          <h1 className="text-2xl font-light text-[#1A1A1A] dark:text-white flex items-center gap-2.5 mt-1">
            <span>Nhìn giúp tôi (Vision Assistant)</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-light">
            Chụp hoặc tải ảnh để Lovira nhận diện khung cảnh, trích xuất chữ viết và lưu ý chướng ngại vật.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCameraOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A] font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Mở camera</span>
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#1A1A1A] dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors border border-neutral-200 dark:border-neutral-700">
            <Upload className="w-3.5 h-3.5" />
            <span>Tải ảnh lên</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Mode Selection Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60">
        {[
          { id: 'scene', label: 'Mô tả khung cảnh' },
          { id: 'text', label: 'Đọc chữ trong ảnh' },
          { id: 'object', label: 'Giải thích vật thể' },
          { id: 'quick', label: 'Tóm tắt nhanh' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => handleModeChange(m.id as any)}
            className={`flex-1 min-w-[140px] px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] ${
              visionMode === m.id
                ? 'bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A] shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Primary Workspace */}
      {!selectedImage ? (
        /* Dropzone Empty State */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl p-12 text-center bg-white dark:bg-neutral-900 hover:border-neutral-400 transition-colors space-y-4 shadow-xs"
        >
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#1A1A1A] dark:text-white mx-auto flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-light text-[#1A1A1A] dark:text-white">
              Kéo thả hoặc chọn tệp hình ảnh
            </h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto font-light">
              Hỗ trợ tệp JPG, PNG, WEBP. Lovira sẽ phân tích ngay lập tức.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => setIsCameraOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A] font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Chụp ảnh ngay</span>
            </button>
          </div>
        </div>
      ) : (
        /* Image & Analysis Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Image Preview Column */}
          <div className="lg:col-span-5 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-neutral-950 min-h-[280px] flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Hình ảnh đang phân tích"
                className="max-h-[450px] w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setResult(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#1A1A1A] dark:text-neutral-200 text-xs font-bold uppercase tracking-wider hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Chọn ảnh khác</span>
              </button>

              <button
                onClick={() => runVisionAnalysis(selectedImage, visionMode)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A] text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Phân tích lại</span>
              </button>
            </div>
          </div>

          {/* AI Result Column */}
          <div className="lg:col-span-7 space-y-6">
            {loading && (
              <LoadingSpinner
                message="Lovira đang nhìn và phân tích hình ảnh…"
                subMessage="Đang nhận diện vị trí các vật thể, bảng hiệu và kiểm tra cảnh báo an toàn."
              />
            )}

            {error && (
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-[#1A1A1A] dark:text-white space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Không thể hoàn thành phân tích</span>
                </div>
                <p className="text-xs font-light">{error}</p>
                <button
                  onClick={() => runVisionAnalysis(selectedImage, visionMode)}
                  className="px-3 py-1.5 rounded-full bg-[#1A1A1A] text-white font-bold text-xs uppercase tracking-wider hover:bg-neutral-800"
                >
                  Thử lại
                </button>
              </div>
            )}

            {result && !loading && (
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6">
                {/* Result Header & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700">
                    Kết quả phân tích từ Lovira
                  </span>

                  <div className="flex items-center gap-2">
                    <ReadAloudButton
                      text={`${result.summary}. ${result.details.join('. ')}. ${
                        result.possibleHazards.length > 0
                          ? 'Cảnh báo an toàn: ' + result.possibleHazards.join('. ')
                          : ''
                      }`}
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

                {/* Quick Summary */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                  <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-1">
                    Tóm tắt nhanh
                  </div>
                  <p className="text-sm font-normal text-[#1A1A1A] dark:text-white leading-relaxed">
                    {result.summary}
                  </p>
                </div>

                {/* Safety Warnings if any */}
                {result.possibleHazards && result.possibleHazards.length > 0 && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                      <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      <span>Lưu ý an toàn & chướng ngại vật</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs text-rose-900 dark:text-rose-200 font-medium">
                      {result.possibleHazards.map((haz, i) => (
                        <li key={i}>{haz}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detected Text */}
                {result.detectedText && result.detectedText.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Văn bản trích xuất được trong ảnh
                    </h2>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono text-xs text-slate-800 dark:text-slate-200">
                      {result.detectedText.map((txt, i) => (
                        <p key={i}>"{txt}"</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Details List */}
                {result.details && result.details.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Chi tiết quan sát
                    </h2>
                    <ul className="space-y-2 text-sm text-slate-800 dark:text-slate-200">
                      {result.details.map((det, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0"></span>
                          <span>{det}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Safety Grounding Note */}
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-[11px] text-slate-500 dark:text-slate-400">
                  <p>
                    <strong>Lưu ý:</strong> Mô tả AI có thể chưa hoàn toàn chính xác. Không nên sử dụng Lovira như phương tiện duy nhất để đảm bảo an toàn khi di chuyển.
                  </p>
                </div>

                {/* Follow-up Q&A Form */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Hỏi thêm về bức ảnh này</span>
                  </h2>

                  {followUpAnswers.length > 0 && (
                    <div className="space-y-3">
                      {followUpAnswers.map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/80 space-y-1.5 text-xs">
                          <p className="font-bold text-indigo-900 dark:text-indigo-200">Hỏi: {item.q}</p>
                          <p className="text-slate-700 dark:text-slate-300">Đáp: {item.a}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleFollowUp} className="flex gap-2">
                    <input
                      type="text"
                      value={followUpQuestion}
                      onChange={(e) => setFollowUpQuestion(e.target.value)}
                      placeholder="Ví dụ: Bảng phía trước ghi chữ gì? Có cầu thang không?..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={followUpLoading || !followUpQuestion.trim()}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
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

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => {
          setSelectedImage(dataUrl);
          setResult(null);
          setFollowUpAnswers([]);
          runVisionAnalysis(dataUrl, visionMode);
        }}
      />
    </div>
  );
};
