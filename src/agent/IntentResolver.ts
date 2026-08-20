import { AgentPlanResponse } from './types';
import { matchLocalIntent } from '../components/voice-access/localIntentMatcher';

export interface IntentResolutionResult extends AgentPlanResponse {
  feedback?: string;
}

export class IntentResolver {
  public static async resolveIntent(
    input: string,
    context: Record<string, any>,
    customApiKey?: string
  ): Promise<IntentResolutionResult> {
    return this.resolve({
      userInput: input,
      ...context,
      customApiKey,
    });
  }

  public static async resolve(
    payload: Record<string, any>,
    token?: string | null
  ): Promise<IntentResolutionResult> {
    const userInput = payload.userInput || '';

    // First try local fast matching for navigation / instant controls
    const localMatch = matchLocalIntent(userInput, payload.availableActions);
    if (localMatch && localMatch.action !== 'UNKNOWN') {
      const plan = [{ action: localMatch.action, parameters: localMatch.parameters, reason: localMatch.feedback }];
      if (localMatch.chainAction) {
        plan.push({
          action: localMatch.chainAction.action,
          parameters: localMatch.chainAction.parameters,
          reason: 'Hành động tiếp theo',
        });
      }
      return {
        intent: 'local_matched',
        confidence: localMatch.confidence || 0.95,
        needsClarification: false,
        message: localMatch.feedback,
        feedback: localMatch.feedback,
        plan,
      };
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-lovira-client': 'web-app',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/ai/agent-plan', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.data) {
        const planResp = data.data as AgentPlanResponse;
        return {
          ...planResp,
          feedback: planResp.message,
        };
      }
      throw new Error(data.error || 'Lỗi xử lý kế hoạch AI.');
    } catch (err: any) {
      console.warn('[IntentResolver] Fallback on network/API issue:', err);
      return {
        intent: 'fallback',
        confidence: 0.5,
        needsClarification: false,
        message: 'Lovira đang xử lý yêu cầu của bạn.',
        feedback: 'Lovira đang xử lý yêu cầu của bạn.',
        plan: [{ action: 'navigation.home', reason: 'Về trang chủ' }],
      };
    }
  }
}
