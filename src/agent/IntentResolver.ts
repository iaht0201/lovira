import { AgentContext, AgentPlannerResponse, AgentActionDefinition } from './types';
import { ActionRegistry } from './ActionRegistry';
import { SessionManager } from './SessionManager';
import { fetchApi } from '../services/api';

export interface ResolveResult {
  source: 'deterministic' | 'semantic' | 'llm_planner';
  intent: string;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestion?: string;
  feedback: string;
  plan: Array<{
    action: string;
    reason?: string;
    parameters?: Record<string, unknown>;
  }>;
}

export class IntentResolver {
  /**
   * Main resolution pipeline:
   * Layer 1: Deterministic Command Matching
   * Layer 2: Context-Aware Semantic Matcher
   * Layer 3: Multimodal Agent Planner (LLM)
   */
  public static async resolveIntent(
    input: string,
    context: AgentContext,
    customApiKey?: string
  ): Promise<ResolveResult> {
    const text = input.trim().toLowerCase();
    if (!text) {
      return {
        source: 'deterministic',
        intent: 'EMPTY_INPUT',
        confidence: 0,
        needsClarification: true,
        clarificationQuestion: 'Bạn có thể nói hoặc nhập điều bạn muốn Lovira hỗ trợ nhé.',
        feedback: 'Lovira đang lắng nghe bạn.',
        plan: [],
      };
    }

    // ==================== LAYER 1: DETERMINISTIC MATCHING ====================
    const layer1 = this.tryDeterministicMatch(text, context);
    if (layer1) {
      return layer1;
    }

    // ==================== LAYER 2: CONTEXT-AWARE SEMANTIC MATCHING ====================
    const layer2 = this.trySemanticMatch(text, context);
    if (layer2 && layer2.confidence >= 0.85) {
      return layer2;
    }

    // ==================== LAYER 3: MULTIMODAL AGENT PLANNER (LLM) ====================
    try {
      const llmResult = await this.callAgentPlannerApi(input, context, customApiKey);
      if (llmResult) {
        // Validate plan steps against registry
        const validatedPlan = llmResult.plan.filter((step) => {
          const actionDef = ActionRegistry.getAction(step.action);
          if (!actionDef) {
            console.warn(`[IntentResolver] Filtered out unexposed action: ${step.action}`);
            return false;
          }
          return true;
        });

        return {
          source: 'llm_planner',
          intent: llmResult.intent || 'general_help',
          confidence: llmResult.confidence || 0.9,
          needsClarification: !!llmResult.needsClarification,
          clarificationQuestion: llmResult.clarificationQuestion,
          feedback: llmResult.message || 'Tôi đang thực hiện cho bạn.',
          plan: validatedPlan,
        };
      }
    } catch (err) {
      console.warn('[IntentResolver] LLM planner fallback:', err);
    }

    // Fallback to Layer 2 match if available, or polite clarification
    if (layer2) {
      return layer2;
    }

    return {
      source: 'deterministic',
      intent: 'UNKNOWN',
      confidence: 0.3,
      needsClarification: true,
      clarificationQuestion: 'Lovira chưa hiểu rõ yêu cầu này. Bạn muốn mở camera xem ảnh, nghe hội thoại hay làm dễ hiểu văn bản?',
      feedback: 'Bạn có thể nói lại một cách tự nhiên hơn nhé.',
      plan: [],
    };
  }

