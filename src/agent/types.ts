import { AccessibilitySettings } from '../types';

export type LifeSessionType =
  | 'healthcare'
  | 'administrative'
  | 'shopping'
  | 'reading'
  | 'general';

export type LifeSessionStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

export interface ImportantFact {
  id: string;
  type:
    | 'date'
    | 'time'
    | 'location'
    | 'person'
    | 'requirement'
    | 'instruction'
    | 'warning'
    | 'other';
  value: string;
  source?: string;
  confidence?: number;
  createdAt?: number;
}

export interface SessionTask {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  source?: string;
  dueDate?: string;
  confidence?: number;
  createdAt?: number;
}

export interface SessionResource {
  id: string;
  type: 'image' | 'document' | 'audio' | 'text';
  name: string;
  content?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AgentPlanStep {
  id: string;
  action: string;
  reason?: string;
  parameters?: Record<string, unknown>;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  output?: unknown;
  error?: string;
}

export interface LifeSession {
  id: string;
  type: LifeSessionType;
  title: string;
  goal: string;
  status: LifeSessionStatus;
  currentStep?: string;
  nextRecommendedAction?: string;
  plan: AgentPlanStep[];
  completedSteps: AgentPlanStep[];
  importantFacts: ImportantFact[];
  tasks: SessionTask[];
  resources: SessionResource[];
  conversationContext: ConversationTurn[];
  createdAt: number;
  updatedAt: number;
}

export interface AgentActionDefinition {
  id: string;
  label: string;
  description: string;
  category:
    | 'navigation'
    | 'vision'
    | 'document'
    | 'easyRead'
    | 'conversation'
    | 'speech'
    | 'accessibility'
    | 'session'
    | 'general';
  aliases?: string[];
  requires?: string[];
  parameters?: Record<string, unknown>;
  confirmationRequired?: boolean;
}

export interface AgentContext {
  currentScreen: string;
  currentRoute: string;
  activeSessionId?: string;
  activeSession?: LifeSession | null;
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
  availableActions: AgentActionDefinition[];
  previousAction?: AgentActionResult;
  accessibilityPreferences: {
    fontScale: string;
    highContrast: boolean;
    largeControls: boolean;
    reducedMotion: boolean;
    spokenFeedback: boolean;
    speechRate: number;
  };
}

export interface AgentActionResult {
  success: boolean;
  actionId: string;
  result?: unknown;
  error?: string;
  feedback?: string;
  updatedSession?: Partial<LifeSession>;
}

export type AgentState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'planning'
  | 'executing'
  | 'speaking'
  | 'clarifying'
  | 'error';

export interface AgentPlannerResponse {
  intent: string;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestion?: string;
  message: string;
  plan: Array<{
    action: string;
    reason?: string;
    parameters?: Record<string, unknown>;
  }>;
  suggestedSessionType?: LifeSessionType;
  newFacts?: Array<{
    type: ImportantFact['type'];
    value: string;
  }>;
  newTasks?: Array<{
    title: string;
    status?: 'todo' | 'doing' | 'done';
    dueDate?: string;
  }>;
}
