import React, { useState } from 'react';
import {
  Type,
  Contrast,
  Volume2,
  Shield,
  Key,
  RotateCcw,
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Cài đặt & Trợ năng</h2>
          <p className="text-sm text-text-secondary mt-1">Tùy chỉnh giao diện, cỡ chữ, giọng đọc và quyền riêng tư để Lovira phục vụ bạn tốt nhất.</p>
        </div>

        <button
          onClick={handleResetSettings}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-text-primary hover:bg-surface-subtle flex items-center gap-1.5 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Khôi phục mặc định
        </button>
      </div>

      {/* 1. Visual & Font Display Settings */}
      <section className="bg-surface border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-6">
        <h3 className="text-base font-bold text-text-primary flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Type className="w-5 h-5 text-primary shrink-0" /> Hiển thị & Cỡ chữ
        </h3>

        {/* Theme Mode Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-text-secondary">Chủ đề giao diện:</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: 'light' })}
              className={`p-3.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                settings.theme !== 'dark'
                  ? 'bg-primary-soft border-primary text-primary font-bold'
                  : 'bg-surface border-slate-200 dark:border-slate-800 text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
              <span>Giao diện Sáng (Light)</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: 'dark' })}
              className={`p-3.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                settings.theme === 'dark'
                  ? 'bg-primary-soft border-primary text-primary font-bold'
                  : 'bg-surface border-slate-200 dark:border-slate-800 text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shrink-0"></span>
              <span>Giao diện Tối (Dark)</span>
            </button>
          </div>
        </div>

        {/* Font Scale Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-text-secondary">Cỡ chữ hiển thị:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                className={`p-3 rounded-xl border font-semibold text-xs text-center transition-all ${
                  settings.fontScale === item.scale
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface border-slate-200 dark:border-slate-800 text-text-secondary hover:text-text-primary'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* High Contrast Mode */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-slate-100 dark:border-slate-800">
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Contrast className="w-4 h-4 text-amber-500" /> Chế độ tương phản cao (High Contrast)
            </span>
            <p className="text-xs text-text-secondary">Tăng đường viền và màu nền đậm giúp đọc dễ dàng hơn.</p>
          </div>

          <button
            type="button"
            onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
              settings.highContrast ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.highContrast ? 'translate-x-5' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-slate-100 dark:border-slate-800">
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500" /> Giảm chuyển động (Reduced Motion)
            </span>
            <p className="text-xs text-text-secondary">Tắt hiệu ứng chuyển động phức tạp.</p>
          </div>

          <button
            type="button"
            onClick={() => onUpdateSettings({ reducedMotion: !settings.reducedMotion })}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
              settings.reducedMotion ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.reducedMotion ? 'translate-x-5' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>
      </section>

      {/* 2. Audio & Speech Settings */}
      <section className="bg-surface border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-6">
        <h3 className="text-base font-bold text-text-primary flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Volume2 className="w-5 h-5 text-primary shrink-0" /> Âm thanh & Tốc độ đọc
        </h3>

        {/* Speech Rate Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="speech-rate" className="text-xs font-semibold text-text-secondary">
              Tốc độ giọng đọc thành tiếng:
            </label>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-surface-subtle text-text-primary">
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
            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] text-text-secondary">
            <span>Chậm (0.75x)</span>
            <span>Chuẩn (1.0x)</span>
            <span>Nhanh (1.5x)</span>
          </div>
        </div>
      </section>

      {/* 3. API Key & Security */}
      <section className="bg-surface border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-text-primary flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Key className="w-5 h-5 text-primary shrink-0" /> Khóa API Gemini
        </h3>

        <div className="p-3.5 rounded-xl bg-surface-subtle text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-text-primary">
            <Shield className="w-4 h-4 text-emerald-500" /> Mặc định: Máy chủ server-side an toàn
          </div>
          <p className="text-text-secondary">
            Lovira đã tích hợp Gemini API trực tiếp trên server proxy. Để trống trừ khi bạn muốn dùng khóa Gemini riêng.
          </p>
        </div>

        <form onSubmit={handleSaveApiKey} className="space-y-3">
          <div className="flex gap-2">
            <input
              id="custom-api-key"
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Nhập khóa API cá nhân (tùy chọn)..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface text-xs text-text-primary focus:border-primary"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-hover"
            >
              {keySaved ? 'Đã lưu!' : 'Lưu'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
