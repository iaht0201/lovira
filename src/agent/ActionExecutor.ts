import { AgentPlanStep } from './types';
import { SessionManager } from './SessionManager';
import { AgentWorkingMemory } from './WorkingMemory';

export interface ActionExecutorContext {
  onNavigate: (route: string) => void;
  onUpdateSettings?: (settings: any) => void;
  executeScreenAction?: (id: string, params?: any) => Promise<any>;
  getCurrentContext?: () => any;
  onStateChange?: (step: AgentPlanStep, index: number, total: number) => void;
  onStopListening?: () => void;
}

export interface ExecutionResult {
  success: boolean;
  feedback?: string;
  error?: string;
}

export class ActionExecutor {
  public static async executePlan(
    plan: AgentPlanStep[],
    ctx: ActionExecutorContext,
    onStepProgress?: (stepIndex: number, step: AgentPlanStep) => void
  ): Promise<ExecutionResult> {
    try {
      for (let i = 0; i < plan.length; i++) {
        const step = plan[i];
        if (onStepProgress) {
          onStepProgress(i, step);
        }
        if (ctx.onStateChange) {
          ctx.onStateChange(step, i, plan.length);
        }

        AgentWorkingMemory.setLastAction(step.action, step.parameters);

        // 1. Navigation Actions
        if (step.action === 'navigation.home') {
          ctx.onNavigate('/');
        } else if (step.action === 'navigation.openVision') {
          ctx.onNavigate('/vision');
        } else if (step.action === 'navigation.openConversation') {
          ctx.onNavigate('/conversation');
        } else if (step.action === 'navigation.openEasyRead') {
          ctx.onNavigate('/easy-read');
        } else if (step.action === 'navigation.openDocuments') {
          ctx.onNavigate('/documents');
        } else if (step.action === 'navigation.openHistory') {
          ctx.onNavigate('/history');
        } else if (step.action === 'navigation.openSettings') {
          ctx.onNavigate('/settings');
        } else if (step.action === 'navigation.openSession') {
          ctx.onNavigate('/session');
        } else if (step.action === 'navigation.openVSLPlayground') {
          ctx.onNavigate('/vsl-playground');
        } else if (step.action === 'navigation.back') {
          window.history.back();
        }

        // 2. Session Actions
        else if (step.action === 'session.create') {
          const type = step.parameters?.type || 'general';
          SessionManager.createSession(type);
          ctx.onNavigate('/session');
        } else if (step.action === 'session.pause') {
          SessionManager.pauseActiveSession();
        } else if (step.action === 'session.complete') {
          SessionManager.completeActiveSession();
        }

        // 3. Screen Actions
        else if (ctx.executeScreenAction) {
          try {
            await ctx.executeScreenAction(step.action, step.parameters);
          } catch (e: any) {
            console.warn(`[ActionExecutor] Failed executing screen action: ${step.action}`, e);
          }
        }

        // Small delay between chained steps
        if (i < plan.length - 1) {
          await new Promise((r) => setTimeout(r, 350));
        }
      }

      return {
        success: true,
        feedback: 'Đã thực hiện xong các bước.',
      };
    } catch (err: any) {
      console.error('[ActionExecutor] Error executing plan:', err);
      return {
        success: false,
        error: err.message || 'Lỗi khi thực thi kế hoạch.',
      };
    }
  }
}
