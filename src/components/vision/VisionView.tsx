import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  Layers,
  FileText,
  Bookmark,
  Eye,
  SwitchCamera,
} from 'lucide-react';
import { AccessibilitySettings, UserProfile, VisionResult } from '../../types';
import { speakText, stopSpeaking } from '../../lib/speech';
import { vslAccessibilityService } from '../../services/vslAccessibilityService';
import { saveActivityToFirestore, auth } from '../../lib/firebase';
import { useScreenActionContext } from '../voice-access/ScreenActionRegistry';

interface VisionViewProps {
  userProfile: UserProfile | null;
  settings: AccessibilitySettings;
  initialAction?: 'camera';
}

type VisionMode = 'scene' | 'text' | 'object' | 'quick';

export const VisionView: React.FC<VisionViewProps> = ({
  userProfile,
  settings,
  initialAction,
}) => {
  const [mode, setMode] = useState<VisionMode>('scene');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { registerAction, setCurrentScreenInfo } = useScreenActionContext();

  useEffect(() => {
    setCurrentScreenInfo({
      screenId: 'vision',
      title: 'Nhìn giúp tôi',
      description: 'Phân tích hình ảnh, đọc chữ và nhận diện vật thể',
    });
  }, [setCurrentScreenInfo]);

  // Handle Initial Action from Route (e.g. ?action=camera)
  useEffect(() => {
    if (initialAction === 'camera') {
      startCamera();
    }
  }, [initialAction]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopSpeaking();
    };
  }, []);

  const startCamera = async (facing: 'environment' | 'user' = facingMode) => {
    setErrorMsg(null);
    try {
      if (streamRef.current) {
        stopCamera();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setFacingMode(facing);
    } catch (err: any) {
      console.error('Camera error:', err);
      setErrorMsg('Không thể mở camera. Vui lòng cho phép quyền truy cập máy ảnh hoặc tải ảnh lên từ thiết bị.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const toggleFacingMode = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(next);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImageSrc(dataUrl);
      stopCamera();
      analyzeImage(dataUrl, mode);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setImageSrc(dataUrl);
        analyzeImage(dataUrl, mode);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64: string, selectedMode: VisionMode) => {
    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);
    setSaved(false);

    try {
      const token = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-lovira-client': 'web-app',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/gemini/vision', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageBase64: base64,
          mode: selectedMode,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Lỗi khi phân tích hình ảnh.');
      }

      const resData = json.data as VisionResult;
      setResult(resData);

      // Auto-read response if enabled
      if (settings.autoReadResponses && resData.summary) {
        handleReadText(resData.summary);
      }

      // Present to VSL Avatar if enabled
      if (settings.vslAccessibilityEnabled && resData.summary) {
        vslAccessibilityService.presentSignResponse(resData.summary, 'life-agent');
      }

      // Save to Firebase
      if (userProfile?.uid) {
        saveActivityToFirestore(userProfile.uid, {
          type: 'vision',
          title: 'Nhìn giúp tôi: ' + (resData.summary ? resData.summary.slice(0, 40) + '...' : 'Phân tích ảnh'),
          preview: resData.summary,
          data: resData,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể phân tích ảnh lúc này. Vui lòng thử lại.');
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Register screen actions for voice assistant
  useEffect(() => {
    const unregCamera = registerAction({
      id: 'vision.openCamera',
      label: 'Mở máy ảnh',
      aliases: ['bật camera', 'mở camera'],
      execute: () => startCamera(),
    });

    const unregCapture = registerAction({
      id: 'vision.capture',
      label: 'Chụp ảnh',
      aliases: ['chụp', 'bấm chụp'],
      execute: () => capturePhoto(),
    });

    const unregReadText = registerAction({
      id: 'vision.readText',
      label: 'Đọc chữ trong ảnh',
      aliases: ['đọc chữ', 'đọc văn bản trong ảnh'],
      execute: () => {
        if (result?.detectedText?.length) {
          handleReadText(result.detectedText.join('. '));
        } else if (result?.summary) {
          handleReadText(result.summary);
        }
      },
    });

    return () => {
      unregCamera();
      unregCapture();
      unregReadText();
    };
  }, [registerAction, result, isCameraActive]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Nhìn giúp tôi</h1>
          <p className="text-sm text-text-secondary">
            Phân tích hình ảnh, đọc chữ và phát hiện mối nguy hiểm xung quanh.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-surface rounded-2xl border border-border">
          {[
            { id: 'scene', label: 'Toàn cảnh' },
            { id: 'text', label: 'Đọc chữ' },
            { id: 'object', label: 'Vật thể' },
            { id: 'quick', label: 'Tóm tắt' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id as VisionMode);
                if (imageSrc) analyzeImage(imageSrc, m.id as VisionMode);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mode === m.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Camera / Upload Viewport */}
      <div className="bg-surface rounded-3xl border border-border p-4 sm:p-6 shadow-xs space-y-4">
        {isCameraActive ? (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-[480px] flex items-center justify-center">
            <video ref={videoRef} playsInline autoPlay className="w-full h-full object-contain" />
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 z-10 px-4">
              <button
                onClick={toggleFacingMode}
                className="p-3.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
                title="Đổi camera trước/sau"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
              <button
                onClick={capturePhoto}
                className="px-8 py-3.5 rounded-full bg-primary hover:bg-primary-hover text-white font-bold text-base shadow-lg transition-transform active:scale-95 flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                <span>Chụp & Phân tích</span>
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-3.5 rounded-full bg-black/60 text-white backdrop-blur-md text-sm font-semibold hover:bg-black/80"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : imageSrc ? (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 border border-border max-h-[380px] flex items-center justify-center">
              <img
                src={imageSrc}
                alt="Ảnh đang phân tích"
                className="max-h-[380px] w-auto object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => startCamera()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-subtle border border-border text-xs sm:text-sm font-medium hover:bg-surface"
              >
                <Camera className="w-4 h-4" />
                <span>Chụp ảnh khác</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-subtle border border-border text-xs sm:text-sm font-medium hover:bg-surface"
              >
                <Upload className="w-4 h-4" />
                <span>Tải ảnh khác</span>
              </button>
              <button
                onClick={() => analyzeImage(imageSrc, mode)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary-hover"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Phân tích lại</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-2xl p-8 sm:p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center font-bold">
              <Eye className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-text-primary">Chụp ảnh hoặc tải lên hình ảnh</div>
              <p className="text-sm text-text-secondary max-w-md mx-auto">
                Chụp ảnh biển hiệu, sách báo, đồ vật xung quanh hoặc tải ảnh từ thư viện thiết bị.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => startCamera()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-xs"
              >
                <Camera className="w-4 h-4" />
                <span>Bật máy ảnh</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-subtle hover:bg-surface border border-border text-text-primary font-medium text-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Chọn ảnh từ máy</span>
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 rounded-3xl bg-surface border border-border text-center space-y-3">
          <Sparkles className="w-8 h-8 text-primary mx-auto animate-spin" />
          <div className="font-bold text-base text-text-primary">Lovira đang phân tích hình ảnh…</div>
          <div className="text-xs text-text-secondary">Đang nhận diện chữ, đối tượng và lưu ý an toàn</div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 flex items-start gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {/* Analysis Result Presentation */}
      {result && (
        <div className="bg-surface rounded-3xl border border-border p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Summary Box */}
          <div className="space-y-2 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Tóm tắt quan sát
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleReadText(result.summary)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-subtle border border-border hover:bg-surface text-text-primary"
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isSpeaking ? 'Dừng đọc' : 'Đọc'}</span>
                </button>
                <button
                  onClick={() => handleCopy(result.summary)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-subtle border border-border hover:bg-surface text-text-primary"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã chép' : 'Chép'}</span>
                </button>
              </div>
            </div>
            <p className="text-lg font-semibold text-text-primary leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* Hazards Warning (If any) */}
          {result.possibleHazards && result.possibleHazards.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Lưu ý chướng ngại vật & an toàn</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm pl-1">
                {result.possibleHazards.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Detected Text in Image (OCR) */}
          {result.detectedText && result.detectedText.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Chữ đọc được trong ảnh ({result.detectedText.length})</span>
                </h3>
                <button
                  onClick={() => handleReadText(result.detectedText.join('. '))}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Đọc toàn bộ chữ
                </button>
              </div>
              <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-2">
                {result.detectedText.map((t, idx) => (
                  <div key={idx} className="text-sm text-text-primary leading-relaxed flex items-start justify-between gap-2 border-b border-border/50 last:border-0 pb-1.5 last:pb-0">
                    <span>{t}</span>
                    <button
                      onClick={() => handleCopy(t)}
                      className="text-xs text-text-secondary hover:text-text-primary p-1"
                      title="Chép dòng này"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Objects Detected */}
          {result.objects && result.objects.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>Vật thể nhận diện được</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.objects.map((obj, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-1">
                    <div className="font-semibold text-sm text-text-primary">{obj.name}</div>
                    {obj.description && <div className="text-xs text-text-secondary">{obj.description}</div>}
                    {obj.position && <div className="text-[11px] text-primary font-medium">{obj.position}</div>}
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
