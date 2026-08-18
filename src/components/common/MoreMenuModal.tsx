import React from 'react';
import { BookOpen, History, Settings, X, Sparkles, ChevronRight } from 'lucide-react';

interface MoreMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  currentRoute: string;
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentRoute,
}) => {
  if (!isOpen) return null;

  const items = [
    { id: 'documents', label: 'Hiểu tài liệu', desc: 'Tải PDF, DOCX, TXT để tóm tắt và hỏi đáp', icon: BookOpen, route: '/documents' },
    { id: 'history', label: 'Lịch sử hoạt động', desc: 'Xem lại các bản phân tích và tóm tắt đã lưu', icon: History, route: '/history' },
    { id: 'settings', label: 'Cài đặt & Trợ năng', desc: 'Cỡ chữ, tương phản cao, giọng đọc', icon: Settings, route: '/settings' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 md:hidden"
    >
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-t-2xl sm:rounded-2xl p-6 shadow-xl space-y-6 animate-in slide-in-from-bottom duration-200 text-[#1A1A1A] dark:text-white">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">Lovira</div>
            <h2 className="text-base font-light text-[#1A1A1A] dark:text-white">Tính năng mở rộng</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute.startsWith(item.route);

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.route);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A]'
                    : 'bg-neutral-50 border-neutral-200/80 dark:bg-neutral-800/60 dark:border-neutral-700/80 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`p-2 rounded-full ${isActive ? 'bg-white/20 text-white dark:bg-[#1A1A1A]/20 dark:text-[#1A1A1A]' : 'bg-neutral-200/80 dark:bg-neutral-700 text-[#1A1A1A] dark:text-white'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider truncate">{item.label}</h3>
                    <p className={`text-xs truncate font-light ${isActive ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
                      {item.desc}
                    </p>
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? 'text-white dark:text-[#1A1A1A]' : 'text-neutral-400'}`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