  // ==================== LAYER 1 HELPER ====================
  private static tryDeterministicMatch(text: string, context: AgentContext): ResolveResult | null {
    // 1. Session Memory questions
    if (
      text === 'giờ tôi phải làm gì' ||
      text === 'tiếp theo làm gì' ||
      text === 'tiếp theo' ||
      text === 'bước tiếp theo' ||
      text === 'làm gì bây giờ' ||
      text === 'tôi còn thiếu gì'
    ) {
      if (context.activeSession) {
        const advice = SessionManager.getNextStepAdvice();
        return {
          source: 'deterministic',
          intent: 'session_next_step',
          confidence: 1.0,
          needsClarification: false,
          feedback: advice,
          plan: [
            {
              action: 'session.getNextStep',
              reason: 'Người dùng hỏi bước tiếp theo trong phiên hiện tại',
            },
          ],
        };
      } else {
        return {
          source: 'deterministic',
          intent: 'session_next_step_no_session',
          confidence: 0.95,
          needsClarification: false,
          feedback: 'Bạn chưa có phiên làm việc nào đang mở. Bạn có thể chọn "Đi khám", "Làm thủ tục", hoặc nói nhu cầu của mình nhé.',
          plan: [
            {
              action: 'navigation.home',
              reason: 'Chuyển về trang chủ để chọn tình huống',
            },
          ],
        };
      }
    }

    // 2. Life Session direct creation
    if (text === 'tôi đang đi khám' || text === 'đi khám bệnh' || text === 'đi khám' || text === 'hỗ trợ tôi đi khám') {
      return {
        source: 'deterministic',
        intent: 'create_healthcare_session',
        confidence: 1.0,
        needsClarification: false,
        feedback: 'Đã khởi tạo phiên Đi khám bệnh. Bạn có thể đưa camera vào phiếu khám hoặc giấy tờ nhé.',
        plan: [
          {
            action: 'session.create',
            reason: 'Tạo phiên đi khám bệnh',
            parameters: { type: 'healthcare' },
          },
          {
            action: 'navigation.openSession',
            reason: 'Mở màn hình phiên làm việc',
          },
        ],
      };
    }

    if (text === 'làm thủ tục' || text === 'tôi đang làm thủ tục' || text === 'làm giấy tờ' || text === 'thủ tục hành chính') {
      return {
        source: 'deterministic',
        intent: 'create_admin_session',
        confidence: 1.0,
        needsClarification: false,
        feedback: 'Đã tạo phiên Làm thủ tục. Hãy chụp giấy tờ hoặc tải tệp tài liệu để tôi trích xuất danh mục hồ sơ cho bạn.',
        plan: [
          {
            action: 'session.create',
            reason: 'Tạo phiên làm thủ tục hành chính',
            parameters: { type: 'administrative' },
          },
          {
            action: 'navigation.openSession',
            reason: 'Mở màn hình phiên làm việc',
          },
        ],
      };
    }

    if (text === 'tôi đang đi mua sắm' || text === 'đi mua đồ' || text === 'mua sắm' || text === 'đi siêu thị') {
      return {
        source: 'deterministic',
        intent: 'create_shopping_session',
        confidence: 1.0,
        needsClarification: false,
        feedback: 'Đã tạo phiên Đi mua đồ. Bạn hãy đưa camera trước sản phẩm để tôi đọc nhãn và hạn dùng nhé.',
        plan: [
          {
            action: 'session.create',
            reason: 'Tạo phiên đi mua sắm',
            parameters: { type: 'shopping' },
          },
          {
            action: 'navigation.openSession',
            reason: 'Mở màn hình phiên làm việc',
          },
        ],
      };
    }

    // 3. Exact alias match in ActionRegistry
    const allActions = ActionRegistry.getAllActions();
    for (const action of allActions) {
      if (action.aliases && action.aliases.includes(text)) {
        return {
          source: 'deterministic',
          intent: `exact_action_${action.id}`,
          confidence: 0.98,
          needsClarification: false,
          feedback: `Đang thực hiện ${action.label}.`,
          plan: [{ action: action.id, reason: `Khớp lệnh trực tiếp: "${text}"` }],
        };
      }
    }

    return null;
  }

