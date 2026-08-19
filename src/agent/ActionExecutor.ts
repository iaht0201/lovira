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
import { waitForScreen } from '../components/voice-access/ScreenActionRegistry';

export interface ActionExecutorCallbacks {
  onNavigate: (route: string) => void;
  onUpdateSettings: (settings: Partial<AccessibilitySettings>) => void;
  executeScreenAction?: (actionId: string, params?: Record<string, any>) => Promise<{ success: boolean; result?: any; error?: string }>;
  getCurrentContext: () => AgentContext;
  onStateChange?: (step: AgentPlanStep, index: number, total: number) => void;
  onStopListening?: () => void;
}

const MAX_AUTONOMOUS_STEPS = 5;

export class ActionExecutor {
  /**
   * Executes a plan of steps autonomously with loop protection, prerequisite checking,
   * screen transition synchronization, and verification.
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
      const context = callbacks.getCurrentContext();
      const actionDef = ActionRegistry.getAction(step.action);
      const availableActionDef = (context.availableActions || []).find(
        (a) => a.id.toLowerCase() === actionId
      );

      if (!actionDef && !availableActionDef && !actionId.startsWith('navigation.') && !actionId.startsWith('agent.')) {
        return {
          success: false,
          actionId: step.action,
          error: `Hành động "${step.action}" không tồn tại trong hệ thống.`,
          feedback: 'Hành động này chưa được hỗ trợ.',
        };
      }

      // Prerequisites Check
      if (actionDef?.requires && actionDef.requires.length > 0) {
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

      // If this was a navigation step and next step is screen-specific, wait for screen readiness
      if (i < stepsToRun.length - 1) {
        const nextStep = stepsToRun[i + 1];
        if (actionId.startsWith('navigation.') && !nextStep.action.toLowerCase().startsWith('navigation.')) {
          let targetScreen = '';
          if (actionId === 'navigation.openconversation') targetScreen = 'conversation';
          else if (actionId === 'navigation.openvision') targetScreen = 'vision';
          else if (actionId === 'navigation.openeasyread') targetScreen = 'easy-read';
          else if (actionId === 'navigation.opendocument') targetScreen = 'documents';
          else if (actionId === 'navigation.opensettings') targetScreen = 'settings';
          else if (actionId === 'navigation.opensession') targetScreen = 'session';
          else if (actionId === 'navigation.openhistory') targetScreen = 'history';

          if (targetScreen) {
            await waitForScreen(targetScreen, 3000);
          }
        } else {
          // Breather between consecutive actions
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
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

    // 0. Agent Control Actions
    if (actionId === 'agent.stoplistening') {
      if (callbacks.onStopListening) {
        callbacks.onStopListening();
      }
      return { success: true, actionId: step.action, feedback: 'Đã dừng nghe lệnh.' };
    }

    if (actionId === 'agent.cancel') {
      stopSpeaking();
      if (callbacks.onStopListening) {
        callbacks.onStopListening();
      }
      return { success: true, actionId: step.action, feedback: 'Đã hủy thao tác.' };
    }

    // 1. Navigation Actions (with broad alias and case-tolerance)
    if (
      actionId.startsWith('navigation.') ||
      actionId.startsWith('open_') ||
      actionId === 'home' ||
      actionId === 'back'
    ) {
      switch (actionId) {
        case 'navigation.home':
        case 'navigation.openhome':
        case 'open_home':
        case 'home':
          callbacks.onNavigate('/');
          return { success: true, actionId: step.action, feedback: 'Đã về trang chủ.' };

        case 'navigation.back':
        case 'open_back':
        case 'back':
          if (typeof window !== 'undefined') window.history.back();
          return { success: true, actionId: step.action, feedback: 'Đã quay lại.' };

        case 'navigation.openvision':
        case 'navigation.vision':
        case 'open_vision':
        case 'vision':
          callbacks.onNavigate('/vision');
          return { success: true, actionId: step.action, feedback: 'Đã mở Nhìn giúp tôi.' };

        case 'navigation.openconversation':
        case 'navigation.conversation':
        case 'open_conversation':
        case 'conversation':
          callbacks.onNavigate('/conversation');
          return { success: true, actionId: step.action, feedback: 'Đã mở Nghe & ghi lại.' };

        case 'navigation.openeasyread':
        case 'navigation.easyread':
        case 'open_easy_read':
        case 'easyread':
          callbacks.onNavigate('/easy-read');
          return { success: true, actionId: step.action, feedback: 'Đã mở Làm nội dung dễ hiểu.' };

        case 'navigation.opendocument':
        case 'navigation.opendocuments':
        case 'navigation.document':
        case 'navigation.documents':
        case 'open_document':
        case 'open_documents':
        case 'documents':
          callbacks.onNavigate('/documents');
          return { success: true, actionId: step.action, feedback: 'Đã mở Hiểu tài liệu.' };

        case 'navigation.openhistory':
        case 'navigation.history':
        case 'open_history':
        case 'history':
          callbacks.onNavigate('/history');
          return { success: true, actionId: step.action, feedback: 'Đã mở Lịch sử.' };

        case 'navigation.opensettings':
        case 'navigation.settings':
        case 'open_settings':
        case 'settings':
          callbacks.onNavigate('/settings');
          return { success: true, actionId: step.action, feedback: 'Đã mở Cài đặt.' };

        case 'navigation.opensession':
        case 'navigation.opensessions':
        case 'navigation.session':
        case 'navigation.sessions':
        case 'open_session':
        case 'open_sessions':
        case 'session':
          callbacks.onNavigate('/session');
          return { success: true, actionId: step.action, feedback: 'Đã mở phiên làm việc Lovira Life.' };

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
        case 'speech.readresult': {
          const textToRead = context.currentResult?.accessibleText || context.currentResult?.content;
          if (textToRead) {
            speakText(textToRead, { rate: context.accessibilityPreferences.speechRate });
            return { success: true, actionId: step.action, feedback: 'Đang đọc kết quả.' };
          }
          return { success: false, actionId: step.action, error: 'Chưa có kết quả để đọc.' };
        }
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
          const nextScales: Record<string, '100' | '125' | '150' | '175'> = {
            '100': '125',
            '125': '150',
            '150': '175',
            '175': '175',
          };
          const current = (context.accessibilityPreferences.fontScale || '100') as '100' | '125' | '150' | '175';
          callbacks.onUpdateSettings({ fontScale: nextScales[current] || '125' });
          return { success: true, actionId: step.action, feedback: 'Đã phóng to chữ.' };
        }
        case 'accessibility.decreasefont': {
          const prevScales: Record<string, '100' | '125' | '150' | '175'> = {
            '175': '150',
            '150': '125',
            '125': '100',
            '100': '100',
          };
          const current = (context.accessibilityPreferences.fontScale || '100') as '100' | '125' | '150' | '175';
          callbacks.onUpdateSettings({ fontScale: prevScales[current] || '100' });
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
          callbacks.onNavigate('/session');
          return {
            success: true,
            actionId: step.action,
            result: session,
            feedback: `Đã khởi tạo phiên: ${session.title}`,
          };
        }
        case 'session.open': {
          callbacks.onNavigate('/session');
          return { success: true, actionId: step.action, feedback: 'Đã mở phiên làm việc Lovira Life.' };
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

    // Vision Camera Direct Event Trigger
    if (actionId === 'vision.opencamera' || actionId === 'vision.open_camera') {
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('lovira-voice-open-camera'));
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
