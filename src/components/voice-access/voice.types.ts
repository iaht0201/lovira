export type LoviraVoiceState =
  | 'disabled'
  | 'requesting-permission'
  | 'armed'
  | 'wake-detected'
  | 'listening'
  | 'processing'
  | 'executing'
  | 'speaking'
  | 'paused'
  | 'recovering'
  | 'error';

export type BuiltInLoviraAction =
  | 'START_VOICE_SESSION'
  | 'END_VOICE_SESSION'
  | 'DISABLE_VOICE_ACCESS'
  | 'GO_HOME'
  | 'GO_BACK'
  | 'OPEN_VISION'
  | 'OPEN_CONVERSATION'
  | 'OPEN_EASY_READ'
  | 'OPEN_DOCUMENTS'
  | 'OPEN_HISTORY'
  | 'OPEN_ACCESSIBILITY'
  | 'OPEN_SETTINGS'
  | 'OPEN_CAMERA'
  | 'CAPTURE_IMAGE'
  | 'ANALYZE_SCENE'
  | 'READ_IMAGE_TEXT'
  | 'EXPLAIN_OBJECT'
  | 'SIMPLIFY_CURRENT_TEXT'
  | 'SUMMARIZE_CURRENT_CONTENT'
  | 'INCREASE_FONT'
  | 'DECREASE_FONT'
  | 'SET_FONT_SCALE'
  | 'ENABLE_HIGH_CONTRAST'
  | 'DISABLE_HIGH_CONTRAST'
  | 'ENABLE_REDUCED_MOTION'
  | 'DISABLE_REDUCED_MOTION'
  | 'ENABLE_LARGE_CONTROLS'
  | 'DISABLE_LARGE_CONTROLS'
  | 'READ_PAGE'
  | 'READ_MAIN_CONTENT'
  | 'READ_CURRENT_REGION'
  | 'READ_CURRENT_FOCUS'
  | 'READ_CURRENT_RESULT'
  | 'READ_INTERACTIVE_ELEMENTS'
  | 'READ_NEXT'
  | 'READ_PREVIOUS'
  | 'PAUSE_READING'
  | 'RESUME_READING'
  | 'STOP_READING'
  | 'SPEAK_SLOWER'
  | 'SPEAK_FASTER'
  | 'SAVE_CURRENT_RESULT'
  | 'DESCRIBE_CURRENT_PAGE'
  | 'PREREQUISITE_MISSING'
  | 'CLARIFICATION_REQUIRED'
  | 'UNKNOWN';

export type LoviraAction = BuiltInLoviraAction | string;

export interface ChainedAction {
  action: LoviraAction;
  parameters?: Record<string, unknown>;
  feedback?: string;
}

export interface LoviraVoiceIntent {
  action: LoviraAction;
  confidence: number;
  parameters?: Record<string, unknown>;
  confirmationRequired?: boolean;
  feedback?: string;
  clarificationQuestion?: string;
  chainAction?: ChainedAction;
  suggestedAction?: string;
}

export interface LoviraContextType {
  route: string;
  currentPage: string;
  currentReadableRegionId?: string;
  currentFocusElementId?: string;
  currentImageAvailable: boolean;
  currentDocumentAvailable: boolean;
  currentTextAvailable: boolean;
  currentResultAvailable: boolean;
  selectedText?: string;
  currentResultText?: string;
  cameraOpen: boolean;
  conversationRecording: boolean;
  fontScale: string;
  highContrast: boolean;
  reducedMotion: boolean;
  largeControls: boolean;
  ttsActive: boolean;
  voiceState: LoviraVoiceState;
  lastAction?: LoviraAction;
}

