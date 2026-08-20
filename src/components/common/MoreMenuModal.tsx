import React from 'react';
import { X, FileText, Clock, Settings, Sparkles, HandMetal } from 'lucide-react';

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
    { route: '/session', label: 'Lovira Life (Trợ lý phiên)', icon: Sparkles },
    { route: '/documents', label: 'Hiểu tài liệu (PDF, Word)', icon: FileText },
    { route: '/vsl-playground', label: 'Thử nghiệm Ký hiệu VSL', icon: HandMetal },
    { route: '/history', label: 'Lịch sử hoạt động', icon: Clock },
    { route: '/settings', label: 'Cài đặt & Trợ năng', icon: Settings },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="more-menu-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl border border-border p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 id="more-menu-title" className="font-bold text-lg text-text-primary">
            Tính năng mở rộng
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            aria-label="Đóng bảng chọn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute.startsWith(item.route);

            return (
              <button
                key={item.route}
                onClick={() => {
                  onNavigate(item.route);
                  onClose();
                }}
                className={`w-full flex items-center gap-3.5 p-3 rounded-xl text-left font-medium text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-soft text-primary font-semibold'
                    : 'text-text-primary hover:bg-surface-subtle'
                }`}
              >
                <Icon className="w-5 h-5 text-primary" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
