import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  Search,
  Trash2,
  Clock,
  Eye,
  Mic,
  FileText,
  BookOpen,
  X,
  Sparkles,
} from 'lucide-react';
import { ActivityHistory, UserProfile } from '../../types';
import { getActivityHistory, deleteActivityItem, clearActivityHistory } from '../../lib/firebase';
import { ReadAloudButton } from '../common/ReadAloudButton';

interface HistoryViewProps {
  userProfile?: UserProfile | null;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ userProfile }) => {
  const [items, setItems] = useState<ActivityHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ActivityHistory | null>(null);

  useEffect(() => {
    if (userProfile?.uid) {
      loadHistory();
    }
  }, [userProfile?.uid]);

  const loadHistory = async () => {
    if (!userProfile?.uid) return;
    const history = await getActivityHistory(userProfile.uid);
    setItems(history);
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userProfile?.uid) return;
    await deleteActivityItem(userProfile.uid, id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };

  const handleClearAll = async () => {
    if (!userProfile?.uid) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử hoạt động?')) {
      await clearActivityHistory(userProfile.uid);
      setItems([]);
      setSelectedItem(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.preview.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vision':
        return <Eye className="w-4 h-4 text-primary" />;
      case 'conversation':
        return <Mic className="w-4 h-4 text-emerald-600" />;
      case 'easy-read':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'document':
        return <BookOpen className="w-4 h-4 text-coral" />;
      default:
        return <Sparkles className="w-4 h-4 text-text-secondary" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Lịch sử hoạt động</h2>
          <p className="text-sm text-text-secondary mt-1">
            Xem lại các phân tích hình ảnh, tóm tắt cuộc trò chuyện và nội dung Easy Read bạn đã lưu.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả lịch sử
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm lịch sử..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface text-xs text-text-primary focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'vision', label: 'Nhìn giúp tôi' },
            { id: 'conversation', label: 'Nghe & ghi' },
            { id: 'easy-read', label: 'Easy Read' },
            { id: 'document', label: 'Tài liệu' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterType === f.id
                  ? 'bg-primary-soft text-primary font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-surface p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <HistoryIcon className="w-10 h-10 text-text-secondary mx-auto opacity-60" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-text-primary">Chưa có lịch sử hoạt động</p>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Trải nghiệm các tính năng của Lovira để kết quả xử lý tự động được lưu lại tại đây.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <a
              href="#/vision"
              className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              Thử Nhìn giúp tôi
            </a>
            <a
              href="#/easy-read"
              className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-coral dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 transition-colors"
            >
              Thử Easy Read
            </a>
            <a
              href="#/conversation"
              className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal dark:text-teal-300 text-xs font-semibold hover:bg-teal-100 transition-colors"
            >
              Thử Nghe & ghi lại
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="p-5 rounded-2xl bg-surface border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-surface-subtle">
                      {getTypeIcon(item.type)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                      {item.type}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    title="Xóa mục này"
                    className="p-1 rounded text-text-secondary hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-text-primary line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                  {item.preview}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-text-secondary uppercase">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(item.createdAt).toLocaleString('vi-VN')}
                </span>
                <span className="font-bold text-primary">Xem chi tiết &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-surface border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl p-6 space-y-6 max-h-[85vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-text-secondary hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-surface-subtle">
                {getTypeIcon(selectedItem.type)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">
                  {selectedItem.title}
                </h3>
                <p className="text-xs text-text-secondary">
                  Lưu lúc {new Date(selectedItem.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-subtle border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-xs font-bold uppercase text-text-secondary">Nội dung chi tiết</span>
              <p className="text-sm text-text-primary leading-relaxed">
                {selectedItem.preview}
              </p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <ReadAloudButton text={selectedItem.preview} size="md" />

              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl bg-surface-subtle text-text-primary font-semibold text-xs border border-slate-200 dark:border-slate-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
