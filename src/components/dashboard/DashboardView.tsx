import React, { useState, useEffect } from 'react';
import {
  Eye,
  Mic,
  FileText,
  BookOpen,
  Sparkles,
  History as HistoryIcon,
  ArrowRight,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import { QuickOnboardingCard } from './QuickOnboardingCard';
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
  settings,
  onUpdateSettings,
  onNavigate,
  onSelectCameraVision,
}) => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [recentActivities, setRecentActivities] = useState<ActivityHistory[]>([]);

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
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 5) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return `${diffDays} ngày trước`;
    } catch {
      return '';
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'vision':
        return { label: 'Nhìn giúp tôi', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' };
      case 'conversation':
        return { label: 'Nghe & ghi lại', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
      case 'easy-read':
        return { label: 'Easy Read', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
      case 'document':
        return { label: 'Tài liệu', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' };
      default:
        return { label: 'Hoạt động', color: 'bg-slate-100 text-slate-800' };
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header - Clean Minimalism typography & layout */}
      <div className="bg-white dark:bg-neutral-900 text-[#1A1A1A] dark:text-white rounded-2xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 mb-6">
          <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
            Lovira / AI Accessibility Suite
          </div>
          <div className="text-[10px] font-semibold text-neutral-400 tracking-widest uppercase">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">
            Trạng thái hệ thống
          </span>
        </div>

        <div className="text-4xl sm:text-6xl font-extralight tracking-tight mb-4">
          Xin chào<span className="text-neutral-300 dark:text-neutral-600">.</span>
        </div>

        <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 font-light max-w-xl mb-6">
          Lovira có thể hỗ trợ bạn nhìn, nghe, hiểu văn bản hành chính hay tóm tắt tài liệu hôm nay?
        </p>

        <div className="flex items-center gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
            SẴN SÀNG HỖ TRỢ
          </div>
          <div className="text-xs text-neutral-400 font-medium">4 công cụ trợ năng AI đa năng</div>
        </div>
      </div>

      {/* Non-blocking Quick Setup Card */}
      {showOnboarding && (
        <QuickOnboardingCard
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onClose={() => setShowOnboarding(false)}
          onGoToSettings={() => onNavigate('/settings')}
        />
      )}

      {/* Four Primary Feature Cards Grid */}
      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className="sr-only">
          Các tính năng chính của Lovira
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Vision */}
          <FeatureCard
            title="Nhìn giúp tôi"
            description="Chụp hoặc tải ảnh để Lovira mô tả những gì đang có trong ảnh, đọc bảng hiệu, vật thể và cảnh báo an toàn."
            icon={Eye}
            badge="Thị giác AI"
            accentColor="indigo"
            actions={[
              {
                label: 'Mở camera',
                onClick: () => {
                  if (onSelectCameraVision) {
                    onSelectCameraVision();
                  } else {
                    onNavigate('/vision?action=camera');
                  }
                },
                primary: true,
              },
              {
                label: 'Tải ảnh lên',
                onClick: () => onNavigate('/vision'),
              },
            ]}
          />

          {/* Card 2: Conversation */}
          <FeatureCard
            title="Nghe & ghi lại"
            description="Chuyển lời nói thành văn bản trực tiếp để bạn dễ theo dõi cuộc trò chuyện, kèm tóm tắt ý chính và việc cần làm."
            icon={Mic}
            badge="Giọng nói"
            accentColor="emerald"
            actions={[
              {
                label: 'Bắt đầu',
                onClick: () => onNavigate('/conversation'),
                primary: true,
              },
            ]}
          />

          {/* Card 3: Easy Read */}
          <FeatureCard
            title="Làm nội dung dễ hiểu"
            description="Chuyển văn bản phức tạp, thông báo hành chính thành nội dung ngắn gọn, rõ ràng, chia từng bước dễ dàng tiếp thu."
            icon={FileText}
            badge="Easy Read"
            accentColor="amber"
            actions={[
              {
                label: 'Bắt đầu',
                onClick: () => onNavigate('/easy-read'),
                primary: true,
              },
            ]}
          />

          {/* Card 4: Documents */}
          <FeatureCard
            title="Hiểu tài liệu"
            description="Tải tệp PDF, DOCX hoặc TXT để Lovira tóm tắt, trích xuất thời hạn, hồ sơ cần có và hỏi đáp nội dung tài liệu."
            icon={BookOpen}
            badge="Đọc tài liệu"
            accentColor="rose"
            actions={[
              {
                label: 'Chọn tài liệu',
                onClick: () => onNavigate('/documents'),
                primary: true,
              },
            ]}
          />
        </div>
      </section>

      {/* Recent Activities Section */}
      <section aria-labelledby="recent-heading" className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[#1A1A1A] dark:text-neutral-200">
              <HistoryIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
                Lịch sử
              </div>
              <h2 id="recent-heading" className="text-lg font-light text-[#1A1A1A] dark:text-white">
                Hoạt động gần đây
              </h2>
            </div>
          </div>

          <button
            onClick={() => onNavigate('/history')}
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-neutral-200 hover:text-neutral-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] rounded-full px-3 py-1 border border-neutral-200 dark:border-neutral-700"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Chưa có dữ liệu hoạt động.
            </p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto font-light">
              Hãy thử một trong các tính năng trên để trải nghiệm công nghệ AI trợ năng của Lovira.
            </p>
            <button
              onClick={() => onNavigate('/easy-read')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
            >
              <span>Thử Easy Read ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((item) => {
              const typeInfo = getActivityTypeLabel(item.type);
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(`/history?id=${item.id}`)}
                  className="w-full text-left p-4 rounded-xl bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/60 transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[#1A1A1A] dark:text-neutral-200">
                        {typeInfo.label}
                      </span>
                      <span className="text-[10px] uppercase font-medium text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(item.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#1A1A1A] dark:text-white truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-xl font-light">
                      {item.preview}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#1A1A1A] dark:group-hover:text-white transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
