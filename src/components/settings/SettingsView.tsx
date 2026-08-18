import React, { useState } from 'react';
import {
  Settings,
  Type,
  Contrast,
  Volume2,
  Shield,
  Key,
  RotateCcw,
  Check,
  UserCheck,
  Eye,
  Info,
} from 'lucide-react';
import { AccessibilitySettings, UserProfile } from '../../types';
import { DEFAULT_ACCESSIBILITY_SETTINGS } from '../../constants';

interface SettingsViewProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  userProfile?: UserProfile | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  userProfile,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(
    localStorage.getItem('lovira_custom_gemini_key') || ''
  );
  const [keySaved, setKeySaved] = useState(false);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      localStorage.setItem('lovira_custom_gemini_key', apiKeyInput.trim());
    } else {
      localStorage.removeItem('lovira_custom_gemini_key');
    }
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleResetSettings = () => {
    if (window.confirm('Đặt lại tất cả cài đặt trợ năng về mặc định?')) {
      onUpdateSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Title Header */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-[#1A1A1A] dark:text-white flex items-center gap-2.5">
            <span>Cài đặt & Trợ năng</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-light">
            Tùy chỉnh giao diện, cỡ chữ, giọng đọc và quyền riêng tư để Lovira phục vụ bạn tốt nhất.
          </p>
        </div>

        <button
          onClick={handleResetSettings}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[#1A1A1A] dark:text-neutral-200 font-bold text-xs uppercase tracking-wider transition-colors shrink-0 border border-neutral-200 dark:border-neutral-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Khôi phục mặc định</span>
        </button>
      </div>

      {/* 1. Visual & Font Display Settings */}
      <section className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6">
        <h2 className="text-base font-light text-[#1A1A1A] dark:text-white flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <Type className="w-4 h-4 text-neutral-500" />
          <span>Hiển thị & Cỡ chữ</span>
        </h2>

        {/* Font Scale Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
            Cỡ chữ hiển thị:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { scale: '100', label: '100% (Chuẩn)' },
              { scale: '125', label: '125% (Lớn)' },
              { scale: '150', label: '150% (Rất lớn)' },
              { scale: '175', label: '175% (Tối đa)' },
            ].map((item) => (
              <button
                key={item.scale}
                type="button"
                onClick={() => onUpdateSettings({ fontScale: item.scale as any })}
                className={`p-3 rounded-xl border font-bold text-xs text-center transition-all ${
                  settings.fontScale === item.scale
                    ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white dark:bg-white dark:border-white dark:text-[#1A1A1A] shadow-xs'
                    : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-[#1A1A1A] dark:text-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* High Contrast Mode */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
          <div className="space-y-0.5">
            <span className="text-sm font-normal text-[#1A1A1A] dark:text-white flex items-center gap-2">
              <Contrast className="w-4 h-4 text-amber-500" />
              <span>Chế độ tương phản cao (High Contrast)</span>
            </span>
            <p className="text-xs text-neutral-400 font-light">
              Tăng đường viền và màu nền đậm giúp người khiếm thị đọc dễ dàng hơn.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              settings.highContrast ? 'bg-[#1A1A1A] dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                settings.highContrast ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
          <div className="space-y-0.5">
            <span className="text-sm font-normal text-[#1A1A1A] dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500" />
              <span>Giảm chuyển động (Reduced Motion)</span>
            </span>
            <p className="text-xs text-neutral-400 font-light">
              Tắt bớt hiệu ứng hoạt ảnh phức tạp gây xao nhãng hoặc chóng mặt.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onUpdateSettings({ reducedMotion: !settings.reducedMotion })}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              settings.reducedMotion ? 'bg-[#1A1A1A] dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                settings.reducedMotion ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>
      </section>

      {/* 2. Audio & Speech Settings */}
      <section className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6">
        <h2 className="text-base font-light text-[#1A1A1A] dark:text-white flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <Volume2 className="w-4 h-4 text-neutral-500" />
          <span>Âm thanh & Tốc độ đọc</span>
        </h2>

        {/* Speech Rate Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="speech-rate" className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Tốc độ giọng đọc thành tiếng (Speech Rate):
            </label>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#1A1A1A] dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              {settings.speechRate}x
            </span>
          </div>

          <input
            id="speech-rate"
            type="range"
            min="0.75"
            max="1.5"
            step="0.1"
            value={settings.speechRate}
            onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
            className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#1A1A1A] dark:accent-white"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 uppercase tracking-wider">
            <span>Chậm (0.75x)</span>
            <span>Bình thường (1.0x)</span>
            <span>Nhanh (1.5x)</span>
          </div>
        </div>

        {/* Auto Read Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
          <div className="space-y-0.5">
            <span className="text-sm font-normal text-[#1A1A1A] dark:text-white">
              Tự động đọc phản hồi AI (Auto Read Responses)
            </span>
            <p className="text-xs text-neutral-400 font-light">
              Đọc thành tiếng các kết quả phân tích ảnh và tóm tắt ngay khi hoàn thành.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onUpdateSettings({ autoReadResponses: !settings.autoReadResponses })}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${
              settings.autoReadResponses ? 'bg-[#1A1A1A] dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                settings.autoReadResponses ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>
      </section>

      {/* 3. API Key Override & Security */}
      <section className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-6">
        <h2 className="text-base font-light text-[#1A1A1A] dark:text-white flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <Key className="w-4 h-4 text-neutral-500" />
          <span>Khóa API Gemini (Tùy chọn)</span>
        </h2>

        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-white">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Mặc định: Sử dụng máy chủ full-stack an toàn</span>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 font-light">
            Lovira đã tích hợp sẵn Gemini API trên máy chủ server-side, bảo vệ tối đa dữ liệu của bạn. Nếu muốn dùng riêng API Key của bạn, bạn có thể nhập bên dưới.
          </p>
        </div>

        <form onSubmit={handleSaveApiKey} className="space-y-3">
          <label htmlFor="custom-api-key" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Tùy chọn khóa Gemini API riêng (mô hình AI Studio):
          </label>
          <div className="flex gap-2">
            <input
              id="custom-api-key"
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Để trống nếu muốn dùng máy chủ Lovira..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {keySaved ? 'Đã lưu!' : 'Lưu'}
            </button>
          </div>
        </form>
      </section>

      {/* 4. Account Profile & Firebase Info */}
      <section className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <h2 className="text-base font-light text-[#1A1A1A] dark:text-white flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <UserCheck className="w-4 h-4 text-neutral-500" />
          <span>Tài khoản & Lưu trữ đám mây</span>
        </h2>

        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs space-y-2">
          <p className="font-semibold text-[#1A1A1A] dark:text-neutral-200 flex items-center gap-2">
            <Info className="w-4 h-4 text-neutral-500" />
            <span>
              Trạng thái: {userProfile?.isAnonymous ? 'Phiên đăng nhập ẩn danh (Khách)' : 'Đã kết nối'}
            </span>
          </p>
          <p className="text-neutral-500 dark:text-neutral-400 font-light">
            Lịch sử và cài đặt của bạn được lưu tự động theo ID thiết bị: <code className="font-mono text-[10px] bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded">{userProfile?.uid || 'Khách'}</code>
          </p>
        </div>
      </section>
    </div>
  );
};
