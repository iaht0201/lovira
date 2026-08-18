import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Lovira đang xử lý…',
  subMessage,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center p-8 my-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm text-center"
    >
      <div className="relative flex items-center justify-center w-12 h-12 mb-4">
        <div className="absolute w-12 h-12 rounded-full border-4 border-indigo-200 dark:border-indigo-900 animate-ping opacity-25"></div>
        <div className="w-10 h-10 rounded-full border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin"></div>
      </div>
      <p className="text-base font-semibold text-slate-800 dark:text-slate-100">{message}</p>
      {subMessage && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{subMessage}</p>
      )}
    </div>
  );
};
