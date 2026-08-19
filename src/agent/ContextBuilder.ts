import { AgentContext, AgentActionDefinition, AgentActionResult } from './types';
import { ActionRegistry } from './ActionRegistry';
import { SessionManager } from './SessionManager';
import { AccessibilitySettings } from '../types';

export interface ContextSourceData {
  currentScreen?: string;
  currentRoute?: string;
  focusedElement?: {
    id: string;
    type: string;
    label: string;
  };
  selectedText?: string;
  activeImage?: {
    id: string;
    source: string;
    name?: string;
  };
  activeDocument?: {
    id: string;
    name: string;
    type: string;
    text?: string;
  };
  currentResult?: {
    type: string;
    content: string;
  };
  screenSpecificActions?: AgentActionDefinition[];
  previousAction?: AgentActionResult;
  settings?: AccessibilitySettings;
}

export class ContextBuilder {
  private static liveMediaState: {
    activeImage?: { id: string; source: string; name?: string };
    activeDocument?: { id: string; name: string; type: string; text?: string };
    currentResult?: { type: string; content: string };
  } = {};

  public static setLiveMedia(media: {
    activeImage?: { id: string; source: string; name?: string };
    activeDocument?: { id: string; name: string; type: string; text?: string };
    currentResult?: { type: string; content: string };
  }) {
    this.liveMediaState = { ...this.liveMediaState, ...media };
  }

  public static clearLiveMedia() {
    this.liveMediaState = {};
  }

  public static buildContext(data: ContextSourceData = {}): AgentContext {
    // 1. Current route & screen
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') || '/' : '/';
    const currentRoute = data.currentRoute || hash;

    let currentScreen = data.currentScreen || 'dashboard';
    if (currentRoute === '/' || currentRoute === '') currentScreen = 'dashboard';
    else if (currentRoute.startsWith('/vision')) currentScreen = 'vision';
    else if (currentRoute.startsWith('/conversation')) currentScreen = 'conversation';
    else if (currentRoute.startsWith('/easy-read')) currentScreen = 'easyRead';
    else if (currentRoute.startsWith('/documents')) currentScreen = 'documents';
    else if (currentRoute.startsWith('/history')) currentScreen = 'history';
    else if (currentRoute.startsWith('/settings')) currentScreen = 'settings';
    else if (currentRoute.startsWith('/session')) currentScreen = 'session';

    // 2. Active selection from DOM if available
    let selectedText = data.selectedText;
    if (!selectedText && typeof window !== 'undefined') {
      try {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
          selectedText = selection.toString().trim();
        }
      } catch {
        // ignore
      }
    }

    // 3. Focused element
    let focusedElement = data.focusedElement;
    if (!focusedElement && typeof document !== 'undefined') {
      try {
        const active = document.activeElement;
        if (active && active !== document.body && active !== document.documentElement) {
          focusedElement = {
            id: active.id || active.getAttribute('name') || active.tagName.toLowerCase(),
            type: active.tagName.toLowerCase(),
            label:
              active.getAttribute('aria-label') ||
              active.getAttribute('placeholder') ||
              (active as HTMLElement).innerText?.slice(0, 50) ||
              '',
          };
        }
      } catch {
        // ignore
      }
    }

    // 4. Available actions
    const allRegistered = ActionRegistry.getAllActions();
    const availableActions = data.screenSpecificActions
      ? [...allRegistered, ...data.screenSpecificActions]
      : allRegistered;

    // 5. Active session
    const activeSession = SessionManager.getActiveSession();

    // 6. Media and Results
    const activeImage = data.activeImage || this.liveMediaState.activeImage;
    const activeDocument = data.activeDocument || this.liveMediaState.activeDocument;
    const currentResult = data.currentResult || this.liveMediaState.currentResult;

    // 7. Accessibility preferences
    const settings = data.settings || {
      fontScale: '100',
      highContrast: false,
      largeControls: false,
      reducedMotion: false,
      spokenFeedbackEnabled: true,
      speechRate: 1.0,
    };

    return {
      currentScreen,
      currentRoute,
      activeSessionId: activeSession?.id,
      activeSession,
      focusedElement,
      selectedText,
      activeImage,
      activeDocument,
      currentResult,
      availableActions,
      previousAction: data.previousAction,
      accessibilityPreferences: {
        fontScale: settings.fontScale,
        highContrast: !!settings.highContrast,
        largeControls: !!settings.largeControls,
        reducedMotion: !!settings.reducedMotion,
        spokenFeedback: settings.spokenFeedbackEnabled !== false,
        speechRate: settings.speechRate || 1.0,
      },
    };
  }
}
