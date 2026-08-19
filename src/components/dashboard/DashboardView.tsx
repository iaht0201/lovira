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
  HeartPulse,
  Landmark,
  ShoppingCart,
  Camera,
  Play,
  Clock,
  Compass,
} from 'lucide-react';
import { AccessibilitySettings, ActivityHistory, UserProfile } from '../../types';
import { getActivityHistory } from '../../lib/firebase';
import { useRegisterScreenActions } from '../voice-access/ScreenActionRegistry';
import { useAgent } from '../../agent/AgentController';
import { LifeSessionType } from '../../agent/types';

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

  const {
    activeSession,
    startListening,
    isListening,
    createSession,
    setIsLifeModalOpen,
  } = useAgent();

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

  const handleStartScenario = (type: LifeSessionType) => {
    createSession(type);
  };

  useRegisterScreenActions({
    screenId: 'dashboard',
    screenTitle: 'Trang chủ',
    actions: [
      {
        id: 'openVision',
        label: 'Nhìn giúp tôi',
        aliases: ['mở nhìn giúp tôi', 'nhìn giúp tôi', 'mở camera & ảnh', 'mở camera', 'chụp ảnh'],
        description: 'Mở chức năng Nhìn giúp tôi để quét ảnh hoặc mở camera',
        handler: () => {
          if (onSelectCameraVision) onSelectCameraVision();
          else onNavigate('/vision?action=camera');
        },
      },
      {
        id: 'openConversation',
        label: 'Nghe & ghi lại',
        aliases: ['mở nghe & ghi lại', 'nghe & ghi lại', 'bắt đầu nghe', 'nghe thoại', 'ghi âm'],
        description: 'Mở chức năng Nghe & ghi lại cuộc hội thoại',
        handler: () => onNavigate('/conversation'),
      },
      {
        id: 'openEasyRead',
        label: 'Làm nội dung dễ hiểu',
        aliases: ['làm nội dung dễ hiểu', 'giản lược ngay', 'đơn giản hóa', 'dễ hiểu'],
        description: 'Mở chức năng làm nội dung văn bản ngắn gọn dễ hiểu',
        handler: () => onNavigate('/easy-read'),
      },
      {
        id: 'openDocuments',
        label: 'Hiểu tài liệu',
        aliases: ['hiểu tài liệu', 'tải tài liệu', 'đọc tài liệu', 'đọc file pdf'],
        description: 'Mở chức năng đọc và phân tích tài liệu PDF hoặc văn bản',
        handler: () => onNavigate('/documents'),
      },
      {
        id: 'openHistory',
        label: 'Lịch sử & Thông báo',
        aliases: ['lịch sử', 'thông báo', 'xem lịch sử', 'xem thông báo'],
        description: 'Xem lịch sử các hoạt động đã thực hiện',
        handler: () => onNavigate('/history'),
      },
      {
        id: 'startHealthcare',
        label: 'Tình huống đi khám',
        aliases: ['tôi đang đi khám', 'đi khám bệnh', 'hỗ trợ đi khám'],
        description: 'Bắt đầu phiên hỗ trợ đi khám bệnh',
        handler: () => handleStartScenario('healthcare'),
      },
      {
        id: 'startAdmin',
        label: 'Tình huống làm thủ tục',
        aliases: ['làm thủ tục', 'làm giấy tờ', 'thủ tục hành chính'],
        description: 'Bắt đầu phiên hỗ trợ làm thủ tục hành chính',
        handler: () => handleStartScenario('administrative'),
      },
      {
        id: 'sendFeedback',
        label: 'Phản hồi',
        aliases: ['phản hồi', 'gửi phản hồi', 'đóng góp ý kiến'],
        description: 'Gửi phản hồi đóng góp ý kiến về Lovira',
        handler: () => handleSendFeedback(),
      },
    ],
  });

  return (
    <div className="space-y-8">
      {/* Top Greeting and Notifications */}
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

      {/* ==================== HERO: LOVIRA LIFE INTERACTION AREA ==================== */}
      <div className="bg-linear-to-br from-indigo-50/80 via-surface to-teal-50/60 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30 border border-indigo-100 dark:border-indigo-950/70 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider">
              Lovira Life Agent
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-text-primary mt-2">
            Bạn cần tôi giúp gì?
          </h3>
          <p className="text-sm text-text-secondary mt-1 max-w-xl leading-relaxed">
            Chỉ cần nói tự nhiên, đưa camera trước vật thể hoặc tải tệp tài liệu. Lovira sẽ tự động xử lý và đồng hành cùng bạn.
          </p>
        </div>

        {/* 3 Main Direct Input Triggers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Trigger 1: Voice */}
          <button
            onClick={startListening}
            className={`p-4 rounded-2xl border font-bold flex items-center gap-3.5 transition-all text-left ${
              isListening
                ? 'bg-red-500 text-white border-red-600 shadow-md animate-pulse'
                : 'bg-primary text-white border-primary hover:bg-primary-hover shadow-xs'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="block text-sm">
                {isListening ? 'Đang lắng nghe...' : 'Nói với Lovira'}
              </span>
              <span className="block text-xs font-normal opacity-90">Nói nhu cầu của bạn</span>
            </div>
          </button>

          {/* Trigger 2: Camera / Vision */}
          <button
            onClick={() => onNavigate('/vision?action=camera')}
            className="p-4 rounded-2xl bg-surface border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-text-primary flex items-center gap-3.5 transition-colors text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-bold">Cho tôi xem cái này</span>
              <span className="block text-xs text-text-secondary">Quét ảnh / máy ảnh</span>
            </div>
          </button>

          {/* Trigger 3: Document */}
          <button
            onClick={() => onNavigate('/documents')}
            className="p-4 rounded-2xl bg-surface border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 text-text-primary flex items-center gap-3.5 transition-colors text-left shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-bold">Gửi tài liệu cho tôi</span>
              <span className="block text-xs text-text-secondary">Đọc PDF & văn bản</span>
            </div>
          </button>
        </div>

        {/* Active Session Card (If session running) */}
        {activeSession && (
          <div className="p-4 rounded-2xl bg-surface border border-primary/30 dark:border-primary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary uppercase">Tiếp tục phiên</span>
                  <span className="text-xs font-bold text-text-primary truncate">
                    {activeSession.title}
                  </span>
                </div>
                <p className="text-xs text-text-secondary truncate mt-0.5">
                  👉 {activeSession.nextRecommendedAction || activeSession.goal}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('/session')}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
            >
              <span>Vào phiên làm việc</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Life Scenarios Quick Row */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-primary" /> Tình huống đời sống thường gặp
            </span>
            <button
              onClick={() => setIsLifeModalOpen(true)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => handleStartScenario('healthcare')}
              className="p-3.5 rounded-2xl bg-surface border border-slate-200 dark:border-slate-800 hover:border-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">🏥</span>
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs font-bold text-text-primary">Đi khám bệnh</p>
              <p className="text-[11px] text-text-secondary mt-0.5 truncate">Quét phiếu & nghe dặn</p>
            </button>

            <button
              onClick={() => handleStartScenario('administrative')}
              className="p-3.5 rounded-2xl bg-surface border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">🏛</span>
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs font-bold text-text-primary">Làm thủ tục</p>
              <p className="text-[11px] text-text-secondary mt-0.5 truncate">Hồ sơ & thời hạn</p>
            </button>

            <button
              onClick={() => handleStartScenario('shopping')}
              className="p-3.5 rounded-2xl bg-surface border border-slate-200 dark:border-slate-800 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">🛒</span>
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs font-bold text-text-primary">Đi mua sắm</p>
              <p className="text-[11px] text-text-secondary mt-0.5 truncate">Đọc nhãn & hạn dùng</p>
            </button>

            <button
              onClick={() => handleStartScenario('reading')}
              className="p-3.5 rounded-2xl bg-surface border border-slate-200 dark:border-slate-800 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">📚</span>
                <ArrowRight className="w-3.5 h-3.5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs font-bold text-text-primary">Đọc & hiểu</p>
              <p className="text-[11px] text-text-secondary mt-0.5 truncate">Giản lược văn bản</p>
            </button>
          </div>
        </div>
      </div>

      {/* ==================== 4 CORE FEATURE CARDS ==================== */}
      <div>
        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">
          Công cụ chuyên biệt
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Nhìn giúp tôi */}
          <div className="bg-indigo-50/50 dark:bg-slate-800/40 border border-indigo-100 dark:border-indigo-950 p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <h4 className="font-bold text-lg text-indigo-900 dark:text-indigo-300">Nhìn giúp tôi</h4>
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
              <h4 className="font-bold text-lg text-teal-900 dark:text-teal-300">Nghe & ghi lại</h4>
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
              <h4 className="font-bold text-lg text-rose-900 dark:text-rose-300">Làm nội dung dễ hiểu</h4>
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
              <h4 className="font-bold text-lg text-blue-900 dark:text-blue-300">Hiểu tài liệu</h4>
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
