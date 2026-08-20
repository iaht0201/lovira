import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Stethoscope,
  Building2,
  ShoppingBag,
  FileCheck,
  Pause,
  Play,
  RotateCcw,
  CheckCheck,
  Tag,
  Clock,
  ListTodo,
  FileText,
} from 'lucide-react';
import { useAgent } from '../../agent/AgentController';
import { SessionManager } from '../../agent/SessionManager';
import { LifeSession, ImportantFact, SessionTask } from '../../agent/types';
import { AccessibilitySettings } from '../../types';

export const LifeSessionView: React.FC<{ settings: AccessibilitySettings }> = () => {
  const { activeSession, completeSession, pauseSession, setIsLifeModalOpen } = useAgent();
  const [sessions, setSessions] = useState<LifeSession[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newFactText, setNewFactText] = useState('');
  const [newFactCategory, setNewFactCategory] = useState<ImportantFact['category']>('medication');

  useEffect(() => {
    setSessions(SessionManager.getAllSessions());
    const unsub = SessionManager.subscribe(() => {
      setSessions(SessionManager.getAllSessions());
    });
    return unsub;
  }, []);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    SessionManager.addTask({ text: newTaskText.trim(), status: 'todo' });
    setNewTaskText('');
  };

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactText.trim()) return;
    SessionManager.addFact({
      fact: newFactText.trim(),
      category: newFactCategory,
      source: 'manual',
    });
    setNewFactText('');
  };

  const getScenarioIcon = (type?: string) => {
    switch (type) {
      case 'healthcare':
        return <Stethoscope className="w-5 h-5 text-red-500" />;
      case 'administrative':
        return <Building2 className="w-5 h-5 text-amber-500" />;
      case 'shopping':
        return <ShoppingBag className="w-5 h-5 text-emerald-500" />;
      case 'reading':
        return <FileCheck className="w-5 h-5 text-blue-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Lovira Life Agent
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Phiên trợ lý đời sống</h1>
          <p className="text-sm text-text-secondary">
            Đồng hành ghi nhớ thông tin khám bệnh, thủ tục giấy tờ và nhắc việc cần làm.
          </p>
        </div>

        <button
          onClick={() => setIsLifeModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo phiên mới</span>
        </button>
      </div>

      {activeSession ? (
        <div className="space-y-6">
          {/* Active Session Status Card */}
          <div className="bg-surface rounded-3xl border border-primary/30 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-subtle border border-border flex items-center justify-center font-bold">
                  {getScenarioIcon(activeSession.type)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{activeSession.title}</h2>
                  <div className="text-xs text-text-secondary">
                    Bắt đầu lúc: {new Date(activeSession.createdAt).toLocaleTimeString('vi-VN')}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={pauseSession}
                  className="px-3.5 py-2 rounded-xl bg-surface-subtle hover:bg-surface border border-border text-xs font-semibold text-text-primary flex items-center gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Tạm dừng</span>
                </button>
                <button
                  onClick={completeSession}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Hoàn tất phiên</span>
                </button>
              </div>
            </div>

            {/* Facts and Tasks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Important Facts */}
              <div className="space-y-3">
                <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Thông tin & Lời dặn ({activeSession.facts.length})</span>
                </h3>

                <form onSubmit={handleAddFact} className="flex gap-2">
                  <input
                    type="text"
                    value={newFactText}
                    onChange={(e) => setNewFactText(e.target.value)}
                    placeholder="Thêm lời dặn, liều thuốc, hẹn ngày..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-surface-subtle border border-border text-xs text-text-primary focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {activeSession.facts.length === 0 ? (
                    <div className="p-4 rounded-xl bg-surface-subtle text-center text-xs text-text-secondary">
                      Chưa có lời dặn nào được ghi lại.
                    </div>
                  ) : (
                    activeSession.facts.map((fact) => (
                      <div
                        key={fact.id}
                        className="p-3 rounded-xl bg-surface-subtle border border-border text-xs text-text-primary flex items-start gap-2"
                      >
                        <Tag className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 font-medium">{fact.fact}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tasks to Do */}
              <div className="space-y-3">
                <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-primary" />
                  <span>Việc cần làm ({activeSession.tasks.length})</span>
                </h3>

                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Thêm việc cần làm trong phiên..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-surface-subtle border border-border text-xs text-text-primary focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-primary text-white hover:bg-primary-hover"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {activeSession.tasks.length === 0 ? (
                    <div className="p-4 rounded-xl bg-surface-subtle text-center text-xs text-text-secondary">
                      Chưa có việc cần làm nào được thêm.
                    </div>
                  ) : (
                    activeSession.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => SessionManager.toggleTask(task.id)}
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                          task.status === 'done'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-text-secondary line-through'
                            : 'bg-surface-subtle border border-border text-text-primary'
                        }`}
                      >
                        {task.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-text-disabled flex-shrink-0" />
                        )}
                        <span className="text-xs font-medium flex-1">{task.text}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-surface border border-border text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center font-bold">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-text-primary">Chưa có phiên làm việc nào đang chạy</h2>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              Bắt đầu một phiên trợ lý để Lovira theo dõi lời dặn bác sĩ, giấy tờ hành chính hoặc đơn mua sắm.
            </p>
          </div>
          <button
            onClick={() => setIsLifeModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary-hover shadow-xs"
          >
            Chọn tình huống đời sống
          </button>
        </div>
      )}

      {/* Past Sessions Archive */}
      {sessions.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="font-bold text-lg text-text-primary">Danh sách các phiên</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                onClick={() => SessionManager.resumeSession(sess.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  sess.id === activeSession?.id
                    ? 'bg-primary-soft/50 border-primary shadow-xs'
                    : 'bg-surface border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-sm text-text-primary truncate">{sess.title}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sess.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-700'
                        : 'bg-slate-500/20 text-text-secondary'
                    }`}
                  >
                    {sess.status === 'active' ? 'Đang chạy' : 'Đã lưu'}
                  </span>
                </div>
                <div className="text-xs text-text-secondary">
                  {sess.facts.length} lời dặn • {sess.tasks.length} việc cần làm
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
