import React from 'react';
import { Sliders, Check, ArrowRight, X } from 'lucide-react';
import { AccessibilitySettings } from '../../types';

interface QuickOnboardingCardProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  onClose: () => void;
  onGoToSettings: () => void;
}

export const QuickOnboardingCard: React.FC<QuickOnboardingCardProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onGoToSettings,
}) => {
  return (
    <div className="relative bg-white dark:bg-neutral-900 text-[#1A1A1A] dark:text-white p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs my-6">
      <button
        onClick={onClose}
        aria-label="Để sau"
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>

      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#1A1A1A] dark:text-white shrink-0">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">Thiết lập trợ năng</div>
          <h2 className="text-lg font-light tracking-tight text-[#1A1A1A] dark:text-white">Làm Lovira phù hợp hơn với bạn</h2>
          <p className="text-xs text-neutral-500 mt-1 font-light">
            Tùy chọn nhanh các tính năng trợ năng giúp bạn tiếp cận thông tin dễ dàng hơn.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 my-4">
        {/* Font scale toggle */}
        <button
          onClick={() => onUpdateSettings({ fontScale: settings.fontScale === '150' ? '100' : '150' })}
          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all text-left ${
            settings.fontScale !== '100'
              ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A]'
              : 'bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200'
          }`}
        >
          <span>Tăng cỡ chữ</span>
          {settings.fontScale !== '100' && <Check className="w-3.5 h-3.5 ml-1" />}
        </button>

        {/* High contrast toggle */}
        <button
          onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all text-left ${
            settings.highContrast
              ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A]'
              : 'bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200'
          }`}
        >
          <span>Tương phản cao</span>
          {settings.highContrast && <Check className="w-3.5 h-3.5 ml-1" />}
        </button>

        {/* Reduced motion toggle */}
        <button
          onClick={() => onUpdateSettings({ reducedMotion: !settings.reducedMotion })}
          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all text-left ${
            settings.reducedMotion
              ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A]'
              : 'bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200'
          }`}
        >
          <span>Giảm chuyển động</span>
          {settings.reducedMotion && <Check className="w-3.5 h-3.5 ml-1" />}
        </button>

        {/* Captions enabled toggle */}
        <button
          onClick={() => onUpdateSettings({ captionsEnabled: !settings.captionsEnabled })}
          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all text-left ${
            settings.captionsEnabled
              ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A]'
              : 'bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200'
          }`}
        >
          <span>Bật phụ đề</span>
          {settings.captionsEnabled && <Check className="w-3.5 h-3.5 ml-1" />}
        </button>

        {/* Auto read toggle */}
        <button
          onClick={() => onUpdateSettings({ autoReadResponses: !settings.autoReadResponses })}
          className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all text-left ${
            settings.autoReadResponses
              ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A]'
              : 'bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200'
          }`}
        >
          <span>Đọc phản hồi</span>
          {settings.autoReadResponses && <Check className="w-3.5 h-3.5 ml-1" />}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 mt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-neutral-800 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
        >
          Để sau
        </button>

        <button
          onClick={onGoToSettings}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A] font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
        >
          <span>Thiết lập chi tiết</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

