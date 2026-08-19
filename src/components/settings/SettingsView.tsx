import React, { useState, useEffect } from 'react';
import {
  Type,
  Contrast,
  Volume2,
  Shield,
  Key,
  RotateCcw,
  Eye,
  Play,
  Square,
  Mic,
  UserCheck,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { AccessibilitySettings, UserProfile } from '../../types';
import { DEFAULT_ACCESSIBILITY_SETTINGS } from '../../constants';
import { speakText, stopSpeaking, getAvailableVietnameseVoices } from '../../lib/speech';
import { linkGoogleAccount } from '../../lib/firebase';

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
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [linkingMsg, setLinkingMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    setLinkingMsg(null);
    try {
      const res = await linkGoogleAccount();
      if (res.success) {
        setLinkingMsg({
          type: 'success',
          text: res.message || 'Đã liên kết thành công tài khoản Google! Lịch sử và cài đặt của bạn sẽ tự động lưu lại.',
        });
      } else {
        setLinkingMsg({
          type: 'error',
          text: res.message || 'Chưa thể liên kết tài khoản Google.',
        });
      }
    } catch (err: any) {
      setLinkingMsg({
        type: 'error',
        text: err.message || 'Xảy ra lỗi khi liên kết Google.',
      });
    } finally {
      setLinkingGoogle(false);
    }
  };

  useEffect(() => {
    const updateVoices = () => {
      const voices = getAvailableVietnameseVoices();
      setSystemVoices(voices);
    };
    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const handleTestVoice = (variant?: string, voiceURI?: string) => {
    if (isPlayingTest) {
      stopSpeaking();
      setIsPlayingTest(false);
      return;
    }

    setIsPlayingTest(true);
    const testText = 'Xin chào! Tôi là trợ lý ảo Lovira, sẵn sàng đồng hành và hỗ trợ bạn tiếp cận thông tin mỗi ngày.';
    speakText(testText, {
      rate: settings.speechRate,
      voiceVariant: variant || settings.voiceVariant || 'female1',
      voiceURI: voiceURI !== undefined ? voiceURI : settings.voiceURI,
      onEnd: () => setIsPlayingTest(false),
      onError: () => setIsPlayingTest(false),
    });
  };

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

        {/* Large Controls Mode */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-slate-100 dark:border-slate-800">
          <div className="space-y-0.5">
            <span className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" /> Nút lớn & Vùng bấm rộng (Large Controls)
            </span>
            <p className="text-xs text-text-secondary">Tăng kích thước nút bấm, ô nhập và vùng chạm lên tối thiểu 48px cho trợ năng.</p>
          </div>

          <button
            type="button"
            onClick={() => onUpdateSettings({ largeControls: !settings.largeControls })}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
              settings.largeControls ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.largeControls ? 'translate-x-5' : 'translate-x-0'
              }`}
            ></div>
          </button>
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
          <Volume2 className="w-5 h-5 text-primary shrink-0" /> Giọng đọc & Âm thanh (TTS)
        </h3>

        {/* Vietnamese Voice Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-text-secondary">
              Chọn giọng đọc tiếng Việt:
            </label>
            <button
              type="button"
              onClick={() => handleTestVoice()}
              className="px-3 py-1.5 rounded-lg bg-primary-soft text-primary font-bold text-xs hover:bg-primary/20 flex items-center gap-1.5 transition-all"
            >
              {isPlayingTest ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" /> Dừng nghe
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Nghe thử giọng
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'female1',
                name: 'Giọng Nữ 1 (Chuẩn)',
                desc: 'Giọng nữ nhẹ nhàng, truyền cảm',
                badge: 'Tự nhiên',
              },
              {
                id: 'male1',
                name: 'Giọng Nam (Trầm)',
                desc: 'Giọng nam ấm áp, rõ ràng',
                badge: 'Trầm ấm',
              },
              {
                id: 'female2',
                name: 'Giọng Nữ 2 (Trong)',
                desc: 'Giọng nữ tươi sáng, độ cao lớn',
                badge: 'Trong trẻo',
              },
            ].map((v) => {
              const isSelected = (settings.voiceVariant || 'female1') === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    onUpdateSettings({ voiceVariant: v.id, voiceURI: '' });
                    if (isPlayingTest) stopSpeaking();
                    handleTestVoice(v.id, '');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-primary-soft border-primary text-primary shadow-xs'
                      : 'bg-surface border-slate-200 dark:border-slate-800 text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-xs text-text-primary flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-primary" /> {v.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-text-secondary">
                        {v.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-snug">{v.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Device Hardware Voices Dropdown if system has specific Vietnamese voices */}
          {systemVoices.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <label htmlFor="system-voice-select" className="block text-[11px] font-semibold text-text-secondary">
                Hoặc chọn giọng từ hệ thống thiết bị của bạn ({systemVoices.length} giọng có sẵn):
              </label>
              <select
                id="system-voice-select"
                value={settings.voiceURI || ''}
                onChange={(e) => {
                  const uri = e.target.value;
                  onUpdateSettings({ voiceURI: uri });
                  if (isPlayingTest) stopSpeaking();
                  handleTestVoice(undefined, uri);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface text-xs text-text-primary focus:border-primary"
              >
                <option value="">-- Dùng cài đặt giọng Lovira (Khuyên dùng) --</option>
                {systemVoices.map((sv) => (
                  <option key={sv.voiceURI} value={sv.voiceURI}>
                    {sv.name} ({sv.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Speech Rate Slider */}
        <div className="space-y-3 pt-2">
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

      {/* 4. Google Account & Cloud Sync */}
      <section className="bg-surface border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-text-primary flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <UserCheck className="w-5 h-5 text-primary shrink-0" /> Tài khoản & Đồng bộ
        </h3>

        <div className="p-4 rounded-xl bg-surface-subtle border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-text-primary">
                {userProfile?.email ? userProfile.email : 'Tài khoản Khách (Ẩn danh)'}
              </span>
              {userProfile?.email ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Đã liên kết Google
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-text-secondary text-[10px] font-semibold">
                  Tạm thời
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary">
              {userProfile?.email
                ? 'Lịch sử xử lý và các cài đặt trợ năng của bạn được bảo vệ an toàn trên đám mây.'
                : 'Liên kết với Google để lưu giữ lịch sử và truy cập từ bất kỳ thiết bị nào.'}
            </p>
          </div>

          {!userProfile?.email && (
            <button
              type="button"
              onClick={handleLinkGoogle}
              disabled={linkingGoogle}
              className="px-4 py-2.5 rounded-xl bg-surface border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-text-primary text-xs font-bold flex items-center justify-center gap-2 shrink-0 transition-colors"
            >
              <Globe className="w-4 h-4 text-primary" />
              <span>{linkingGoogle ? 'Đang liên kết...' : 'Liên kết tài khoản Google'}</span>
            </button>
          )}
        </div>

        {linkingMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold ${
              linkingMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900'
            }`}
          >
            {linkingMsg.text}
          </div>
        )}
      </section>
    </div>
  );
};