  // ==================== LAYER 2 HELPER ====================
  private static trySemanticMatch(text: string, context: AgentContext): ResolveResult | null {
    // Check referential language: "cái này", "đoạn này", "đọc lại", "làm lại"
    if (text.includes('đọc lại') || text === 'nói lại' || text === 'đọc tiếp') {
      if (context.currentResult) {
        return {
          source: 'semantic',
          intent: 'read_result',
          confidence: 0.95,
          needsClarification: false,
          feedback: 'Đang đọc lại kết quả.',
          plan: [{ action: 'speech.readResult', reason: 'Đọc lại kết quả hiện có trên màn hình' }],
        };
      }
      if (context.selectedText) {
        return {
          source: 'semantic',
          intent: 'read_selection',
          confidence: 0.95,
          needsClarification: false,
          feedback: 'Đang đọc đoạn bạn vừa chọn.',
          plan: [{ action: 'speech.readCurrent', reason: 'Đọc văn bản đang bôi đen' }],
        };
      }
    }

    // "đọc chữ" / "xem chữ" / "chữ gì đây"
    if (
      text.includes('đọc chữ') ||
      text.includes('chữ trong ảnh') ||
      text.includes('trích xuất chữ') ||
      text.includes('viết gì')
    ) {
      if (context.currentScreen === 'vision') {
        return {
          source: 'semantic',
          intent: 'vision_read_text',
          confidence: 0.92,
          needsClarification: false,
          feedback: 'Đang chuyển sang chế độ đọc chữ trong ảnh.',
          plan: [{ action: 'vision.readText', reason: 'Người dùng muốn đọc chữ trên màn hình Nhìn giúp tôi' }],
        };
      } else {
        return {
          source: 'semantic',
          intent: 'open_vision_and_read_text',
          confidence: 0.9,
          needsClarification: false,
          feedback: 'Đang mở Nhìn giúp tôi để đọc chữ cho bạn.',
          plan: [
            { action: 'navigation.openVision', reason: 'Chuyển sang màn hình Nhìn giúp tôi' },
            { action: 'vision.readText', reason: 'Kích hoạt chế độ đọc chữ' },
          ],
        };
      }
    }

    // "khó hiểu quá" / "làm dễ hiểu" / "đơn giản lại"
    if (
      text.includes('khó hiểu') ||
      text.includes('dễ hiểu hơn') ||
      text.includes('giản lược') ||
      text.includes('đơn giản hóa')
    ) {
      if (context.currentScreen === 'easyRead' || context.currentScreen === 'documents') {
        return {
          source: 'semantic',
          intent: 'easy_read_simplify',
          confidence: 0.92,
          needsClarification: false,
          feedback: 'Đang làm nội dung ngắn gọn và dễ hiểu hơn.',
          plan: [{ action: 'easyRead.simplify', reason: 'Giản lược nội dung hiện tại' }],
        };
      } else {
        return {
          source: 'semantic',
          intent: 'open_easy_read',
          confidence: 0.88,
          needsClarification: false,
          feedback: 'Đang mở Làm nội dung dễ hiểu.',
          plan: [{ action: 'navigation.openEasyRead', reason: 'Mở màn hình làm nội dung dễ hiểu' }],
        };
      }
    }

    // "vào cài đặt bật tương phản cao" (multi-step)
    if (text.includes('cài đặt') && text.includes('tương phản')) {
      return {
        source: 'semantic',
        intent: 'settings_high_contrast',
        confidence: 0.95,
        needsClarification: false,
        feedback: 'Đang mở Cài đặt và bật tương phản cao.',
        plan: [
          { action: 'navigation.openSettings', reason: 'Mở màn hình Cài đặt' },
          { action: 'accessibility.enableHighContrast', reason: 'Bật tương phản cao' },
        ],
      };
    }

    // "vào cài đặt phóng to chữ"
    if (text.includes('cài đặt') && (text.includes('chữ to') || text.includes('phóng to'))) {
      return {
        source: 'semantic',
        intent: 'settings_increase_font',
        confidence: 0.95,
        needsClarification: false,
        feedback: 'Đang mở Cài đặt và tăng kích thước chữ.',
        plan: [
          { action: 'navigation.openSettings', reason: 'Mở màn hình Cài đặt' },
          { action: 'accessibility.increaseFont', reason: 'Phóng to cỡ chữ' },
        ],
      };
    }

    return null;
  }

  // ==================== LAYER 3 HELPER ====================
  private static async callAgentPlannerApi(
    input: string,
    context: AgentContext,
    customApiKey?: string
  ): Promise<AgentPlannerResponse | null> {
    const exposedActions = ActionRegistry.getAllActions().map((a) => ({
      id: a.id,
      label: a.label,
      description: a.description,
      category: a.category,
      requires: a.requires,
    }));

    const payload = {
      userInput: input,
      currentScreen: context.currentScreen,
      currentRoute: context.currentRoute,
      activeSession: context.activeSession
        ? {
            id: context.activeSession.id,
            type: context.activeSession.type,
            title: context.activeSession.title,
            goal: context.activeSession.goal,
            importantFacts: context.activeSession.importantFacts,
            tasks: context.activeSession.tasks,
          }
        : null,
      activeImage: context.activeImage ? { name: context.activeImage.name, hasImage: true } : null,
      activeDocument: context.activeDocument ? { name: context.activeDocument.name, type: context.activeDocument.type } : null,
      currentResult: context.currentResult ? { type: context.currentResult.type, preview: context.currentResult.content.slice(0, 300) } : null,
      selectedText: context.selectedText ? context.selectedText.slice(0, 300) : null,
      availableActions: exposedActions,
      customApiKey,
    };

    return await fetchApi<AgentPlannerResponse>('/api/ai/agent-plan', payload);
  }
}
