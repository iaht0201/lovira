import { LifeSession, LifeSessionType, ImportantFact, SessionTask } from './types';

const STORAGE_KEY = 'lovira_life_sessions';
const ACTIVE_SESSION_KEY = 'lovira_active_session_id';

class SessionManagerClass {
  private sessions: LifeSession[] = [];
  private activeSessionId: string | null = null;
  private listeners: Array<(session?: LifeSession | null) => void> = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.sessions = JSON.parse(data);
      }
      this.activeSessionId = localStorage.getItem(ACTIVE_SESSION_KEY) || null;
    } catch {
      this.sessions = [];
      this.activeSessionId = null;
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions));
      if (this.activeSessionId) {
        localStorage.setItem(ACTIVE_SESSION_KEY, this.activeSessionId);
      } else {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    } catch {
      // ignore
    }
    this.notify();
  }

  public subscribe(listener: (session?: LifeSession | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const current = this.getActiveSession();
    this.listeners.forEach((l) => l(current));
  }

  public getActiveSession(): LifeSession | null {
    if (!this.activeSessionId) return null;
    return this.sessions.find((s) => s.id === this.activeSessionId) || null;
  }

  public getAllSessions(): LifeSession[] {
    return [...this.sessions];
  }

  public getLocalSessions(): LifeSession[] {
    return this.getAllSessions();
  }

  public async syncCloudSessions(uid: string): Promise<void> {
    // Synchronize local session archive with cloud
    return;
  }

  public createSession(type: LifeSessionType, title?: string, goal?: string): LifeSession {
    const titles: Record<LifeSessionType, string> = {
      healthcare: 'Phiên đi khám bệnh',
      administrative: 'Phiên làm thủ tục hành chính',
      shopping: 'Phiên đi mua sắm',
      reading: 'Phiên đọc & hiểu tài liệu',
      general: 'Phiên làm việc',
    };

    const newSession: LifeSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      title: title || titles[type] || 'Phiên làm việc mới',
      goal: goal || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      facts: [],
      tasks: [],
      resources: [],
    };

    this.sessions.unshift(newSession);
    this.activeSessionId = newSession.id;
    this.save();
    return newSession;
  }

  public updateSession(id: string, updates: Partial<LifeSession>) {
    const idx = this.sessions.findIndex((s) => s.id === id);
    if (idx !== -1) {
      this.sessions[idx] = {
        ...this.sessions[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
    }
  }

  public pauseActiveSession() {
    const active = this.getActiveSession();
    if (active) {
      this.updateSession(active.id, { status: 'paused' });
    }
  }

  public completeActiveSession() {
    const active = this.getActiveSession();
    if (active) {
      this.updateSession(active.id, { status: 'completed' });
      this.activeSessionId = null;
      this.save();
    }
  }

  public resumeSession(sessionId: string) {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (session) {
      this.activeSessionId = session.id;
      this.updateSession(session.id, { status: 'active' });
    }
  }

  public clearActiveSession() {
    this.activeSessionId = null;
    this.save();
  }

  public deleteSession(sessionId: string) {
    this.sessions = this.sessions.filter((s) => s.id !== sessionId);
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }
    this.save();
  }

  public addFact(fact: Omit<ImportantFact, 'id' | 'createdAt'>) {
    const active = this.getActiveSession();
    if (active) {
      const newFact: ImportantFact = {
        ...fact,
        id: `fact_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      this.updateSession(active.id, {
        facts: [newFact, ...active.facts],
      });
    }
  }

  public addTask(task: Omit<SessionTask, 'id' | 'createdAt'>) {
    const active = this.getActiveSession();
    if (active) {
      const newTask: SessionTask = {
        ...task,
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      this.updateSession(active.id, {
        tasks: [...active.tasks, newTask],
      });
    }
  }

  public toggleTask(taskId: string) {
    const active = this.getActiveSession();
    if (active) {
      const updatedTasks = active.tasks.map((t) => {
        if (t.id === taskId) {
          const nextStatus: SessionTask['status'] = t.status === 'done' ? 'todo' : 'done';
          return { ...t, status: nextStatus };
        }
        return t;
      });
      this.updateSession(active.id, { tasks: updatedTasks });
    }
  }
}

export const SessionManager = new SessionManagerClass();
