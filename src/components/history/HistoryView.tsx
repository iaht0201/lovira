import React, { useEffect, useState } from 'react';
import {
  Clock,
  Eye,
  Mic,
  BookOpen,
  FileText,
  Trash2,
  Volume2,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { AccessibilitySettings, UserProfile, ActivityHistory } from '../../types';
import { fetchActivitiesFromFirestore } from '../../lib/firebase';
import { speakText, stopSpeaking } from '../../lib/speech';
import { useScreenActionContext } from '../voice-access/ScreenActionRegistry';

interface HistoryViewProps {
  userProfile: UserProfile | null;
  settings: AccessibilitySettings;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  userProfile,
  settings,
}) => {
  const [activities, setActivities] = useState<ActivityHistory[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ActivityHistory | null>(null);
  const [copied, setCopied] = useState(false);

  const { registerAction, setCurrentScreenInfo } = useScreenActionContext();

  useEffect(() => {
    setCurrentScreenInfo({
      screenId: 'history',
      title: 'Lịch sử hoạt động',
      description: 'Xem lại các lần nhận diện ảnh, ghi âm cuộc nói chuyện và tài liệu',
    });
  }, [setCurrentScreenInfo]);

  const loadHistory = async () => {
    if (!userProfile?.uid) return;
    setIsLoading(true);
    try {
      const items = await fetchActivitiesFromFirestore(userProfile.uid, 50);
      setActivities(items);
    } catch (e) {
      console.warn('History load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [userProfile?.uid]);

  const filtered = activities.filter((act) => {
    const matchFilter = filterType === 'all' || act.type === filterType;
    const matchSearch =
      !searchQuery ||
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.preview.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const getIcon = (type: ActivityHistory['type']) => {
    switch (type) {
      case 'vision':
        return <Eye className="w-5 h-5 text-indigo-600" />;
      case 'conversation':
        return <Mic className="w-5 h-5 text-teal-600" />;
      case 'easy-read':
        return <BookOpen className="w-5 h-5 text-rose-600" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-text-secondary" />;
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Lịch sử hoạt động</h1>
          <p className="text-sm text-text-secondary">
            Xem lại các kết quả phân tích hình ảnh, cuộc trò chuyện và tài liệu đã lưu.
          </p>
        </div>

        <button
          onClick={loadHistory}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-subtle border border-border hover:bg-surface text-xs font-semibold text-text-primary"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm trong lịch sử..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface border border-border text-sm text-text-primary focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-surface rounded-2xl border border-border w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'vision', label: 'Nhìn' },
            { id: 'conversation', label: 'Nghe' },
            { id: 'easy-read', label: 'Dễ hiểu' },
            { id: 'document', label: 'Tài liệu' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === f.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      {isLoading ? (
        <div className="p-8 rounded-3xl bg-surface border border-border text-center space-y-2">
          <RefreshCw className="w-6 h-6 text-primary mx-auto animate-spin" />
          <div className="text-sm font-medium text-text-secondary">Đang tải lịch sử…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-3xl bg-surface border border-border text-center space-y-2 text-text-secondary">
          <Clock className="w-12 h-12 mx-auto text-text-disabled mb-2" />
          <div className="font-bold text-base text-text-primary">Chưa có bản ghi lịch sử nào</div>
          <p className="text-sm max-w-sm mx-auto">
            Các hoạt động quan trọng bạn thực hiện với Lovira sẽ được lưu tự động tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="p-5 rounded-2xl bg-surface border border-border hover:border-primary/50 cursor-pointer transition-all flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-border flex items-center justify-center flex-shrink-0">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-bold text-sm text-text-primary truncate">{item.title}</h3>
                  <span className="text-xs text-text-secondary whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                  {item.preview}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg bg-surface rounded-3xl border border-border p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                {getIcon(selectedItem.type)}
                <h2 className="font-bold text-base text-text-primary">{selectedItem.title}</h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-surface-subtle border border-border text-sm leading-relaxed text-text-primary whitespace-pre-line">
              {selectedItem.preview}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => speakText(selectedItem.preview)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover"
              >
                <Volume2 className="w-4 h-4" />
                <span>Đọc to</span>
              </button>

              <button
                onClick={() => handleCopy(selectedItem.preview)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-subtle border border-border text-text-primary text-xs font-medium hover:bg-surface"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
