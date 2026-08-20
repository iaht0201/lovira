export type LoviraVoiceState =
  | 'disabled'
  | 'idle'
  | 'armed'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'paused'
  | 'error';

export interface LoviraAction {
  action: string;
  confidence?: number;
  parameters?: Record<string, any>;
  confirmationRequired?: boolean;
  feedback?: string;
  chainAction?: LoviraAction | null;
  suggestedAction?: string | null;
  clarificationQuestion?: string | null;
  [key: string]: any;
}

export interface LoviraVoiceIntent {
  action: string;
  confidence: number;
  parameters?: Record<string, any>;
  confirmationRequired?: boolean;
  feedback: string;
  chainAction?: LoviraAction | null;
  suggestedAction?: string | null;
  clarificationQuestion?: string | null;
  provider?: 'local' | 'groq' | 'gemini';
  [key: string]: any;
}

export interface LoviraContextType {
  route?: string;
  currentPage?: string;
  fontScale?: string;
  highContrast?: boolean;
  reducedMotion?: boolean;
  largeControls?: boolean;
  voiceState?: string;
  currentRoute?: string;
  currentScreen?: string;
  activeSession?: any;
  activeImage?: any;
  activeDocument?: any;
  selectedText?: any;
  currentResult?: any;
  workingMemory?: any;
  recentTurns?: any[];
  [key: string]: any;
}
