import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Plus,
  Volume2,
  Calendar,
  MapPin,
  AlertTriangle,
  Info,
  Pause,
  Play,
  Trash2,
  FileText,
  Sparkles,
  Camera,
  Mic,
  MessageSquare,
  Send,
} from 'lucide-react';
import { useAgent } from '../../agent/AgentController';
import { ImportantFact, SessionTask } from '../../agent/types';
import { LIFE_MODE_CONFIGS } from '../../agent/SessionManager';
import { speakText } from '../../lib/speech';
import { useRegisterScreenActions } from '../voice-access/ScreenActionRegistry';
import { AccessibilitySettings } from '../../types';

interface LifeSessionViewProps {
  settings: AccessibilitySettings;
  onNavigate: (route: string) => void;
}

export const LifeSessionView: React.FC<LifeSessionViewProps> = ({
  settings,
  onNavigate,
}) => {
  const {
    activeSession,
    pauseSession,
    completeSession,
    clearSession,
    toggleTask,
    addFact,
    addTask,
    processInput,
    isListening,
    startListening,
    stopListening,
    setIsLifeModalOpen,
  } = useAgent();

  const [newFactValue, setNewFactValue] = useState('');
  const [newFactType, setNewFactType] = useState<ImportantFact['type']>('instruction');
  const [isAddingFact, setIsAddingFact] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const [chatPrompt, setChatPrompt] = useState('');

  // Register voice actions for this specific screen
  useRegisterScreenActions({
    screenId: 'session',
    screenTitle: activeSession ? activeSession.title : 'Phiên làm việc',
    screenState: {
      hasActiveSession: !!activeSession,
      sessionType: activeSession?.type,
      todoCount: activeSession?.tasks.filter((t) => t.status === 'todo').length || 0,
      factsCount: activeSession?.importantFacts.length || 0,
    },
    actions: [
      {
        id: 'getNextStep',
        label: 'Xem bước tiếp theo',
        aliases: ['tiếp theo làm gì', 'giờ tôi phải làm gì', 'bước tiếp theo', 'làm gì bây giờ'],
        description: 'Hỏi Lovira bước hành động kế tiếp trong phiên hiện tại',
        handler: () => processInput('Giờ tôi phải làm gì?'),
      },
      {
        id: 'readSessionSummary',
        label: 'Đọc tóm tắt phiên',
        aliases: ['đọc tóm tắt phiên', 'tổng kết phiên', 'tôi đã làm được gì'],
        description: 'Đọc to các thông tin và tiến độ của phiên này',
        handler: () => {
          if (activeSession) {
            const facts = activeSession.importantFacts.map((f) => f.value).join('. ');
            const todo = activeSession.tasks.filter((t) => t.status === 'todo').map((t) => t.title).join('. ');
            const text = `Phiên ${activeSession.title}. Mục tiêu: ${activeSession.goal}. Thông tin quan trọng: ${facts || 'chưa có'}. Việc cần làm: ${todo || 'đã hoàn thành hết'}.`;
            speakText(text, { rate: settings.speechRate || 1.0 });
          }
        },
      },
      {
        id: 'openVisionForSession',
        label: 'Chụp ảnh cho phiên này',
        aliases: ['chụp ảnh', 'mở camera', 'quét phiếu', 'xem giấy này'],
        description: 'Mở camera để quét phiếu khám hoặc tài liệu vào phiên',
        handler: () => onNavigate('/vision?action=camera'),
      },
      {
        id: 'openConversationForSession',
        label: 'Ghi âm cho phiên này',
        aliases: ['bật nghe thoại', 'nghe bác sĩ dặn', 'ghi âm'],
        description: 'Mở chức năng nghe hội thoại để ghi lại dặn dò vào phiên',
        handler: () => onNavigate('/conversation'),
      },
      {
        id: 'completeSession',
        label: 'Hoàn thành phiên',
        aliases: ['hoàn thành phiên', 'xong phiên này', 'đóng phiên'],
        description: 'Đánh dấu hoàn thành toàn bộ phiên làm việc',
        handler: () => completeSession(),
      },
    ],
  });

  if (!activeSession) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8 shrink-0" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Chưa có phiên làm việc nào đang mở</h2>
          <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
            Lovira Life giúp bạn theo dõi từng bước khi đi khám, làm thủ tục hành chính, mua sắm hoặc đọc tài liệu.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setIsLifeModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-primary text-white font-semibold hover:bg-primary-hover shadow-md flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Bắt đầu tình huống mới
          </button>
          <button
            onClick={() => onNavigate('/')}
            className="px-5 py-3 rounded-2xl bg-surface border border-slate-200 dark:border-slate-800 text-text-primary font-semibold hover:bg-surface-subtle text-sm"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const config = LIFE_MODE_CONFIGS[activeSession.type] || LIFE_MODE_CONFIGS.general;
  const todoTasks = activeSession.tasks.filter((t) => t.status === 'todo');
  const doneTasks = activeSession.tasks.filter((t) => t.status === 'done');

  const handleAddFactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFactValue.trim()) {
      addFact({ type: newFactType, value: newFactValue.trim() });
      setNewFactValue('');
      setIsAddingFact(false);
    }
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask({ title: newTaskTitle.trim(), status: 'todo' });
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatPrompt.trim()) {
      processInput(chatPrompt);
      setChatPrompt('');
    }
  };

  const getFactIcon = (type: ImportantFact['type']) => {
    switch (type) {
      case 'date':
      case 'time':
        return <Calendar className="w-4 h-4 text-blue-500 shrink-0" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-primary shrink-0" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/')}
            aria-label="Quay về trang chủ"
            className="p-2.5 rounded-2xl bg-surface-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-text-secondary hover:text-text-primary transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl shrink-0">{config.icon}</span>
              <h2 className="text-xl font-bold text-text-primary truncate">{activeSession.title}</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                Đang hỗ trợ
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">{activeSession.goal}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => pauseSession()}
            className="px-3.5 py-2 rounded-xl bg-surface-subtle border border-slate-200 dark:border-slate-800 text-xs font-semibold text-text-primary hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-1.5"
            title="Tạm dừng phiên"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Tạm dừng</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm('Đánh dấu hoàn thành phiên làm việc này?')) {
                completeSession();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Hoàn thành</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn xóa phiên này?')) {
                clearSession();
              }
            }}
            aria-label="Xóa phiên làm việc"
            className="p-2 rounded-xl text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Next Step Banner (Session Memory Highlight) */}
      <div className="p-5 rounded-3xl bg-linear-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Bước tiếp theo đề xuất
            </span>
          </div>
          <p className="text-sm font-semibold text-text-primary">
            {todoTasks.length > 0
              ? `👉 ${todoTasks[0].title}`
              : '🎉 Bạn đã hoàn thành tất cả các mục việc trong phiên này!'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => processInput('Giờ tôi phải làm gì?')}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover flex items-center gap-1.5 shadow-xs"
          >
            <Volume2 className="w-4 h-4" />
            <span>Đọc hướng dẫn</span>
          </button>
          <button
            onClick={() => onNavigate('/vision?action=camera')}
            className="px-3.5 py-2 rounded-xl bg-surface border border-slate-200 dark:border-slate-800 text-xs font-semibold text-text-primary hover:bg-surface-subtle flex items-center gap-1.5"
            title="Quét ảnh / camera"
          >
            <Camera className="w-4 h-4 text-indigo-500" />
            <span>Chụp ảnh</span>
          </button>
          <button
            onClick={() => onNavigate('/conversation')}
            className="px-3.5 py-2 rounded-xl bg-surface border border-slate-200 dark:border-slate-800 text-xs font-semibold text-text-primary hover:bg-surface-subtle flex items-center gap-1.5"
            title="Ghi âm hội thoại"
          >
            <Mic className="w-4 h-4 text-teal" />
            <span>Nghe dặn</span>
          </button>
        </div>
      </div>

      {/* Grid: 2 Columns for Important Facts & Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1: Important Facts */}
        <div className="bg-surface p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <span>Thông tin quan trọng</span>
              <span className="text-xs font-normal text-text-secondary">
                ({activeSession.importantFacts.length})
              </span>
            </h3>
            <button
              onClick={() => setIsAddingFact(!isAddingFact)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm
            </button>
          </div>

          {isAddingFact && (
            <form onSubmit={handleAddFactSubmit} className="p-3 rounded-2xl bg-surface-subtle space-y-2.5">
              <div className="flex gap-2">
                <select
                  value={newFactType}
                  onChange={(e) => setNewFactType(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl bg-surface border border-slate-200 dark:border-slate-700 text-xs text-text-primary"
                >
                  <option value="location">Địa điểm / Phòng</option>
                  <option value="date">Ngày / Giờ</option>
                  <option value="instruction">Dặn dò / Thuốc</option>
                  <option value="warning">Cảnh báo</option>
                  <option value="requirement">Hồ sơ cần</option>
                  <option value="other">Khác</option>
                </select>
                <input
                  type="text"
                  value={newFactValue}
                  onChange={(e) => setNewFactValue(e.target.value)}
                  placeholder="Ví dụ: Phòng 4, Số 126, Tái khám 25/08..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-surface border border-slate-200 dark:border-slate-700 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingFact(false)}
                  className="px-3 py-1 text-xs text-text-secondary hover:text-text-primary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newFactValue.trim()}
                  className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-semibold disabled:opacity-50"
                >
                  Lưu thông tin
                </button>
              </div>
            </form>
          )}

          {activeSession.importantFacts.length === 0 ? (
            <p className="text-xs text-text-secondary py-6 text-center italic">
              Chưa có thông tin nào được lưu. Bạn có thể chụp ảnh hoặc nói dặn dò để Lovira tự động trích xuất.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {activeSession.importantFacts.map((fact) => (
                <div
                  key={fact.id}
                  className="p-3 rounded-2xl bg-surface-subtle border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2.5"
                >
                  <div className="p-1 rounded-lg bg-surface shrink-0 mt-0.5">
                    {getFactIcon(fact.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-text-primary leading-relaxed">{fact.value}</p>
                    {fact.source && (
                      <span className="text-[10px] text-text-secondary">Nguồn: {fact.source}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Tasks Checklist */}
        <div className="bg-surface p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <span>Việc cần làm & Giấy tờ</span>
              <span className="text-xs font-normal text-text-secondary">
                ({doneTasks.length}/{activeSession.tasks.length})
              </span>
            </h3>
            <button
              onClick={() => setIsAddingTask(!isAddingTask)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm việc
            </button>
          </div>

          {isAddingTask && (
            <form onSubmit={handleAddTaskSubmit} className="p-3 rounded-2xl bg-surface-subtle space-y-2.5">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Nhập việc cần làm..."
                className="w-full px-3 py-1.5 rounded-xl bg-surface border border-slate-200 dark:border-slate-700 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-3 py-1 text-xs text-text-secondary hover:text-text-primary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-semibold disabled:opacity-50"
                >
                  Thêm
                </button>
              </div>
            </form>
          )}

          {activeSession.tasks.length === 0 ? (
            <p className="text-xs text-text-secondary py-6 text-center italic">
              Chưa có danh sách việc cần làm.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {activeSession.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                    task.status === 'done'
                      ? 'bg-surface-subtle/50 border-slate-200/40 dark:border-slate-800/40 text-text-secondary line-through'
                      : 'bg-surface-subtle border-slate-200 dark:border-slate-800 text-text-primary hover:border-primary'
                  }`}
                >
                  {task.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-text-secondary shrink-0" />
                  )}
                  <span className="text-xs font-medium min-w-0 flex-1">{task.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Prompt Bar for Session Interaction */}
      <div className="bg-surface p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5" /> Hỏi hoặc dặn dò Lovira trong phiên này
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => processInput('Giờ tôi phải làm gì?')}
            className="px-3 py-1.5 rounded-xl bg-surface-subtle border border-slate-200 dark:border-slate-800 text-xs font-medium text-text-primary hover:border-primary hover:text-primary transition-colors"
          >
            👉 Giờ tôi phải làm gì?
          </button>
          <button
            onClick={() => processInput('Tôi còn thiếu giấy tờ gì?')}
            className="px-3 py-1.5 rounded-xl bg-surface-subtle border border-slate-200 dark:border-slate-800 text-xs font-medium text-text-primary hover:border-primary hover:text-primary transition-colors"
          >
            📋 Tôi còn thiếu giấy tờ gì?
          </button>
          <button
            onClick={() => processInput('Đọc lại dặn dò của bác sĩ')}
            className="px-3 py-1.5 rounded-xl bg-surface-subtle border border-slate-200 dark:border-slate-800 text-xs font-medium text-text-primary hover:border-primary hover:text-primary transition-colors"
          >
            🔊 Đọc lại thông tin quan trọng
          </button>
        </div>

        <form onSubmit={handleChatSubmit} className="flex gap-2 pt-1">
          <input
            type="text"
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            placeholder="Hỏi bất kỳ điều gì về phiên này..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-surface-subtle border border-slate-200 dark:border-slate-700 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!chatPrompt.trim()}
            className="px-4 py-2.5 rounded-2xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover disabled:opacity-50 flex items-center gap-1 shrink-0"
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span>Hỏi</span>
          </button>
        </form>
      </div>
    </div>
  );
};
