import {
  AgentPlanStep,
  AgentContext,
  AgentActionResult,
  LifeSessionType,
} from './types';
import { ActionRegistry } from './ActionRegistry';
import { SessionManager } from './SessionManager';
import { speakText, stopSpeaking } from '../lib/speech';
import { AccessibilitySettings } from '../types';

export interface ActionExecutorCallbacks {
  onNavigate: (route: string) => void;
  onUpdateSettings: (settings: Partial<AccessibilitySettings>) => void;
  executeScreenAction?: (actionId: string, params?: Record<string, any>) => Promise<{ success: boolean; result?: any; error?: string }>;
  getCurrentContext: () => AgentContext;
  onStateChange?: (step: AgentPlanStep, index: number, total: number) => void;
}

const MAX_AUTONOMOUS_STEPS = 5;

export class ActionExecutor {
  /**
   * Executes a plan of steps autonomously with loop protection, prerequisite checking and verification.
   */
  public static async executePlan(
    plan: Array<{ action: string; reason?: string; parameters?: Record<string, unknown> }>,
    callbacks: ActionExecutorCallbacks
  ): Promise<AgentActionResult> {
    if (!plan || plan.length === 0) {
      return {
        success: true,
        actionId: 'none',
        feedback: 'Không có hành động nào cần thực hiện.',
      };
    }

    const executedActions: string[] = [];
    let lastResult: unknown = null;
    let finalFeedback = '';

    const stepsToRun = plan.slice(0, MAX_AUTONOMOUS_STEPS);

    for (let i = 0; i < stepsToRun.length; i++) {
      const step = stepsToRun[i];
      const actionId = step.action.toLowerCase();

      // Loop Protection: Avoid executing the exact same action repeatedly
      if (executedActions.filter((a) => a === actionId).length >= 2) {
        console.warn(`[ActionExecutor] Loop detected for action: ${actionId}. Stopping execution.`);
        return {
          success: false,
          actionId: step.action,
          error: 'Phát hiện lặp hành động không cần thiết.',
          feedback: 'Tôi đã tạm dừng để tránh thao tác lặp lại.',
        };
      }

      // Check Action Registry definition
      const actionDef = ActionRegistry.getAction(step.action);
      if (!actionDef) {
        return {
          success: false,
          actionId: step.action,
          error: `Hành động "${step.action}" không tồn tại trong hệ thống.`,
          feedback: 'Hành động này chưa được hỗ trợ.',
        };
      }

      // Prerequisites Check
      const context = callbacks.getCurrentContext();
      if (actionDef.requires && actionDef.requires.length > 0) {
        for (const req of actionDef.requires) {
          if (req === 'activeImage' && !context.activeImage) {
            return {
              success: false,
              actionId: step.action,
              error: 'Chưa có hình ảnh để xử lý.',
              feedback: 'Tôi chưa có ảnh để xem. Bạn có thể mở camera hoặc chọn ảnh từ máy nhé.',
            };
          }
          if (req === 'activeDocument' && !context.activeDocument) {
            return {
              success: false,
              actionId: step.action,
              error: 'Chưa có tài liệu để xử lý.',
              feedback: 'Bạn hãy tải tệp tài liệu PDF hoặc văn bản lên trước nhé.',
            };
          }
          if (req === 'selectedText' && !context.selectedText) {
            return {
              success: false,
              actionId: step.action,
              error: 'Chưa có văn bản nào được chọn.',
              feedback: 'Bạn hãy bôi đen đoạn văn bản cần giải thích nhé.',
            };
          }
        }
      }

      // Notify progress
      const planStep: AgentPlanStep = {
        id: `step_${Date.now()}_${i}`,
        action: step.action,
        reason: step.reason,
        parameters: step.parameters,
        status: 'running',
      };
      if (callbacks.onStateChange) {
        callbacks.onStateChange(planStep, i, stepsToRun.length);
      }

      // Record step in active session if exists
      SessionManager.addPlanStep(planStep);

      // Execute the single action
      const stepOutcome = await this.executeSingleAction(step, callbacks, context);

      if (!stepOutcome.success) {
        planStep.status = 'failed';
        planStep.error = stepOutcome.error;
        console.error(`[ActionExecutor] Step ${step.action} failed:`, stepOutcome.error);
        return stepOutcome;
      }

      planStep.status = 'success';
      planStep.output = stepOutcome.result;
      SessionManager.completeStep(planStep.id, stepOutcome.result);

      executedActions.push(actionId);
      lastResult = stepOutcome.result;
      if (stepOutcome.feedback) {
        finalFeedback = stepOutcome.feedback;
      }

      // Small breather between consecutive UI actions to allow rendering
      if (i < stepsToRun.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    return {
      success: true,
      actionId: stepsToRun[stepsToRun.length - 1].action,
      result: lastResult,
      feedback: finalFeedback || 'Đã hoàn thành.',
    };
  }

  private static async executeSingleAction(
    step: { action: string; reason?: string; parameters?: Record<string, unknown> },
    callbacks: ActionExecutorCallbacks,
    context: AgentContext
  ): Promise<AgentActionResult> {
    const actionId = step.action.toLowerCase();
    const params = step.parameters || {};

    // 1. Navigation Actions
    if (actionId.startsWith('navigation.')) {
      switch (actionId) {
        case 'navigation.home':
          callbacks.onNavigate('/');
          return { success: true, actionId: step.action, feedback: 'Đã về trang chủ.' };
        case 'navigation.back':
          if (typeof window !== 'undefined') window.history.back();
          return { success: true, actionId: step.action, feedback: 'Đã quay lại.' };
        case 'navigation.openvision':
          callbacks.onNavigate('/vision');
          return { success: true, actionId: step.action, feedback: 'Đã mở Nhìn giúp tôi.' };
        case 'navigation.openconversation':
          callbacks.onNavigate('/conversation');
          return { success: true, actionId: step.action, feedback: 'Đã mở Nghe & ghi lại.' };
        case 'navigation.openeasyread':
          callbacks.onNavigate('/easy-read');
          return { success: true, actionId: step.action, feedback: 'Đã mở Làm nội dung dễ hiểu.' };
        case 'navigation.opendocument':
          callbacks.onNavigate('/documents');
          return { success: true, actionId: step.action, feedback: 'Đã mở Hiểu tài liệu.' };
        case 'navigation.openhistory':
          callbacks.onNavigate('/history');
          return { success: true, actionId: step.action, feedback: 'Đã mở Lịch sử.' };
        case 'navigation.opensettings':
          callbacks.onNavigate('/settings');
          return { success: true, actionId: step.action, feedback: 'Đã mở Cài đặt.' };
        case 'navigation.opensession':
          callbacks.onNavigate('/session');
          return { success: true, actionId: step.action, feedback: 'Đã mở phiên làm việc.' };
        default:
          return { success: false, actionId: step.action, error: 'Chưa hỗ trợ điều hướng này.' };
      }
    }

    // 2. Speech Actions
    if (actionId.startsWith('speech.')) {
      switch (actionId) {
        case 'speech.stop':
          stopSpeaking();
          return { success: true, actionId: step.action, feedback: 'Đã dừng đọc.' };
        case 'speech.readcurrent':
          if (context.selectedText) {
            speakText(context.selectedText, { rate: context.accessibilityPreferences.speechRate });
            return { success: true, actionId: step.action, feedback: 'Đang đọc đoạn bạn đã chọn.' };
          }
          return { success: true, actionId: step.action, feedback: 'Không có văn bản nào đang được chọn.' };
        case 'speech.readresult':
          if (context.currentResult?.content) {
            speakText(context.currentResult.content, { rate: context.accessibilityPreferences.speechRate });
            return { success: true, actionId: step.action, feedback: 'Đang đọc kết quả.' };
          }
          return { success: false, actionId: step.action, error: 'Chưa có kết quả để đọc.' };
        case 'speech.slower':
          callbacks.onUpdateSettings({ speechRate: 0.8 });
          return { success: true, actionId: step.action, feedback: 'Đã chỉnh tốc độ nói chậm lại.' };
        case 'speech.faster':
          callbacks.onUpdateSettings({ speechRate: 1.2 });
          return { success: true, actionId: step.action, feedback: 'Đã chỉnh tốc độ nói nhanh hơn.' };
      }
    }

    // 3. Accessibility Actions
    if (actionId.startsWith('accessibility.')) {
      switch (actionId) {
        case 'accessibility.increasefont': {
          const nextScales: Record<string, string> = { '100': '125', '125': '150', '150': '175', '175': '175' };
          callbacks.onUpdateSettings({ fontScale: nextScales[context.accessibilityPreferences.fontScale] as any });
          return { success: true, actionId: step.action, feedback: 'Đã phóng to chữ.' };
        }
        case 'accessibility.decreasefont': {
          const prevScales: Record<string, string> = { '175': '150', '150': '125', '125': '100', '100': '100' };
          callbacks.onUpdateSettings({ fontScale: prevScales[context.accessibilityPreferences.fontScale] as any });
          return { success: true, actionId: step.action, feedback: 'Đã thu nhỏ chữ.' };
        }
        case 'accessibility.enablehighcontrast':
          callbacks.onUpdateSettings({ highContrast: true });
          return { success: true, actionId: step.action, feedback: 'Đã bật tương phản cao.' };
        case 'accessibility.disablehighcontrast':
          callbacks.onUpdateSettings({ highContrast: false });
          return { success: true, actionId: step.action, feedback: 'Đã tắt tương phản cao.' };
        case 'accessibility.enablelargecontrols':
          callbacks.onUpdateSettings({ largeControls: true });
          return { success: true, actionId: step.action, feedback: 'Đã bật chế độ nút lớn.' };
        case 'accessibility.disablelargecontrols':
          callbacks.onUpdateSettings({ largeControls: false });
          return { success: true, actionId: step.action, feedback: 'Đã tắt chế độ nút lớn.' };
      }
    }

    // 4. Session Actions
    if (actionId.startsWith('session.')) {
      switch (actionId) {
        case 'session.create': {
          const type = (params.type as LifeSessionType) || 'general';
          const session = SessionManager.createSession(type, params.title as string, params.goal as string);
          return {
            success: true,
            actionId: step.action,
            result: session,
            feedback: `Đã khởi tạo phiên: ${session.title}`,
          };
        }
        case 'session.getnextstep': {
          const advice = SessionManager.getNextStepAdvice();
          return { success: true, actionId: step.action, feedback: advice };
        }
        case 'session.pause':
          SessionManager.pauseActiveSession();
          return { success: true, actionId: step.action, feedback: 'Đã tạm dừng phiên làm việc.' };
        case 'session.complete':
          SessionManager.completeActiveSession();
          return { success: true, actionId: step.action, feedback: 'Đã hoàn thành phiên làm việc.' };
        case 'session.clear':
          SessionManager.clearActiveSession();
          return { success: true, actionId: step.action, feedback: 'Đã xóa phiên làm việc.' };
      }
    }

    // 5. Screen-Specific Actions (Vision, Document, EasyRead, Conversation)
    if (callbacks.executeScreenAction) {
      const res = await callbacks.executeScreenAction(step.action, params);
      if (res.success) {
        return {
          success: true,
          actionId: step.action,
          result: res.result,
          feedback: `Đã thực hiện: ${step.action}`,
        };
      } else {
        return {
          success: false,
          actionId: step.action,
          error: res.error || 'Không thể thực hiện hành động trên màn hình.',
          feedback: res.error || 'Chưa thực hiện được bước này.',
        };
      }
    }

    return {
      success: true,
      actionId: step.action,
      feedback: `Đã xử lý ${step.action}`,
    };
  }
}
