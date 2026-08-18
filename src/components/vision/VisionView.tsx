import React, { useState, useEffect } from 'react';
import {
  Camera,
  ImagePlus,
  AlertTriangle,
  Volume2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { CameraModal } from './CameraModal';
import { ReadAloudButton } from '../common/ReadAloudButton';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { VisionResult, UserProfile, AccessibilitySettings } from '../../types';
import { analyzeVision } from '../../services/api';
import { saveActivityHistory } from '../../lib/firebase';
import { compressImageBase64 } from '../../lib/imageUtils';

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
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP).');
      return;
    }

    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setError('Dung lượng ảnh vượt quá giới hạn 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const rawBase64 = reader.result as string;
      const compressed = await compressImageBase64(rawBase64, 1280, 0.8);
      setSelectedImage(compressed);
      setResult(null);
      setFollowUpAnswers([]);
      setError(null);
      runVisionAnalysis(compressed, visionMode);
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
      const compressedImg = await compressImageBase64(base64Img, 1280, 0.8);
      const data = await analyzeVision(
        compressedImg,
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
          documentText: `Thôn tin phân tích ảnh: ${JSON.stringify(result)}`,
          question: q,
          customApiKey: localStorage.getItem('lovira_custom_gemini_key') || undefined,
        }),
      });
      const data = await res.json();
      const answer = data.answer || 'Tôi chưa tìm thấy thông tin này trong ảnh.';
      setFollowUpAnswers((prev) => [...prev, { q, a: answer }]);
    } catch (err) {
      console.error('Followup error:', err);
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = `[Mô tả từ Lovira]\n${result.summary}\n\n[Chi tiết]\n${result.details.join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Nhìn giúp tôi</h2>
        <p className="text-sm text-text-secondary mt-1">Chụp hoặc tải ảnh để Lovira mô tả khung cảnh và đọc văn bản trong ảnh.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls & Dropzone (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Mode Selection */}
          <div className="bg-surface border border-slate-200 dark:border-slate-800 p-2 rounded-xl grid grid-cols-2 gap-1.5">
            {[
              { id: 'scene', label: 'Mô tả cảnh' },
              { id: 'text', label: 'Đọc văn bản' },
              { id: 'object', label: 'Vật thể' },
              { id: 'quick', label: 'Tóm tắt nhanh' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id as any)}
                className={`py-2 px-3 rounded-lg font-bold text-xs transition-colors ${
                  visionMode === m.id
                    ? 'bg-primary-soft text-primary font-bold'
                    : 'text-text-secondary hover:text-text-primary font-semibold'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Upload Dropzone / Preview */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="bg-surface border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center flex flex-col items-center justify-center min-h-[300px] space-y-4"
          >
            {selectedImage ? (
              <div className="space-y-3 w-full">
                <div className="relative rounded-xl overflow-hidden bg-black max-h-[260px] flex items-center justify-center">
                  <img src={selectedImage} alt="Xem trước" className="max-h-[250px] w-auto object-contain" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setResult(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-text-primary hover:bg-surface-subtle flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Chọn ảnh khác
                  </button>
                  <button
                    onClick={() => runVisionAnalysis(selectedImage, visionMode)}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Phân tích lại
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center shrink-0">
                  <ImagePlus className="w-7 h-7 shrink-0" />
                </div>
                <div>
                  <p className="font-bold text-sm text-text-primary">Kéo thả ảnh vào đây</p>
                  <p className="text-xs text-text-secondary mt-1">JPG, PNG hoặc WEBP (Tối đa 10MB)</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <label className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-xs cursor-pointer">
                    Chọn ảnh từ máy
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
                  </label>
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-text-primary hover:bg-surface-subtle flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4 shrink-0" /> Mở Camera
                  </button>
                </div>
              </>
            )}
          </div>

          <p className="text-xs text-text-secondary leading-relaxed">
            * Lovira cam kết hình ảnh chỉ được xử lý tạm thời cho tác vụ phân tích và không lưu trữ nếu chưa có sự đồng ý.
          </p>
        </div>

        {/* Right Column: Result Workspace (7 Cols) */}
        <div className="lg:col-span-7 bg-surface border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between min-h-[500px]">
          {loading ? (
            <LoadingSpinner message="Lovira đang nhìn và phân tích hình ảnh..." />
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs space-y-2">
              <p className="font-bold">{error}</p>
              <button
                onClick={() => selectedImage && runVisionAnalysis(selectedImage, visionMode)}
                className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-semibold"
              >
                Thử lại
              </button>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Header actions */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-text-primary">Kết quả phân tích</h3>
                <div className="flex items-center gap-2">
                  <ReadAloudButton
                    text={`${result.summary}. ${result.details.join('. ')}`}
                    speechRate={settings.speechRate}
                    size="sm"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-text-primary hover:bg-surface-subtle flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {/* Structured Content Area */}
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Mô tả tổng quan</h4>
                  <p className="text-sm text-text-primary leading-relaxed bg-surface-subtle p-4 rounded-xl">
                    {result.summary}
                  </p>
                </div>

                {result.details && result.details.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Vật thể & Vị trí</h4>
                    <ul className="text-sm text-text-primary space-y-2 list-disc list-inside">
                      {result.details.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.possibleHazards && result.possibleHazards.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      <strong>Lưu ý an toàn:</strong> {result.possibleHazards.join('. ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Follow-up Question List */}
              {followUpAnswers.length > 0 && (
                <div className="space-y-2">
                  {followUpAnswers.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-surface-subtle text-xs space-y-1">
                      <p className="font-bold text-text-primary">Hỏi: {item.q}</p>
                      <p className="text-text-secondary">Đáp: {item.a}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-text-primary">Kết quả phân tích</h3>
              </div>
              <div className="p-8 text-center text-text-secondary text-sm">
                Vui lòng chụp ảnh hoặc tải ảnh lên để xem kết quả phân tích tại đây.
              </div>
            </div>
          )}

          {/* Follow-up Question Input Form */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <form onSubmit={handleFollowUp} className="flex items-center gap-2">
              <input
                type="text"
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                placeholder="Hỏi thêm về ảnh này (Ví dụ: Trên bàn có chìa khóa không?)..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface text-sm text-text-primary focus:border-primary"
              />
              <button
                type="submit"
                disabled={!selectedImage || !followUpQuestion.trim() || followUpLoading}
                className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover disabled:opacity-50"
              >
                Gửi
              </button>
            </form>
          </div>
        </div>
      </div>

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
