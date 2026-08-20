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
import { VoiceInputButton } from '../common/VoiceInputButton';

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
    allSessions,
    pauseSession,
    completeSession,
    resumeSession,
    clearSession,
    deleteSession,
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
      <div className="max-w-3xl mx-auto py-8 space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 shrink-0" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Chưa có phiên làm việc nào đang mở</h2>
            <p className="text-sm text-text-secondary mt-2 max-w-md mx-auto leading-relaxed">
              Lovira Life giúp bạn lưu lại toàn bộ hành trình đi khám, làm thủ tục hành chính, mua sắm hoặc đọc tài liệu một cách liền mạch.
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

        {/* Persisted Sessions List */}
        {allSessions.length > 0 && (
          <div className="bg-surface border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Các phiên Lovira Life đã lưu ({allSessions.length})</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-4 rounded-2xl bg-surface-subtle border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 hover:border-primary/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {LIFE_MODE_CONFIGS[sess.type]?.title || 'Đời sống'}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          sess.status === 'completed'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                            : sess.status === 'active'
                            ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                            : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {sess.status === 'completed' ? 'Hoàn thành' : sess.status === 'active' ? 'Đang mở' : 'Tạm dừng'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-text-primary mt-1">{sess.title}</h4>
                    <p className="text-xs text-text-secondary line-clamp-2">{sess.goal}</p>
                    <div className="flex items-center gap-3 text-[11px] text-text-secondary pt-1">
                      <span>{sess.importantFacts.length} thông tin</span>
                      <span>•</span>
                      <span>
                        {sess.tasks.filter((t) => t.status === 'done').length}/{sess.tasks.length} việc đã xong
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                    <button
                      onClick={() => resumeSession(sess.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Tiếp tục phiên</span>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Xóa phiên "${sess.title}"?`)) {
                          deleteSession(sess.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                      title="Xóa phiên"
                      aria-label={`Xóa phiên ${sess.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const config = (activeSession && LIFE_MODE_CONFIGS[activeSession.type]) || LIFE_MODE_CONFIGS.general;
  const safeTasks = Array.isArray(activeSession?.tasks) ? activeSession.tasks : [];
  const safeFacts = Array.isArray(activeSession?.importantFacts) ? activeSession.importantFacts : [];
  const todoTasks = safeTasks.filter((t) => t && t.status === 'todo');
  const doneTasks = safeTasks.filter((t) => t && t.status === 'done');

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => onNavigate('/')}
            aria-label="Quay về trang chủ"
            className="p-2 sm:p-2.5 rounded-2xl bg-surface-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-text-secondary hover:text-text-primary transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl shrink-0">{config.icon}</span>
              <h2 className="text-base sm:text-xl font-bold text-text-primary truncate">{activeSession.title}</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shrink-0">
                Đang hỗ trợ
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5 truncate">{activeSession.goal}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => pauseSession()}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-surface-subtle border border-slate-200 dark:border-slate-800 text-xs font-semibold text-text-primary hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center gap-1.5"
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
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs"
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
                ({safeFacts.length})
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
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={newFactType}
                  onChange={(e) => setNewFactType(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl bg-surface border border-slate-200 dark:border-slate-700 text-xs text-text-primary shrink-0"
                >
                  <option value="location">Địa điểm / Phòng</option>
                  <option value="date">Ngày / Giờ</option>
                  <option value="instruction">Dặn dò / Thuốc</option>
                  <option value="warning">Cảnh báo</option>
                  <option value="requirement">Hồ sơ cần</option>
                  <option value="other">Khác</option>
                </select>
                <div className="flex-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newFactValue}
                    onChange={(e) => setNewFactValue(e.target.value)}
                    placeholder="Ví dụ: Phòng 4, Số 126, Tái khám 25/08..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-surface border border-slate-200 dark:border-slate-700 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                  <VoiceInputButton
                    currentValue={newFactValue}
                    onTranscript={(newText) => setNewFactValue(newText)}
                    promptMessage="Bạn hãy nói thông tin cần lưu như số phòng, số thứ tự, ngày hẹn hoặc dặn dò..."
                    label="Nói thông tin cần lưu"
                    size="sm"
                    showGuidedPrompt={true}
                  />
                </div>
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

          {safeFacts.length === 0 ? (
            <p className="text-xs text-text-secondary py-6 text-center italic">
              Chưa có thông tin nào được lưu. Bạn có thể chụp ảnh hoặc nói dặn dò để Lovira tự động trích xuất.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {safeFacts.map((fact) => (
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
                ({doneTasks.length}/{safeTasks.length})
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
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Nhập việc cần làm..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-surface border border-slate-200 dark:border-slate-700 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <VoiceInputButton
                  currentValue={newTaskTitle}
                  onTranscript={(newText) => setNewTaskTitle(newText)}
                  promptMessage="Bạn hãy nói việc cần làm nhé..."
                  label="Nói việc cần làm"
                  size="sm"
                  showGuidedPrompt={true}
                />
              </div>
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

          {safeTasks.length === 0 ? (
            <p className="text-xs text-text-secondary py-6 text-center italic">
              Chưa có danh sách việc cần làm.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {safeTasks.map((task) => (
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

        <form onSubmit={handleChatSubmit} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            placeholder="Hỏi bất kỳ điều gì về phiên này (Ví dụ: Giờ tôi phải làm gì?)..."
            className="flex-1 px-4 py-2.5 rounded-2xl bg-surface-subtle border border-slate-200 dark:border-slate-700 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <VoiceInputButton
            currentValue={chatPrompt}
            onTranscript={(newText) => setChatPrompt(newText)}
            promptMessage="Bạn cần Lovira trợ giúp điều gì trong phiên làm việc này? Tôi đang lắng nghe..."
            label="Nói câu hỏi hoặc dặn dò cho phiên"
            size="md"
            showGuidedPrompt={true}
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
