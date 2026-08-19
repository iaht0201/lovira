import React, { useState, useEffect } from 'react';
import {
  ScanEye,
  Mic,
  Sparkles,
  FileSearch,
  ArrowRight,
  FileText,
  Bell,
  MessageSquarePlus,
  Glasses,
  BookOpen,
  Subtitles,
  Paperclip,
  Image as ImageIcon,
} from 'lucide-react';
import { AccessibilitySettings, ActivityHistory, UserProfile } from '../../types';
import { getActivityHistory } from '../../lib/firebase';

interface DashboardViewProps {
  userProfile?: UserProfile | null;
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  onNavigate: (route: string) => void;
  onSelectCameraVision?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  onNavigate,
  onSelectCameraVision,
}) => {
  const [recentActivities, setRecentActivities] = useState<ActivityHistory[]>([]);
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (userProfile?.uid) {
      getActivityHistory(userProfile.uid).then((items) => {
        setRecentActivities(items.slice(0, 4));
      });
    }
  }, [userProfile?.uid]);

  const getTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 5) return '12 phút trước';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return `${Math.floor(diffHours / 24)} ngày trước`;
    } catch {
      return 'Vừa xong';
    }
  };

  const handleSendFeedback = () => {
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header with Greeting & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text-primary flex items-center gap-2">
            Xin chào! <span className="inline-block animate-bounce">👋</span>
          </h2>
          <p className="text-text-secondary mt-1">
            Lovira luôn sẵn sàng hỗ trợ bạn tiếp cận thông tin theo cách phù hợp nhất.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            aria-label="Thông báo"
            onClick={() => onNavigate('/history')}
            className="w-11 h-11 rounded-xl bg-surface border border-slate-200 dark:border-slate-800 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <Bell className="w-5 h-5 shrink-0" />
          </button>
          <button
            onClick={handleSendFeedback}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-slate-200 dark:border-slate-800 font-semibold text-text-primary hover:bg-surface-subtle transition-colors text-sm"
          >
            <MessageSquarePlus className="w-4 h-4 shrink-0 text-primary" />
            <span>{feedbackSent ? 'Cảm ơn phản hồi!' : 'Phản hồi'}</span>
          </button>
        </div>
      </div>

      {/* 4 Core Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Nhìn giúp tôi */}
        <div className="bg-indigo-50/50 dark:bg-slate-800/40 border border-indigo-100 dark:border-indigo-950 p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <h3 className="font-bold text-lg text-indigo-900 dark:text-indigo-300">Nhìn giúp tôi</h3>
            <p className="text-sm text-text-secondary mt-1 mb-4 leading-relaxed">
              Mô tả hình ảnh, nhận diện văn bản và vật thể xung quanh.
            </p>
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center mb-6 shrink-0">
              <ScanEye className="w-8 h-8 shrink-0" />
            </div>
          </div>
          <button
            onClick={() => {
              if (onSelectCameraVision) {
                onSelectCameraVision();
              } else {
                onNavigate('/vision?action=camera');
              }
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors text-sm"
          >
            <span>Mở camera & ảnh</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Card 2: Nghe & ghi lại */}
        <div className="bg-teal-50/50 dark:bg-slate-800/40 border border-teal-100 dark:border-teal-950 p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <h3 className="font-bold text-lg text-teal-900 dark:text-teal-300">Nghe & ghi lại</h3>
            <p className="text-sm text-text-secondary mt-1 mb-4 leading-relaxed">
              Chuyển lời nói thành văn bản và tạo phụ đề trực tiếp.
            </p>
            <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal dark:text-teal-300 flex items-center justify-center mb-6 shrink-0">
              <Mic className="w-8 h-8 shrink-0" />
            </div>
          </div>
          <button
            onClick={() => onNavigate('/conversation')}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-teal text-white font-semibold hover:bg-teal-hover transition-colors text-sm"
          >
            <span>Bắt đầu nghe</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Card 3: Làm nội dung dễ hiểu */}
        <div className="bg-rose-50/50 dark:bg-slate-800/40 border border-rose-100 dark:border-rose-950 p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <h3 className="font-bold text-lg text-rose-900 dark:text-rose-300">Làm nội dung dễ hiểu</h3>
            <p className="text-sm text-text-secondary mt-1 mb-4 leading-relaxed">
              Chuyển văn bản phức tạp thành nội dung đơn giản, dễ hiểu.
            </p>
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/50 text-coral dark:text-rose-300 flex items-center justify-center mb-6 shrink-0">
              <Sparkles className="w-8 h-8 shrink-0" />
            </div>
          </div>
          <button
            onClick={() => onNavigate('/easy-read')}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-coral text-white font-semibold hover:bg-coral-hover transition-colors text-sm"
          >
            <span>Dán văn bản</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Card 4: Hiểu tài liệu */}
        <div className="bg-blue-50/50 dark:bg-slate-800/40 border border-blue-100 dark:border-blue-950 p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <h3 className="font-bold text-lg text-blue-900 dark:text-blue-300">Hiểu tài liệu</h3>
            <p className="text-sm text-text-secondary mt-1 mb-4 leading-relaxed">
              Tóm tắt, trích xuất thông tin và hỏi đáp với tài liệu.
            </p>
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-6 shrink-0">
              <FileSearch className="w-8 h-8 shrink-0" />
            </div>
          </div>
          <button
            onClick={() => onNavigate('/documents')}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-sm"
          >
            <span>Chọn tài liệu</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>

      {/* Quick Suggestions Section */}
      <section aria-labelledby="quick-prompts-title">
        <h3 id="quick-prompts-title" className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
          Gợi ý nhanh
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('/vision')}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface border border-slate-200 dark:border-slate-800 text-text-primary text-sm font-medium hover:border-primary hover:text-primary transition-colors text-left"
          >
            <Glasses className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Đọc giúp tôi văn bản này</span>
          </button>
          <button
            onClick={() => onNavigate('/documents')}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface border border-slate-200 dark:border-slate-800 text-text-primary text-sm font-medium hover:border-primary hover:text-primary transition-colors text-left"
          >
            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Tóm tắt tài liệu PDF</span>
          </button>
          <button
            onClick={() => onNavigate('/easy-read')}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface border border-slate-200 dark:border-slate-800 text-text-primary text-sm font-medium hover:border-primary hover:text-primary transition-colors text-left"
          >
            <BookOpen className="w-4 h-4 text-coral shrink-0" />
            <span>Hiểu đoạn văn khó</span>
          </button>
          <button
            onClick={() => onNavigate('/conversation')}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface border border-slate-200 dark:border-slate-800 text-text-primary text-sm font-medium hover:border-primary hover:text-primary transition-colors text-left"
          >
            <Subtitles className="w-4 h-4 text-teal shrink-0" />
            <span>Phụ đề trực tiếp cuộc họp</span>
          </button>
        </div>
      </section>

      {/* Recent Activities Section */}
      <section aria-labelledby="recent-act-title">
        <div className="flex items-center justify-between mb-3">
          <h3 id="recent-act-title" className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            Hoạt động gần đây
          </h3>
          <button
            onClick={() => onNavigate('/history')}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Xem tất cả
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentActivities.length > 0 ? (
            recentActivities.map((act) => {
              const getIconAndBg = () => {
                switch (act.type) {
                  case 'easy-read':
                    return {
                      bg: 'bg-rose-50 text-coral dark:bg-rose-950/40',
                      icon: <FileText className="w-4 h-4 shrink-0" />,
                      label: 'Easy Read',
                    };
                  case 'document':
                    return {
                      bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40',
                      icon: <Paperclip className="w-4 h-4 shrink-0" />,
                      label: 'Hiểu tài liệu',
                    };
                  case 'conversation':
                    return {
                      bg: 'bg-teal-50 text-teal dark:bg-teal-950/40',
                      icon: <Mic className="w-4 h-4 shrink-0" />,
                      label: 'Nghe & ghi lại',
                    };
                  default:
                    return {
                      bg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40',
                      icon: <ImageIcon className="w-4 h-4 shrink-0" />,
                      label: 'Nhìn giúp tôi',
                    };
                }
              };

              const meta = getIconAndBg();

              return (
                <div
                  key={act.id}
                  onClick={() => onNavigate(`/history?id=${act.id}`)}
                  className="p-4 rounded-xl bg-surface border border-slate-200 dark:border-slate-800 flex items-start gap-3 hover:border-slate-300 cursor-pointer transition-colors"
                >
                  <span className={`p-2 rounded-lg shrink-0 ${meta.bg}`}>{meta.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-text-primary truncate">{act.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {meta.label} • {getTimeAgo(act.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-6 rounded-2xl bg-surface border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <p className="font-bold text-sm text-text-primary">Chưa có hoạt động nào được lưu</p>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Kết quả bạn thực hiện và chọn lưu sẽ tự động xuất hiện ở đây.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                <button
                  onClick={() => onNavigate('/vision')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                >
                  Thử Nhìn giúp tôi
                </button>
                <button
                  onClick={() => onNavigate('/easy-read')}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-coral dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 transition-colors"
                >
                  Thử Easy Read
                </button>
                <button
                  onClick={() => onNavigate('/conversation')}
                  className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal dark:text-teal-300 text-xs font-semibold hover:bg-teal-100 transition-colors"
                >
                  Thử Nghe & ghi lại
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

