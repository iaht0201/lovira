import React, { useState } from 'react';
import { Sparkles, Send, Mic, Terminal, ChevronUp, ChevronDown } from 'lucide-react';
import { useAgent } from '../../agent/AgentController';
import { useVoiceAccess } from '../voice-access/VoiceSessionManager';

export const AgentBar: React.FC = () => {
  const { currentPlan, isExecuting, executeAgentGoal, setIsDebugOpen } = useAgent();
  const { activateSession } = useVoiceAccess();
  const [inputGoal, setInputGoal] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputGoal.trim() || isExecuting) return;
    executeAgentGoal(inputGoal.trim());
    setInputGoal('');
  };

  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-lg z-30">
      <div className="bg-surface/95 backdrop-blur-md rounded-2xl border border-primary/40 shadow-xl p-2.5 sm:p-3 transition-all space-y-2">
        {/* Agent Plan Feedback Banner */}
        {currentPlan && currentPlan.plan.length > 0 && (
          <div className="p-2.5 rounded-xl bg-primary-soft/80 border border-primary/20 text-xs space-y-1">
            <div className="flex items-center justify-between font-bold text-primary">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                {currentPlan.message || 'Kế hoạch Lovira AI'}
              </span>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-text-secondary hover:text-text-primary"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>

            {isExpanded && (
              <div className="space-y-1 pt-1 border-t border-primary/20">
                {currentPlan.plan.map((step, idx) => (
                  <div key={idx} className="text-text-secondary flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{step.reason || step.action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsDebugOpen(true)}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
            title="Nhật ký lệnh Agent"
          >
            <Terminal className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputGoal}
            onChange={(e) => setInputGoal(e.target.value)}
            placeholder="Nói hoặc gõ: 'Mở máy ảnh đọc đơn thuốc', 'Ghi âm bác sĩ'..."
            className="flex-1 bg-surface-subtle px-3 py-2 rounded-xl border border-border text-xs sm:text-sm text-text-primary placeholder:text-text-disabled focus:ring-2 focus:ring-primary focus:outline-none"
          />

          <button
            type="button"
            onClick={activateSession}
            className="p-2 rounded-xl bg-surface-subtle hover:bg-surface border border-border text-text-primary"
            title="Nói câu lệnh"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={!inputGoal.trim() || isExecuting}
            className="p-2 rounded-xl bg-primary hover:bg-primary-hover text-white disabled:opacity-50"
            aria-label="Gửi yêu cầu trợ lý"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
