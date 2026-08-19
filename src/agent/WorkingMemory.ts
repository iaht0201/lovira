export interface WorkingMemoryTurn {
  userUtterance: string;
  intent: string;
  plan: Array<{ action: string; parameters?: Record<string, unknown>; reason?: string }>;
  feedback: string;
  timestamp: number;
}

const STORAGE_KEY = 'lovira_agent_working_memory_v1';

export class AgentWorkingMemory {
  private static turns: WorkingMemoryTurn[] = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();

  private static lastGoal: string | null = null;

  public static recordTurn(
    userUtterance: string,
    intent: string,
    plan: Array<{ action: string; parameters?: Record<string, unknown>; reason?: string }>,
    feedback: string
  ): void {
    const turn: WorkingMemoryTurn = {
      userUtterance,
      intent,
      plan,
      feedback,
      timestamp: Date.now(),
    };

    this.turns.push(turn);
    if (this.turns.length > 20) {
      this.turns.shift();
    }

    if (intent && intent !== 'UNKNOWN' && intent !== 'EMPTY_INPUT') {
      this.lastGoal = userUtterance;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.turns.slice(-10)));
    } catch {
      // ignore
    }
  }

  public static getRecentTurns(limit: number = 5): WorkingMemoryTurn[] {
    return this.turns.slice(-limit);
  }

  public static getLastTurn(): WorkingMemoryTurn | undefined {
    return this.turns[this.turns.length - 1];
  }

  public static getLastPlan(): Array<{ action: string; parameters?: Record<string, unknown>; reason?: string }> | null {
    const last = this.getLastTurn();
    return last?.plan && last.plan.length > 0 ? last.plan : null;
  }

  public static getLastGoal(): string | null {
    return this.lastGoal || this.getLastTurn()?.userUtterance || null;
  }

  public static clear(): void {
    this.turns = [];
    this.lastGoal = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
