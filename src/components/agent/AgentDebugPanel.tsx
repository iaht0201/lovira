import React from 'react';
import { X, Terminal, CheckCircle2, AlertTriangle, Play, Sparkles } from 'lucide-react';
import { useAgent } from '../../agent/AgentController';

export const AgentDebugPanel: React.FC = () => {
  const { isDebugOpen, setIsDebugOpen, currentPlan, isExecuting, executeAgentGoal } = useAgent();

  if (!isDebugOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-2xl bg-surface rounded-3xl border border-border p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg text-text-primary">Nhật ký xử lý Agent Lovira</h2>
          </div>
          <button
            onClick={() => setIsDebugOpen(false)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-900 text-slate-200 space-y-1">
            <div className="text-emerald-400 font-bold">Trạng thái Agent:</div>
            <div>{isExecuting ? 'Đang thực thi kế hoạch đa bước...' : 'Đang chờ lệnh từ người dùng.'}</div>
          </div>

          {currentPlan ? (
            <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-3">
              <div className="font-bold text-sm text-text-primary font-sans">
                Kế hoạch gần nhất: {currentPlan.intent} (Độ tin cậy: {Math.round((currentPlan.confidence || 0) * 100)}%)
              </div>
              <div className="space-y-1.5">
                {currentPlan.plan.map((step, i) => (
                  <div key={i} className="p-2 rounded bg-surface border border-border flex items-start gap-2">
                    <span className="font-bold text-primary">{i + 1}.</span>
                    <div>
                      <div className="font-bold text-text-primary">{step.action}</div>
                      <div className="text-text-secondary text-[11px] font-sans">{step.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-text-secondary">Chưa có kế hoạch nào được tạo.</div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <button
            onClick={() => setIsDebugOpen(false)}
            className="px-4 py-2 rounded-xl bg-surface-subtle border border-border text-xs font-semibold hover:bg-surface text-text-primary"
          >
            Đóng bảng nhật ký
          </button>
        </div>
      </div>
    </div>
  );
};
