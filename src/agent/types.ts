export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'executing' | 'clarifying' | 'error';

export type LifeSessionType = 'healthcare' | 'administrative' | 'shopping' | 'reading' | 'general';

export interface ImportantFact {
  id: string;
  type?: 'date' | 'time' | 'location' | 'person' | 'requirement' | 'instruction' | 'warning' | 'medication' | 'deadline' | 'contact' | 'other' | string;
  category?: 'date' | 'time' | 'location' | 'person' | 'requirement' | 'instruction' | 'warning' | 'medication' | 'deadline' | 'contact' | 'other' | string;
  value?: string;
  fact?: string;
  source?: string;
  createdAt: string;
}

export interface SessionTask {
  id: string;
  title?: string;
  text?: string;
  status: 'todo' | 'doing' | 'done';
  createdAt: string;
}

export interface SessionResource {
  id: string;
  title: string;
  type: 'image' | 'text' | 'document' | 'audio';
  uri?: string;
  data?: any;
}

export interface LifeSession {
  id: string;
  type: LifeSessionType;
  title: string;
  goal?: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
  facts: ImportantFact[];
  tasks: SessionTask[];
  resources?: SessionResource[];
  summary?: string;
  transcript?: string;
}

export interface AgentPlanStep {
  action: string;
  reason?: string;
  parameters?: Record<string, any>;
  status?: 'pending' | 'running' | 'completed' | 'failed';
}

export interface AgentPlanResponse {
  intent: string;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestion?: string | null;
  message: string;
  plan: AgentPlanStep[];
  suggestedSessionType?: LifeSessionType | null;
  newFacts?: Array<{ type?: string; category?: string; value?: string; fact?: string }>;
  newTasks?: Array<{ title?: string; text?: string; status: SessionTask['status'] }>;
}
