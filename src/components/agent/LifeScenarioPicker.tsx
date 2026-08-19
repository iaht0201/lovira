import React from 'react';
import {
  X,
  HeartPulse,
  Landmark,
  ShoppingCart,
  BookOpen,
  Sparkles,
  ArrowRight,
  Clock,
  Play,
  Trash2,
} from 'lucide-react';
import { useAgent } from '../../agent/AgentController';
import { LifeSessionType } from '../../agent/types';
import { LIFE_MODE_CONFIGS } from '../../agent/SessionManager';

interface LifeScenarioPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const LifeScenarioPicker: React.FC<LifeScenarioPickerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { createSession, allSessions, resumeSession, clearSession } = useAgent();

  if (!isOpen) return null;

  const scenarios: Array<{
    type: LifeSessionType;
    title: string;
    description: string;
    icon: React.ReactNode;
    colorClasses: string;
  }> = [
    {
      type: 'healthcare',
      title: 'Đi khám bệnh',
      description: 'Quét phiếu khám, định vị phòng khám, số thứ tự và ghi âm dặn dò của bác sĩ',
      icon: <HeartPulse className="w-6 h-6 text-rose-500" />,
      colorClasses: 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 hover:border-rose-400',
    },
    {
      type: 'administrative',
      title: 'Làm thủ tục hành chính',
      description: 'Trích xuất danh mục giấy tờ cần chuẩn bị, thời hạn nộp và giải thích quy trình',
      icon: <Landmark className="w-6 h-6 text-blue-500" />,
      colorClasses: 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 hover:border-blue-400',
    },
    {
      type: 'shopping',
      title: 'Đi mua sắm & siêu thị',
      description: 'Đọc nhãn sản phẩm, giá bán, hạn sử dụng và cảnh báo thành phần dị ứng',
      icon: <ShoppingCart className="w-6 h-6 text-emerald-500" />,
      colorClasses: 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-400',
    },
    {
      type: 'reading',
      title: 'Đọc & hiểu tài liệu',
      description: 'Đọc to, giản lược nội dung khó hiểu và trả lời câu hỏi chuyên sâu',
      icon: <BookOpen className="w-6 h-6 text-amber-500" />,
      colorClasses: 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 hover:border-amber-400',
    },
    {
      type: 'general',
      title: 'Hỗ trợ việc hàng ngày',
      description: 'Nói nhu cầu của bạn, Lovira sẽ tự động kết hợp các công cụ trợ năng phù hợp',
      icon: <Sparkles className="w-6 h-6 text-primary" />,
      colorClasses: 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40 hover:border-indigo-400',
    },
  ];

  const handleSelectScenario = (type: LifeSessionType) => {
    createSession(type);
    onClose();
  };

  const pausedOrPastSessions = allSessions.filter((s) => s.status !== 'completed').slice(0, 3);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="life-scenarios-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-surface border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 id="life-scenarios-title" className="text-xl font-bold text-text-primary flex items-center gap-2">
              <span>Tình huống đời sống</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Lovira Life
              </span>
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Chọn tình huống bạn đang cần hỗ trợ để Lovira tự động chuẩn bị ngữ cảnh phù hợp nhất.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng bảng chọn tình huống"
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
          >
            <X className="w-5 h-5 shrink-0" />
          </button>
        </div>

        {/* Existing Paused Sessions Section */}
        {pausedOrPastSessions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Tiếp tục phiên trước đó
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pausedOrPastSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3 rounded-2xl bg-surface-subtle border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-primary transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-text-primary truncate">{sess.title}</p>
                    <p className="text-[11px] text-text-secondary truncate mt-0.5">
                      {sess.nextRecommendedAction || sess.goal}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      resumeSession(sess.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover flex items-center gap-1 shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current" /> Tiếp tục
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5 Scenario Cards Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Bắt đầu nhiệm vụ mới
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {scenarios.map((sc) => (
              <button
                key={sc.type}
                onClick={() => handleSelectScenario(sc.type)}
                className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between gap-3 ${sc.colorClasses}`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-surface shadow-xs shrink-0">{sc.icon}</div>
                  <ArrowRight className="w-4 h-4 text-text-secondary shrink-0" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">{sc.title}</h4>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">{sc.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
