import React, { useState } from 'react';
import {
  Settings,
  Type,
  Sun,
  Moon,
  Contrast,
  Zap,
  Mic,
  Volume2,
  HandMetal,
  User,
  Check,
  AlertCircle,
  ExternalLink,
  Touchpad,
  MousePointerClick,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { AccessibilitySettings, UserProfile, FontScale } from '../../types';
import { linkGoogleAccount } from '../../lib/firebase';
import { speakText } from '../../lib/speech';

interface SettingsViewProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  userProfile,
  setUserProfile,
}) => {
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [linkMsg, setLinkMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fontScales: Array<{ value: FontScale; label: string }> = [
    { value: '100', label: '100% (Chuẩn)' },
    { value: '125', label: '125% (Lớn)' },
    { value: '150', label: '150% (Rất lớn)' },
    { value: '175', label: '175% (Tối đa)' },
  ];

  const speechRates = [
    { value: 0.8, label: '0.8x (Chậm)' },
    { value: 1.0, label: '1.0x (Chuẩn)' },
    { value: 1.2, label: '1.2x (Nhanh)' },
  ];

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    setLinkMsg(null);
    try {
      const updated = await linkGoogleAccount();
      if (updated) {
        setUserProfile(updated);
        setLinkMsg({ type: 'success', text: 'Đã liên kết tài khoản Google thành công!' });
      }
    } catch (err: any) {
      setLinkMsg({ type: 'error', text: err.message || 'Không thể liên kết tài khoản Google.' });
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleTestSpeech = () => {
    speakText('Xin chào! Lovira là trợ lý AI nhân văn hỗ trợ nhìn, nghe, đọc và hiểu cho bạn.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Cài đặt & Trợ năng</h1>
        <p className="text-sm text-text-secondary mt-1">
          Tùy chỉnh giao diện, cử chỉ chạm đúp, giọng đọc, điều khiển giọng nói và các chế độ hỗ trợ theo nhu cầu cá nhân.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="bg-surface rounded-3xl border border-border p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
            {userProfile?.displayName?.charAt(0).toUpperCase() || 'K'}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base text-text-primary">
              {userProfile?.displayName || 'Khách Lovira'}
            </h2>
            <p className="text-xs text-text-secondary">
              {userProfile?.isAnonymous ? 'Phiên ẩn danh bảo mật' : userProfile?.email || 'Tài khoản đã đồng bộ'}
            </p>
          </div>
        </div>

        {userProfile?.isAnonymous && (
          <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-text-secondary">
              Liên kết tài khoản Google để lưu lịch sử vĩnh viễn trên nhiều thiết bị.
            </p>
            <button
              onClick={handleLinkGoogle}
              disabled={isLinkingGoogle}
              className="px-4 py-2 rounded-xl bg-surface-subtle border border-border hover:bg-surface text-xs font-semibold text-text-primary flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4 text-primary" />
              <span>{isLinkingGoogle ? 'Đang liên kết…' : 'Đăng nhập Google'}</span>
            </button>
          </div>
        )}

        {linkMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              linkMsg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-500/10 text-red-700 dark:text-red-300'
            }`}
          >
            {linkMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{linkMsg.text}</span>
          </div>
        )}
      </div>

      {/* 1. Phím tắt cử chỉ & Điều khiển giọng nói (Voice Access & Touch Shortcuts) */}
      <section className="space-y-4" id="voice-action-settings">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Mic className="w-5 h-5 text-red-500" />
          <span>Điều khiển giọng nói & Phím tắt chạm đúp</span>
        </h2>

        <div className="bg-surface rounded-3xl border border-border p-6 shadow-xs space-y-4">
          {/* Chạm đúp 2 lần (Double-Tap Shortcut) */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-border">
            <div className="space-y-1 pr-4">
              <div className="font-bold text-sm text-text-primary flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-red-500" />
                <span>Chạm đúp 2 lần mở Mic (Voice Shortcut)</span>
              </div>
              <div className="text-xs text-text-secondary">
                Chạm nhanh 2 lần vào bất kỳ khoảng trống nào trên màn hình để bật hoặc tắt chế độ nghe lệnh giọng nói tức thì (rất thuận tiện cho người khiếm thị).
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateSettings({ doubleTapShortcutEnabled: !settings.doubleTapShortcutEnabled })
              }
              className={`w-12 h-7 rounded-full transition-colors relative p-1 shrink-0 ${
                settings.doubleTapShortcutEnabled ? 'bg-red-500' : 'bg-border'
              }`}
              aria-label="Bật tắt phím tắt chạm đúp 2 lần vào màn hình"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.doubleTapShortcutEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Điều khiển bằng giọng nói (Voice Access) */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-border">
            <div className="space-y-1 pr-4">
              <div className="font-bold text-sm text-text-primary flex items-center gap-2">
                <Mic className="w-4 h-4 text-red-500" />
                <span>Kích hoạt điều khiển giọng nói (Voice Access)</span>
              </div>
              <div className="text-xs text-text-secondary">
                Điều hướng toàn bộ ứng dụng bằng khẩu lệnh tiếng Việt như: &quot;Mở camera&quot;, &quot;Đọc to&quot;, &quot;Giải thích đơn giản&quot;, &quot;Quay lại&quot;.
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateSettings({ voiceAccessEnabled: !settings.voiceAccessEnabled })
              }
              className={`w-12 h-7 rounded-full transition-colors relative p-1 shrink-0 ${
                settings.voiceAccessEnabled ? 'bg-red-500' : 'bg-border'
              }`}
              aria-label="Bật tắt điều khiển bằng giọng nói"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.voiceAccessEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Phản hồi âm thanh chỉ dẫn (Spoken Feedback) */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-border">
            <div className="space-y-1 pr-4">
              <div className="font-bold text-sm text-text-primary">Phản hồi giọng nói khi thực thi lệnh</div>
              <div className="text-xs text-text-secondary">
                Trợ lý sẽ phát âm thanh xác nhận bằng tiếng Việt khi nhận lệnh hoặc chuyển trang.
              </div>
            </div>
            <button
              onClick={() =>
                onUpdateSettings({ spokenFeedbackEnabled: !settings.spokenFeedbackEnabled })
              }
              className={`w-12 h-7 rounded-full transition-colors relative p-1 shrink-0 ${
                settings.spokenFeedbackEnabled ? 'bg-red-500' : 'bg-border'
              }`}
              aria-label="Bật tắt phản hồi giọng nói"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.spokenFeedbackEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Thị giác & Hiển thị */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Type className="w-5 h-5 text-primary" />
          <span>Thị giác & Hiển thị</span>
        </h2>

        <div className="bg-surface rounded-3xl border border-border p-6 shadow-xs space-y-6">
          {/* Cỡ chữ */}
          <div className="space-y-3">
            <label className="font-bold text-sm text-text-primary block">
              Tỷ lệ phóng to cỡ chữ (Font Scaling)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {fontScales.map((fs) => (
                <button
                  key={fs.value}
                  onClick={() => onUpdateSettings({ fontScale: fs.value })}
                  className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-semibold border transition-all text-center ${
                    settings.fontScale === fs.value
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-subtle text-text-primary border-border hover:bg-surface'
                  }`}
                >
                  {fs.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dark Mode */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-border">
              <div className="space-y-0.5 pr-2">
                <div className="font-bold text-sm text-text-primary">Giao diện tối (Dark Mode)</div>
                <div className="text-xs text-text-secondary">Giảm chói mắt trong môi trường tối</div>
              </div>
              <button
                onClick={() => onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
                className={`w-12 h-7 rounded-full transition-colors relative p-1 shrink-0 ${
                  settings.theme === 'dark' ? 'bg-primary' : 'bg-border'
                }`}
                aria-label="Bật tắt chế độ tối"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-border">
              <div className="space-y-0.5 pr-2">
                <div className="font-bold text-sm text-text-primary">Độ tương phản cao</div>
                <div className="text-xs text-text-secondary">Tăng độ nét đường viền và chữ viết</div>
              </div>
              <button
                onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
                className={`w-12 h-7 rounded-full transition-colors relative p-1 shrink-0 ${
                  settings.highContrast ? 'bg-primary' : 'bg-border'
                }`}
                aria-label="Bật tắt độ tương phản cao"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.highContrast ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Thao tác & Vận động (Motor Accessibility) */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <span>Thao tác & Vận động</span>
        </h2>

        <div className="bg-surface rounded-3xl border border-border p-6 shadow-xs space-y-4">
          {/* Nút bấm lớn */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-border">
            <div className="space-y-1 pr-4">
              <div className="font-bold text-sm text-text-primary">Nút bấm & Điều khiển kích thước lớn</div>
              <div className="text-xs text-text-secondary">
                Tăng kích thước các nút bấm và khu vực cảm ứng tối thiểu 48px - 56px giúp bấm dễ dàng hơn.
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ largeControls: !settings.largeControls })}
              className={`w-12 h-7 rounded-full transition-colors relative p-1 shrink-0 ${
                settings.largeControls ? 'bg-amber-500' : 'bg-border'
              }`}
              aria-label="Bật tắt nút bấm lớn"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.largeControls ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Giảm chuyển động */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-border">
            <div className="space-y-1 pr-4">
              <div className="font-bold text-sm text-text-primary">Giảm chuyển động (Reduced Motion)</div>
              <div className="text-xs text-text-secondary">
                Tắt các hoạt ảnh lướt trang và hiệu ứng động để giảm mỏi mắt và chóng mặt.
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ reducedMotion: !settings.reducedMotion })}
              className={`w-12 h-7 rounded-full transition-colors relative p-1 shrink-0 ${
                settings.reducedMotion ? 'bg-amber-500' : 'bg-border'
              }`}
              aria-label="Bật tắt giảm chuyển động"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.reducedMotion ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Thính giác & Giọng đọc */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-teal-600" />
          <span>Thính giác & Giọng đọc</span>
        </h2>

        <div className="bg-surface rounded-3xl border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-border">
            <div className="space-y-0.5 pr-4">
              <div className="font-bold text-sm text-text-primary">Tự động đọc to phản hồi</div>
              <div className="text-xs text-text-secondary">Đọc tóm tắt ngay khi AI hoàn thành phân tích</div>
            </div>
            <button
              onClick={() => onUpdateSettings({ autoReadResponses: !settings.autoReadResponses })}
              className={`w-12 h-7 rounded-full transition-colors relative p-1 shrink-0 ${
                settings.autoReadResponses ? 'bg-teal-600' : 'bg-border'
              }`}
              aria-label="Bật tắt tự động đọc to phản hồi"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.autoReadResponses ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Tốc độ đọc */}
          <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-2">
            <div className="font-bold text-sm text-text-primary">Tốc độ đọc giọng nói (Speech Rate)</div>
            <div className="grid grid-cols-3 gap-2">
              {speechRates.map((sr) => (
                <button
                  key={sr.value}
                  onClick={() => onUpdateSettings({ speechRate: sr.value })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    settings.speechRate === sr.value
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-surface text-text-primary border-border hover:bg-surface-subtle'
                  }`}
                >
                  {sr.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-border">
            <div className="space-y-0.5">
              <div className="font-bold text-sm text-text-primary">Kiểm tra âm thanh phát thử</div>
              <div className="text-xs text-text-secondary">Thử giọng đọc tiếng Việt của thiết bị</div>
            </div>
            <button
              onClick={handleTestSpeech}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Phát thử âm</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. Ngôn ngữ ký hiệu VSL */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <HandMetal className="w-5 h-5 text-emerald-600" />
          <span>Ngôn ngữ ký hiệu VSL</span>
        </h2>

        <div className="bg-surface rounded-3xl border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-border">
            <div className="space-y-0.5 pr-4">
              <div className="font-bold text-sm text-text-primary">Bật Avatar ký hiệu VSL</div>
              <div className="text-xs text-text-secondary">Hiển thị nhân vật minh họa ngôn ngữ ký hiệu Việt Nam trực quan</div>
            </div>
            <button
              onClick={() =>
                onUpdateSettings({ vslAccessibilityEnabled: !settings.vslAccessibilityEnabled })
              }
              className={`w-12 h-7 rounded-full transition-colors relative p-1 shrink-0 ${
                settings.vslAccessibilityEnabled ? 'bg-emerald-600' : 'bg-border'
              }`}
              aria-label="Bật tắt avatar ngôn ngữ ký hiệu"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.vslAccessibilityEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Công nghệ AI & Nhà cung cấp */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span>Mô hình AI ưu tiên</span>
        </h2>

        <div className="bg-surface rounded-3xl border border-border p-6 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onUpdateSettings({ preferredAIProvider: 'groq' })}
              className={`p-4 rounded-2xl border text-left transition-all space-y-1 ${
                settings.preferredAIProvider === 'groq'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/20 shadow-xs'
                  : 'border-border bg-surface-subtle hover:bg-surface'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-text-primary">Groq LLaMA 3.3</span>
                {settings.preferredAIProvider === 'groq' && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                    Đang chọn
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary">
                Tốc độ siêu nhanh (~0.4s), phản hồi tức thì cho giọng nói và hỗ trợ đọc hiểu nhanh.
              </p>
            </button>

            <button
              onClick={() => onUpdateSettings({ preferredAIProvider: 'gemini' })}
              className={`p-4 rounded-2xl border text-left transition-all space-y-1 ${
                settings.preferredAIProvider === 'gemini'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/20 shadow-xs'
                  : 'border-border bg-surface-subtle hover:bg-surface'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-text-primary">Google Gemini 2.5 Flash</span>
                {settings.preferredAIProvider === 'gemini' && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                    Đang chọn
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary">
                Hiểu thị giác đa phương thức sâu sắc, phân tích tài liệu phức tạp và ngôn cảnh phong phú.
              </p>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
