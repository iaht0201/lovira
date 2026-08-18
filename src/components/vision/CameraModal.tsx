import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';
import { stopMediaStream } from '../../lib/speech';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setPermissionError(null);
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      setPermissionError('Lovira chưa được phép sử dụng camera. Bạn có thể cấp quyền hoặc tải ảnh từ thiết bị.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    }
  };

  const handleTakeSnap = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 select-none"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
          <h2 id="camera-modal-title" className="text-lg font-bold flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            <span>Mở camera Lovira</span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng camera"
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Stage */}
        <div className="relative bg-black flex-1 min-h-[320px] flex items-center justify-center overflow-hidden">
          {permissionError ? (
            <div className="p-6 text-center text-slate-300 space-y-3">
              <p className="text-sm font-medium text-amber-300">{permissionError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700"
              >
                Thử lại cấp quyền
              </button>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Ảnh đã chụp" className="max-h-[60vh] w-auto object-contain" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover max-h-[60vh]"
            ></video>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-around gap-4 bg-slate-900">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 text-slate-200 hover:bg-slate-700 font-medium text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Chụp lại</span>
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30"
              >
                <Check className="w-5 h-5" />
                <span>Sử dụng ảnh này</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleTakeSnap}
              disabled={Boolean(permissionError)}
              className="w-16 h-16 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-2xl active:scale-95 transition-transform disabled:opacity-50"
              aria-label="Chụp hình"
            >
              <div className="w-12 h-12 rounded-full border-4 border-indigo-600"></div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
