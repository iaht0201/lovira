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
        return <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'conversation':
        return <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'easy-read':
        return <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'document':
        return <BookOpen className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-light text-[#1A1A1A] dark:text-white flex items-center gap-2.5">
            <span>Lịch sử hoạt động</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-light">
            Xem lại các phân tích hình ảnh, tóm tắt cuộc trò chuyện và nội dung Easy Read bạn đã lưu.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-100 text-rose-600 hover:bg-rose-50 dark:bg-neutral-800 dark:text-rose-400 font-bold text-xs uppercase tracking-wider transition-colors shrink-0 border border-neutral-200 dark:border-neutral-700"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa tất cả lịch sử</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm lịch sử..."
            className="w-full pl-10 pr-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-[#1A1A1A] dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                filterType === f.id
                  ? 'bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A] shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 p-12 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center space-y-2 shadow-xs">
          <HistoryIcon className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
          <p className="text-sm font-light text-[#1A1A1A] dark:text-white">Không tìm thấy lịch sử nào</p>
          <p className="text-xs text-neutral-400 font-light">
            Hãy trải nghiệm các tính năng của Lovira để tự động lưu lại lịch sử tiện lợi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-neutral-100 dark:bg-neutral-800">
                      {getTypeIcon(item.type)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      {item.type}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    title="Xóa mục này"
                    className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/50 text-neutral-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-sm font-normal text-[#1A1A1A] dark:text-white line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed font-light">
                  {item.preview}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(item.createdAt).toLocaleString('vi-VN')}
                </span>
                <span className="font-bold text-[#1A1A1A] dark:text-white group-hover:underline">
                  Xem chi tiết &rarr;
                </span>
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
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950">
                {getTypeIcon(selectedItem.type)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedItem.title}
                </h2>
                <p className="text-xs text-slate-400">
                  Đã lưu lúc {new Date(selectedItem.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Nội dung xem trước
              </h3>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                {selectedItem.preview}
              </p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <ReadAloudButton text={selectedItem.preview} size="md" />

              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-200"
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
