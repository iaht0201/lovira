import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, RefreshCw, Layers } from 'lucide-react';
import { useAgent } from '../../agent/AgentController';
import { ContextBuilder } from '../../agent/ContextBuilder';
import { ActionRegistry } from '../../agent/ActionRegistry';

export const AgentDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { agentState, statusMessage, activeSession, activePlan, currentStepIndex, totalSteps } =
    useAgent();

  if (process.env.NODE_ENV === 'production' && !isOpen) {
    // Hide by default in pure production unless toggled
  }

  const currentContext = ContextBuilder.buildContext();
  const allActions = ActionRegistry.getAllActions();

  return (
    <div className="fixed bottom-2 right-2 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-[11px] font-mono hover:bg-slate-900 flex items-center gap-1.5 backdrop-blur-xs border border-slate-700 shadow-md"
        >
          <Terminal className="w-3 h-3 text-emerald-400" />
          <span>Lovira Agent Debug</span>
        </button>
      ) : (
        <div className="w-80 sm:w-96 max-h-[80vh] overflow-y-auto bg-slate-950 text-slate-200 border border-slate-800 rounded-2xl shadow-2xl p-4 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Terminal className="w-4 h-4" />
              <span>Lovira Agent Monitor</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] text-slate-400">Trạng thái Agent:</div>
            <div className="px-2 py-1 bg-slate-900 rounded border border-slate-800 flex items-center justify-between">
              <span className="text-emerald-300 font-bold">{agentState.toUpperCase()}</span>
              <span className="text-[10px] text-slate-400">
                Step: {currentStepIndex}/{totalSteps}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 italic truncate">{statusMessage}</p>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] text-slate-400">Ngữ cảnh màn hình (Context):</div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800 text-[10px] space-y-0.5">
              <div>Screen: <span className="text-blue-400">{currentContext.currentScreen}</span></div>
              <div>Route: <span className="text-blue-400">{currentContext.currentRoute}</span></div>
              <div>Active Session: <span className="text-yellow-400">{activeSession?.title || 'None'}</span></div>
              <div>Has Image: <span className="text-purple-400">{currentContext.activeImage ? 'Yes' : 'No'}</span></div>
              <div>Has Doc: <span className="text-purple-400">{currentContext.activeDocument ? 'Yes' : 'No'}</span></div>
            </div>
          </div>

          {activePlan && activePlan.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400">Kế hoạch thực thi (Active Plan):</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {activePlan.map((p, i) => (
                  <div
                    key={p.id || i}
                    className={`p-1.5 rounded text-[10px] border ${
                      p.status === 'success'
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                        : p.status === 'running'
                        ? 'bg-blue-950/40 border-blue-800/60 text-blue-300 animate-pulse'
                        : p.status === 'failed'
                        ? 'bg-red-950/40 border-red-800/60 text-red-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="font-bold">{p.action}</div>
                    {p.reason && <div className="text-[9px] opacity-80">{p.reason}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-1 text-[10px] text-slate-500 text-right">
            Registry: {allActions.length} registered actions
          </div>
        </div>
      )}
    </div>
  );
};
