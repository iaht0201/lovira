export type FontScale = '100' | '125' | '150' | '175';
export type ThemeMode = 'light' | 'dark' | 'system';
export type LanguageCode = 'vi' | 'en';

export interface AccessibilitySettings {
  fontScale: FontScale;
  highContrast: boolean;
  reducedMotion: boolean;
  largeControls: boolean;
  autoReadResponses: boolean;
  captionsEnabled: boolean;
  easyReadDefault: boolean;
  preferredLanguage: LanguageCode;
  theme: ThemeMode;
  speechRate: number; // 0.8, 1, 1.2
  voiceVariant?: 'female1' | 'male1' | 'female2' | string;
  voiceURI?: string;
  voiceAccessEnabled?: boolean;
  spokenFeedbackEnabled?: boolean;
  doubleTapShortcutEnabled?: boolean;
  preferredAIProvider?: 'groq' | 'gemini';
  geminiFallbackPolicy?: 'ask' | 'groq';
}

export interface UserProfile {
  uid: string;
  isAnonymous: boolean;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  settings: AccessibilitySettings;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DetectedObject {
  name: string;
  description?: string;
  position?: string;
}

export interface VisionResult {
  summary: string;
  details: string[];
  detectedText: string[];
  objects: DetectedObject[];
  possibleHazards: string[];
  confidenceNote?: string;
}

export interface DifficultTerm {
  term: string;
  explanation: string;
}

export interface EasyReadResult {
  title?: string;
  summary: string;
  simplifiedText: string;
  keyPoints: string[];
  steps?: string[];
  importantDates?: string[];
  warnings?: string[];
  difficultTerms?: DifficultTerm[];
}

export interface ConversationSummary {
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: string[];
  datesAndDeadlines: string[];
}

export interface DocumentAnalysis {
  title?: string;
  summary: string;
  keyPoints: string[];
  requirements: string[];
  actions: string[];
  importantDates: string[];
  contacts: string[];
  warnings: string[];
}

export type ActivityType = 'vision' | 'conversation' | 'easy-read' | 'document';

export interface ActivityHistory {
  id: string;
  type: ActivityType;
  title: string;
  preview: string;
  createdAt: string; // ISO string or timestamp string
  data: Record<string, unknown>;
}

export interface GeminiApiRequest {
  task: 'vision' | 'easy-read' | 'conversation-summary' | 'document-analysis' | 'document-qa';
  payload: Record<string, unknown>;
  language?: LanguageCode;
  customApiKey?: string;
}
