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
  accentColor: 'indigo' | 'emerald' | 'amber' | 'rose';
  actions: FeatureCardAction[];
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon: Icon,
  badge,
  actions,
}) => {
  return (
    <div
      className="group relative p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all duration-200 flex flex-col justify-between shadow-xs"
    >
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A] flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>

          {badge && (
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700">
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-xl font-light tracking-tight text-[#1A1A1A] dark:text-white mb-2">{title}</h3>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
          {description}
        </p>
      </div>

      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-2">
        {actions.map((act, idx) => (
          <button
            key={idx}
            type="button"
            onClick={act.onClick}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] ${
              act.primary
                ? 'bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A] hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-xs'
                : 'bg-white dark:bg-neutral-800 text-[#1A1A1A] dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <span>{act.label}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
};

