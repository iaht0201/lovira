import React, { useState } from 'react';
import { VSLAvatarStick } from '../vsl-avatar/VSLAvatarStick';
import { UserProfile, AccessibilitySettings } from '../../types';
import { Sparkles, Hand, Play } from 'lucide-react';

interface VSLPlaygroundViewProps {
  userProfile?: UserProfile | null;
  settings: AccessibilitySettings;
}

export const VSLPlaygroundView: React.FC<VSLPlaygroundViewProps> = ({
  userProfile,
  settings,
}) => {
  const [text, setText] = useState('Xin chào mọi người');

  const sampleTexts = [
    'Tôi là',
    'Xin chào',
    'Tôi yêu bạn ấy',
    'Bạn yêu tôi',
    'Khám bệnh',
    'Không muốn',
    'Đăng ký',
    'Yêu nước Việt Nam',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2.5">
            <Hand className="w-6 h-6 text-primary" />
            Mô phỏng Ký hiệu VSL (Khuôn mặt Cảm xúc & 5 Ngón tay)
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Avatar hỗ trợ biểu cảm khuôn mặt sinh động (chớp mắt, cử động miệng theo lời, má hồng) kết hợp bộ khung xương 5 ngón tay đầy đủ đốt khớp.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          <Sparkles className="w-3.5 h-3.5" />
          Khuôn mặt cảm xúc & 5 ngón tay
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-surface border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <label htmlFor="playground-input" className="block text-sm font-bold text-text-primary mb-2">
              Nhập câu hoặc chọn mẫu để xem diễn hoạt:
            </label>
            <textarea
              id="playground-input"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface-subtle text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y"
              placeholder="Ví dụ: Xin chào mọi người! Hôm nay tôi đi khám bệnh..."
            ></textarea>

            <div className="mt-4">
              <span className="text-xs font-medium text-text-secondary block mb-2">Câu mẫu gợi ý nhanh:</span>
              <div className="flex flex-wrap gap-2">
                {sampleTexts.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setText(sample)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      text === sample
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface-subtle hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-text-primary'
                    }`}
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-text-secondary">
            <span>💡 Cấu trúc khớp: Khớp gốc bàn tay + 3 đốt mỗi ngón</span>
            <span className="font-medium text-primary">Tốc độ diễn hoạt 60 FPS</span>
          </div>
        </div>

        <div className="lg:col-span-6 bg-surface border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[440px]">
          <h3 className="font-bold text-base text-text-primary w-full text-left mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <span>Diễn hoạt Ngôn ngữ ký hiệu VSL</span>
            <span className="text-xs font-normal text-text-secondary">Khung xương 5 ngón phát sáng</span>
          </h3>
          <div className="w-full flex-1 flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden relative shadow-inner">
            <VSLAvatarStick text={text} width={420} height={420} />
          </div>
        </div>
      </div>
    </div>
  );
};

