import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface FeatureCardAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  accentColor: 'indigo' | 'emerald' | 'amber' | 'rose' | 'teal' | 'blue';
  actions: FeatureCardAction[];
  illustration?: React.ReactNode;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon: Icon,
  badge,
  accentColor,
  actions,
  illustration,
}) => {
  const colorStyles = {
    indigo: {
      cardBg: 'bg-[#EEF0FF] dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50',
      iconBg: 'bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none',
      badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800',
      btnPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none',
    },
    teal: {
      cardBg: 'bg-[#E6F7F5] dark:bg-teal-950/40 border-teal-100 dark:border-teal-900/50',
      iconBg: 'bg-teal-600 text-white shadow-teal-200 dark:shadow-none',
      badgeBg: 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-800',
      btnPrimary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200 dark:shadow-none',
    },
    emerald: {
      cardBg: 'bg-[#E6F7F5] dark:bg-teal-950/40 border-teal-100 dark:border-teal-900/50',
      iconBg: 'bg-teal-600 text-white shadow-teal-200 dark:shadow-none',
      badgeBg: 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-800',
      btnPrimary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200 dark:shadow-none',
    },
    rose: {
      cardBg: 'bg-[#FFEBF0] dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50',
      iconBg: 'bg-rose-600 text-white shadow-rose-200 dark:shadow-none',
      badgeBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800',
      btnPrimary: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 dark:shadow-none',
    },
    amber: {
      cardBg: 'bg-[#FFEBF0] dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50',
      iconBg: 'bg-rose-600 text-white shadow-rose-200 dark:shadow-none',
      badgeBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800',
      btnPrimary: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 dark:shadow-none',
    },
    blue: {
      cardBg: 'bg-[#EFF6FF] dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50',
      iconBg: 'bg-blue-600 text-white shadow-blue-200 dark:shadow-none',
      badgeBg: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
      btnPrimary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none',
    },
  };

  const style = colorStyles[accentColor] || colorStyles.indigo;

  return (
    <div
      className={`group relative p-6 sm:p-7 rounded-3xl border transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-md ${style.cardBg} overflow-hidden`}
    >
      {/* Background Decorative Illustration */}
      {illustration && (
        <div className="absolute right-3 bottom-3 opacity-15 dark:opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-500">
          {illustration}
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className={`w-11 h-11 rounded-2xl ${style.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>

          {badge && (
            <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${style.badgeBg}`}>
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed mb-6 font-medium max-w-sm">
          {description}
        </p>
      </div>

      <div className="relative z-10 pt-2 flex flex-wrap items-center gap-2">
        {actions.map((act, idx) => (
          <button
            key={idx}
            type="button"
            onClick={act.onClick}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              act.primary
                ? `${style.btnPrimary} shadow-sm font-bold`
                : 'bg-white/80 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700'
            }`}
          >
            <span>{act.label}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
};


