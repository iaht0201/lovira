import React, { useEffect, useState } from 'react';
import {
  Eye,
  Mic,
  BookOpen,
  FileText,
  Sparkles,
  Camera,
  Upload,
  ArrowRight,
  Clock,
  Contrast,
  HandMetal,
  Volume2,
  Stethoscope,
  Building2,
  ShoppingBag,
  FileCheck,
} from 'lucide-react';
import { AccessibilitySettings, UserProfile, ActivityHistory } from '../../types';
import { fetchActivitiesFromFirestore } from '../../lib/firebase';
import { useAgent } from '../../agent/AgentController';

interface DashboardViewProps {
  userProfile: UserProfile | null;
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  onNavigate: (route: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  settings,
  onUpdateSettings,
  onNavigate,
}) => {
  const { createSession, setIsLifeModalOpen } = useAgent();
  const [recentActivities, setRecentActivities] = useState<ActivityHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (userProfile?.uid) {
      setIsLoadingHistory(true);
      fetchActivitiesFromFirestore(userProfile.uid, 4)
        .then((items) => setRecentActivities(items))
        .catch(() => setRecentActivities([]))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [userProfile?.uid]);

  const handleStartScenario = (type: 'healthcare' | 'administrative' | 'shopping' | 'reading') => {
    createSession(type);
    onNavigate('/session');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-primary-soft/60 to-surface border border-primary/20 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Trợ năng AI Nhân văn Lovira
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-text-primary leading-tight">
            Xin chào {userProfile?.displayName || 'bạn'}!
          </h1>
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
            Lovira sẵn sàng đồng hành giúp bạn nhìn, nghe, đọc và xử lý thông tin hàng ngày một cách thuận tiện nhất.
          </p>

          {/* Quick Life Mode Button */}
          <div className="pt-2">
            <button
              onClick={() => setIsLifeModalOpen(true)}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover shadow-sm transition-all focus-visible:ring-4 focus-visible:ring-primary/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>Khởi động Lovira Life (Trợ lý phiên)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Main Core Tool Cards */}
      <section aria-labelledby="core-tools-heading" className="space-y-4">
        <h2 id="core-tools-heading" className="text-xl font-bold text-text-primary">
          Công cụ trợ năng chính
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* 1. Nhìn giúp tôi */}
          <div className="bg-surface border border-border hover:border-indigo-400/50 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Nhìn giúp tôi</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Mô tả quang cảnh, đọc chữ trong ảnh, nhận diện vật thể và cảnh báo an toàn vật cản.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => onNavigate('/vision?action=camera')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>Mở Camera</span>
              </button>
              <button
                onClick={() => onNavigate('/vision')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-subtle hover:bg-surface border border-border text-text-primary text-xs sm:text-sm font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Chọn ảnh</span>
              </button>
            </div>
          </div>

          {/* 2. Nghe & ghi lại */}
          <div className="bg-surface border border-border hover:border-teal-400/50 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Nghe & ghi lại</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Ghi chép trực tiếp lời nói thành phụ đề lớn, tự động tóm tắt ý chính và nhắc nhở thời hạn.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => onNavigate('/conversation')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
              >
                <Mic className="w-4 h-4" />
                <span>Bắt đầu nghe</span>
              </button>
            </div>
          </div>

          {/* 3. Làm nội dung dễ hiểu */}
          <div className="bg-surface border border-border hover:border-rose-400/50 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Làm nội dung dễ hiểu</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Đơn giản hóa câu từ phức tạp (Easy Read), chia nhỏ quy trình thành từng bước, giải thích từ khó.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => onNavigate('/easy-read')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Dán văn bản</span>
              </button>
            </div>
          </div>

          {/* 4. Hiểu tài liệu */}
          <div className="bg-surface border border-border hover:border-blue-400/50 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Hiểu tài liệu</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Đọc hiểu file PDF, Word, hợp đồng hoặc công văn hành chính và hỏi đáp trực tiếp.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => onNavigate('/documents')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Chọn tài liệu</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Life Scenarios Strip */}
      <section aria-labelledby="scenarios-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="scenarios-heading" className="text-xl font-bold text-text-primary">
            Tình huống đời sống (Lovira Life)
          </h2>
          <button
            onClick={() => setIsLifeModalOpen(true)}
            className="text-xs sm:text-sm font-semibold text-primary hover:underline"
          >
            Xem tất cả
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => handleStartScenario('healthcare')}
            className="p-4 rounded-2xl bg-surface border border-border hover:border-primary text-left space-y-2 group transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors">
              Đi khám bệnh
            </div>
            <div className="text-xs text-text-secondary">Ghi nhớ lời dặn & đơn thuốc</div>
          </button>

          <button
            onClick={() => handleStartScenario('administrative')}
            className="p-4 rounded-2xl bg-surface border border-border hover:border-primary text-left space-y-2 group transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors">
              Làm thủ tục
            </div>
            <div className="text-xs text-text-secondary">Hồ sơ, hạn chót & giấy tờ</div>
          </button>

          <button
            onClick={() => handleStartScenario('shopping')}
            className="p-4 rounded-2xl bg-surface border border-border hover:border-primary text-left space-y-2 group transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors">
              Đi mua đồ
            </div>
            <div className="text-xs text-text-secondary">Kiểm tra giá & nhãn hàng</div>
          </button>

          <button
            onClick={() => handleStartScenario('reading')}
            className="p-4 rounded-2xl bg-surface border border-border hover:border-primary text-left space-y-2 group transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors">
              Đọc & hiểu
            </div>
            <div className="text-xs text-text-secondary">Tóm lược bài viết, tin tức</div>
          </button>
        </div>
      </section>

      {/* Recent History Preview */}
      <section aria-labelledby="recent-history-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="recent-history-heading" className="text-xl font-bold text-text-primary">
            Hoạt động gần đây
          </h2>
          <button
            onClick={() => onNavigate('/history')}
            className="text-xs sm:text-sm font-semibold text-primary hover:underline"
          >
            Xem toàn bộ lịch sử
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface border border-border text-center space-y-2 text-text-secondary">
            <Clock className="w-8 h-8 mx-auto text-text-disabled" />
            <p className="text-sm">Chưa có hoạt động nào được lưu. Hãy thử một công cụ ở trên!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                onClick={() => onNavigate('/history')}
                className="p-4 rounded-2xl bg-surface border border-border hover:border-primary/50 cursor-pointer space-y-1 transition-all"
              >
                <div className="font-semibold text-sm text-text-primary truncate">{act.title}</div>
                <div className="text-xs text-text-secondary line-clamp-2">{act.preview}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
