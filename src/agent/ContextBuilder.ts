import { SessionManager } from './SessionManager';
import { AgentWorkingMemory } from './WorkingMemory';

export interface ContextBuilderParams {
  userInput?: string;
  currentRoute: string;
  currentScreen?: string;
  settings?: any;
  screenSpecificActions?: any[];
  activeImage?: any;
  activeDocument?: any;
  currentResult?: any;
  selectedText?: string;
  availableActions?: Array<{ id: string; label?: string }>;
  customApiKey?: string;
}

export class ContextBuilder {
  public static buildContext(params: ContextBuilderParams) {
    const activeSession = SessionManager.getActiveSession();
    const recentTurns = AgentWorkingMemory.getRecentTurns(5);
    const lastAction = AgentWorkingMemory.getLastAction();

    return {
      currentRoute: params.currentRoute || '/',
      currentScreen: params.currentScreen || 'dashboard',
      settings: params.settings || null,
      activeSession,
      recentTurns,
      lastAction,
      screenSpecificActions: params.screenSpecificActions || [],
      activeImage: params.activeImage || null,
      activeDocument: params.activeDocument || null,
      currentResult: params.currentResult || null,
      selectedText: params.selectedText || null,
      availableActions: params.availableActions || [],
      customApiKey: params.customApiKey,
    };
  }

  public static buildPayload(params: ContextBuilderParams) {
    return {
      userInput: params.userInput || '',
      ...this.buildContext(params),
    };
  }
}
