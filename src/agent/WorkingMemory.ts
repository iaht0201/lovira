export interface MemoryTurn {
  role: string;
  content: string;
  action?: string;
  intent?: string;
  parameters?: any;
  plan?: any;
  feedback?: string;
  timestamp: string;
}

class WorkingMemory {
  private recentTurns: MemoryTurn[] = [];
  private lastAction: { action: string; parameters?: any; timestamp: string } | null = null;
  private lastPlan: any = null;
  private maxTurns = 10;

  public addTurn(
    arg1: any,
    arg2?: any,
    arg3?: any,
    arg4?: any
  ) {
    let role = 'user';
    let content = '';
    let actionOrIntent: string | undefined;
    let plan: any;
    let feedback: string | undefined;

    if (typeof arg1 === 'string' && (arg1 === 'user' || arg1 === 'assistant')) {
      role = arg1;
      content = arg2 || '';
      actionOrIntent = arg3;
      plan = arg4;
    } else {
      content = String(arg1 || '');
      actionOrIntent = typeof arg2 === 'string' ? arg2 : undefined;
      plan = arg3;
      feedback = typeof arg4 === 'string' ? arg4 : undefined;
    }

    if (plan && Array.isArray(plan)) {
      this.lastPlan = plan;
    }
    if (actionOrIntent) {
      this.lastAction = { action: actionOrIntent, parameters: plan, timestamp: new Date().toISOString() };
    }

    this.recentTurns.push({
      role,
      content,
      action: actionOrIntent,
      intent: actionOrIntent,
      plan,
      feedback,
      timestamp: new Date().toISOString(),
    });

    if (this.recentTurns.length > this.maxTurns) {
      this.recentTurns.shift();
    }
  }

  public recordTurn(
    arg1: any,
    arg2?: any,
    arg3?: any,
    arg4?: any
  ) {
    this.addTurn(arg1, arg2, arg3, arg4);
  }

  public setLastAction(action: string, parameters?: any) {
    this.lastAction = {
      action,
      parameters,
      timestamp: new Date().toISOString(),
    };
  }

  public setLastPlan(plan: any) {
    this.lastPlan = plan;
  }

  public getLastAction() {
    return this.lastAction;
  }

  public getLastPlan() {
    return this.lastPlan;
  }

  public getLastTurn(): MemoryTurn | null {
    if (this.recentTurns.length === 0) return null;
    return this.recentTurns[this.recentTurns.length - 1];
  }

  public getRecentTurns(limit?: number) {
    if (limit && limit > 0) {
      return this.recentTurns.slice(-limit);
    }
    return [...this.recentTurns];
  }

  public clear() {
    this.recentTurns = [];
    this.lastAction = null;
    this.lastPlan = null;
  }
}

export const AgentWorkingMemory = new WorkingMemory();
