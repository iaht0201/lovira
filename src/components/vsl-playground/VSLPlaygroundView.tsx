import React, { useState } from 'react';
import { VSLAvatarStick } from '../vsl-avatar/VSLAvatarStick';
import { UserProfile, AccessibilitySettings } from '../../types';

interface VSLPlaygroundViewProps {
  userProfile?: UserProfile | null;
  settings: AccessibilitySettings;
}

export const VSLPlaygroundView: React.FC<VSLPlaygroundViewProps> = ({
  userProfile,
  settings,
}) => {
  const [text, setText] = useState('Xin chào mọi người');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Thử nghiệm Ký hiệu (VSL Playground)</h2>
        <p className="text-sm text-text-secondary mt-1">
          Gõ văn bản bất kỳ vào ô dưới đây để xem Người Que ngay lập tức dịch sang ngôn ngữ ký hiệu.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-surface border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <label htmlFor="playground-input" className="block text-sm font-bold text-text-primary mb-2">
            Nhập văn bản cần dịch:
          </label>
          <textarea
            id="playground-input"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface-subtle text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-y"
            placeholder="Ví dụ: Xin chào mọi người! Hôm nay tôi đi khám bệnh..."
          ></textarea>
        </div>

        <div className="lg:col-span-6 bg-surface border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[400px]">
          <h3 className="font-bold text-base text-text-primary w-full text-left mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">Kết quả dịch sang VSL</h3>
          <div className="w-full flex-1 flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden relative">
             <VSLAvatarStick text={text} width={400} height={400} />
          </div>
        </div>
      </div>
    </div>
  );
};
