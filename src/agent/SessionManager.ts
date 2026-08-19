import {
  LifeSession,
  LifeSessionType,
  ImportantFact,
  SessionTask,
  SessionResource,
  AgentPlanStep,
  ConversationTurn,
} from './types';
import { db, auth, firebaseInitialized } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';

const LOCAL_SESSIONS_KEY = 'lovira_life_sessions_v2';
const LOCAL_ACTIVE_SESSION_ID_KEY = 'lovira_active_session_id_v2';

export const LIFE_MODE_CONFIGS: Record<
  LifeSessionType,
  {
    title: string;
    icon: string;
    defaultGoal: string;
    recommendedTools: string[];
    suggestedTasks: string[];
    initialWelcome: string;
  }
> = {
  healthcare: {
    title: 'Đi khám bệnh',
    icon: '🏥',
    defaultGoal: 'Hoàn thành buổi khám, nắm rõ chỉ dẫn phòng khám, số thứ tự và dặn dò của bác sĩ',
    recommendedTools: ['vision', 'document', 'conversation', 'speech'],
    suggestedTasks: ['Quét phiếu khám hoặc số thứ tự', 'Đến phòng khám được chỉ định', 'Nghe và ghi lại lời dặn của bác sĩ'],
    initialWelcome: 'Tôi đã khởi tạo phiên Đi khám bệnh. Bạn có thể chụp phiếu khám, hóa đơn thuốc hoặc bật micro khi gặp bác sĩ để tôi hỗ trợ nhé.',
  },
  administrative: {
    title: 'Làm thủ tục hành chính',
    icon: '🏛',
    defaultGoal: 'Chuẩn bị đầy đủ giấy tờ, nắm rõ thời hạn và các bước nộp hồ sơ công',
    recommendedTools: ['document', 'vision', 'easyRead', 'speech'],
    suggestedTasks: ['Xem danh sách giấy tờ cần chuẩn bị', 'Kiểm tra thời hạn nộp', 'Giản lược các quy định khó hiểu'],
    initialWelcome: 'Tôi đã tạo phiên Làm thủ tục. Hãy chụp giấy tờ hoặc tải tệp tài liệu để tôi trích xuất danh sách hồ sơ cần có cho bạn.',
  },
  shopping: {
    title: 'Đi mua đồ & siêu thị',
    icon: '🛒',
    defaultGoal: 'Xem nhãn sản phẩm, giá cả, hạn sử dụng và thành phần cần lưu ý',
    recommendedTools: ['vision', 'speech', 'easyRead'],
    suggestedTasks: ['Đọc tên và hạn sử dụng sản phẩm', 'Kiểm tra cảnh báo dị ứng hoặc thành phần', 'Xem giá niêm yết'],
    initialWelcome: 'Tôi đã sẵn sàng cùng bạn đi mua sắm. Hãy đưa camera trước bao bì để tôi đọc nhãn và hạn dùng cho bạn.',
  },
  reading: {
    title: 'Đọc & hiểu tài liệu',
    icon: '📚',
    defaultGoal: 'Hiểu cặn kẽ nội dung văn bản, thông báo hoặc hợp đồng phức tạp',
    recommendedTools: ['document', 'easyRead', 'speech'],
    suggestedTasks: ['Đọc to nội dung', 'Giản lược đoạn khó hiểu', 'Trích xuất thông tin quan trọng'],
    initialWelcome: 'Phiên Đọc & hiểu đã sẵn sàng. Bạn có thể nạp văn bản hoặc tài liệu để tôi tóm tắt và giải thích dễ hiểu.',
  },
  general: {
    title: 'Hỗ trợ việc hàng ngày',
    icon: '🎯',
    defaultGoal: 'Đồng hành và hỗ trợ bất kỳ nhu cầu tiếp cận thông tin nào',
    recommendedTools: ['vision', 'conversation', 'easyRead', 'document', 'speech'],
    suggestedTasks: ['Nói cho Lovira biết bạn cần trợ giúp việc gì'],
    initialWelcome: 'Tôi đã mở phiên hỗ trợ. Bạn muốn Lovira nhìn giúp, nghe giúp hay giải thích điều gì?',
  },
};

export class SessionManager {
  private static activeSession: LifeSession | null = null;
  private static listeners: Array<(session: LifeSession | null) => void> = [];

  public static getActiveSession(): LifeSession | null {
    if (this.activeSession) return this.activeSession;
    try {
      const activeId = localStorage.getItem(LOCAL_ACTIVE_SESSION_ID_KEY);
      if (activeId) {
        const allSessions = this.getLocalSessions();
        const found = allSessions.find((s) => s.id === activeId && s.status === 'active');
        if (found) {
          this.activeSession = found;
          return found;
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  public static subscribe(listener: (session: LifeSession | null) => void): () => void {
    this.listeners.push(listener);
    listener(this.activeSession);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach((l) => l(this.activeSession));
  }

  public static createSession(
    type: LifeSessionType,
    customTitle?: string,
    customGoal?: string
  ): LifeSession {
    const config = LIFE_MODE_CONFIGS[type] || LIFE_MODE_CONFIGS.general;
    const now = Date.now();
    const dateStr = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

    const newSession: LifeSession = {
      id: `session_${type}_${now}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      title: customTitle || `${config.title} — ${dateStr}`,
      goal: customGoal || config.defaultGoal,
      status: 'active',
      currentStep: config.suggestedTasks[0] || 'Bắt đầu',
      nextRecommendedAction: config.suggestedTasks[0] || 'Chụp ảnh hoặc nói với Lovira',
      plan: [],
      completedSteps: [],
      importantFacts: [],
      tasks: config.suggestedTasks.map((t, idx) => ({
        id: `task_${now}_${idx}`,
        title: t,
        status: 'todo',
        createdAt: now,
      })),
      resources: [],
      conversationContext: [
        {
          role: 'assistant',
          content: config.initialWelcome,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.activeSession = newSession;
    this.saveSession(newSession);
    localStorage.setItem(LOCAL_ACTIVE_SESSION_ID_KEY, newSession.id);
    this.notifyListeners();
    return newSession;
  }

  public static updateActiveSession(updates: Partial<LifeSession>): LifeSession | null {
    if (!this.activeSession) return null;
    const updated: LifeSession = {
      ...this.activeSession,
      ...updates,
      updatedAt: Date.now(),
    };
    this.activeSession = updated;
    this.saveSession(updated);
    this.notifyListeners();
    return updated;
  }

  public static addFact(fact: Omit<ImportantFact, 'id' | 'createdAt'>): ImportantFact | null {
    if (!this.activeSession) return null;
    const now = Date.now();
    const newFact: ImportantFact = {
      ...fact,
      id: `fact_${now}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
    };
    const updatedFacts = [...this.activeSession.importantFacts, newFact];
    this.updateActiveSession({ importantFacts: updatedFacts });
    return newFact;
  }

  public static addTask(task: Omit<SessionTask, 'id' | 'createdAt'>): SessionTask | null {
    if (!this.activeSession) return null;
    const now = Date.now();
    const newTask: SessionTask = {
      ...task,
      id: `task_${now}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
    };
    const updatedTasks = [...this.activeSession.tasks, newTask];
    this.updateActiveSession({ tasks: updatedTasks });
    return newTask;
  }

  public static toggleTask(taskId: string): void {
    if (!this.activeSession) return;
    const updatedTasks = this.activeSession.tasks.map((t) => {
      if (t.id === taskId) {
        const nextStatus: 'todo' | 'done' = t.status === 'done' ? 'todo' : 'done';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    this.updateActiveSession({ tasks: updatedTasks });
  }

  public static addResource(resource: Omit<SessionResource, 'id' | 'createdAt'>): SessionResource | null {
    if (!this.activeSession) return null;
    const now = Date.now();
    const newRes: SessionResource = {
      ...resource,
      id: `res_${now}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
    };
    const updatedResources = [...this.activeSession.resources, newRes];
    this.updateActiveSession({ resources: updatedResources });
    return newRes;
  }

  public static addTurn(role: 'user' | 'assistant', content: string): void {
    if (!this.activeSession) return;
    const turn: ConversationTurn = {
      role,
      content,
      timestamp: Date.now(),
    };
    const context = [...(this.activeSession.conversationContext || []), turn].slice(-20);
    this.updateActiveSession({ conversationContext: context });
  }

  public static addPlanStep(step: Omit<AgentPlanStep, 'id'>): AgentPlanStep | null {
    if (!this.activeSession) return null;
    const newStep: AgentPlanStep = {
      ...step,
      id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    const updatedPlan = [...this.activeSession.plan, newStep];
    this.updateActiveSession({ plan: updatedPlan });
    return newStep;
  }

  public static completeStep(stepId: string, output?: unknown): void {
    if (!this.activeSession) return;
    const step = this.activeSession.plan.find((s) => s.id === stepId);
    if (!step) return;

    const completed: AgentPlanStep = {
      ...step,
      status: 'success',
      output,
    };
    const updatedPlan = this.activeSession.plan.filter((s) => s.id !== stepId);
    const updatedCompleted = [...this.activeSession.completedSteps, completed];

    this.updateActiveSession({
      plan: updatedPlan,
      completedSteps: updatedCompleted,
    });
  }

  public static pauseActiveSession(): void {
    if (!this.activeSession) return;
    this.updateActiveSession({ status: 'paused' });
    this.activeSession = null;
    localStorage.removeItem(LOCAL_ACTIVE_SESSION_ID_KEY);
    this.notifyListeners();
  }

  public static completeActiveSession(): void {
    if (!this.activeSession) return;
    this.updateActiveSession({ status: 'completed' });
    this.activeSession = null;
    localStorage.removeItem(LOCAL_ACTIVE_SESSION_ID_KEY);
    this.notifyListeners();
  }

  public static resumeSession(sessionId: string): LifeSession | null {
    const sessions = this.getLocalSessions();
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      target.status = 'active';
      target.updatedAt = Date.now();
      this.activeSession = target;
      this.saveSession(target);
      localStorage.setItem(LOCAL_ACTIVE_SESSION_ID_KEY, target.id);
      this.notifyListeners();
      return target;
    }
    return null;
  }

  public static clearActiveSession(): void {
    if (this.activeSession) {
      this.deleteSession(this.activeSession.id);
    }
    this.activeSession = null;
    localStorage.removeItem(LOCAL_ACTIVE_SESSION_ID_KEY);
    this.notifyListeners();
  }

  /**
   * Generates a context-aware answer for "Giờ tôi phải làm gì?", "Tôi còn thiếu gì?", etc.
   */
  public static getNextStepAdvice(): string {
    if (!this.activeSession) {
      return 'Hiện tại bạn chưa có phiên làm việc nào đang mở. Bạn có thể chọn "Đi khám", "Làm thủ tục", hoặc nói nhu cầu của mình nhé.';
    }

    const session = this.activeSession;
    const todoTasks = session.tasks.filter((t) => t.status === 'todo');
    const doneTasks = session.tasks.filter((t) => t.status === 'done');
    const facts = session.importantFacts;

    let response = `Trong phiên "${session.title}":\n`;

    if (facts.length > 0) {
      const locationFact = facts.find((f) => f.type === 'location');
      const dateFact = facts.find((f) => f.type === 'date');
      const instructionFact = facts.find((f) => f.type === 'instruction');

      if (locationFact) {
        response += `• Địa điểm/Phòng: ${locationFact.value}\n`;
      }
      if (dateFact) {
        response += `• Thời gian/Hạn chót: ${dateFact.value}\n`;
      }
      if (instructionFact) {
        response += `• Dặn dò quan trọng: ${instructionFact.value}\n`;
      }
    }

    if (todoTasks.length > 0) {
      response += `\nBước tiếp theo bạn cần làm:\n👉 ${todoTasks[0].title}`;
      if (todoTasks.length > 1) {
        response += `\n(Còn ${todoTasks.length - 1} việc tiếp theo: ${todoTasks.slice(1, 3).map((t) => t.title).join(', ')})`;
      }
    } else {
      response += `\n🎉 Bạn đã hoàn thành tất cả các mục việc cần làm trong phiên này!`;
    }

    return response;
  }

  // ==================== PERSISTENCE ====================
  public static getLocalSessions(): LifeSession[] {
    try {
      const str = localStorage.getItem(LOCAL_SESSIONS_KEY);
      return str ? JSON.parse(str) : [];
    } catch {
      return [];
    }
  }

  public static async syncCloudSessions(uid: string): Promise<LifeSession[]> {
    if (!firebaseInitialized || !db || !uid) {
      return this.getLocalSessions();
    }

    try {
      const sessionsCol = collection(db, 'users', uid, 'life_sessions');
      const q = query(sessionsCol, orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      const cloudSessions: LifeSession[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as LifeSession;
        cloudSessions.push(data);
      });

      if (cloudSessions.length > 0) {
        // Merge cloud with local sessions (cloud prioritized by updatedAt)
        const local = this.getLocalSessions();
        const map = new Map<string, LifeSession>();
        local.forEach((s) => map.set(s.id, s));
        cloudSessions.forEach((s) => map.set(s.id, s));

        const merged = Array.from(map.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(merged.slice(0, 50)));

        const activeId = localStorage.getItem(LOCAL_ACTIVE_SESSION_ID_KEY);
        if (activeId && map.has(activeId)) {
          this.activeSession = map.get(activeId)!;
        } else if (!this.activeSession) {
          const active = merged.find((s) => s.status === 'active');
          if (active) {
            this.activeSession = active;
            localStorage.setItem(LOCAL_ACTIVE_SESSION_ID_KEY, active.id);
          }
        }

        this.notifyListeners();
        return merged;
      }
    } catch (e) {
      console.warn('[SessionManager] Cloud session sync error:', e);
    }

    return this.getLocalSessions();
  }

  public static async saveSession(session: LifeSession): Promise<void> {
    // 1. Local Storage
    try {
      const all = this.getLocalSessions();
      const filtered = all.filter((s) => s.id !== session.id);
      filtered.unshift(session);
      localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(filtered.slice(0, 50)));
    } catch (e) {
      console.warn('Failed to save session to local storage', e);
    }

    // 2. Firestore sync
    if (firebaseInitialized && db && auth?.currentUser) {
      try {
        const uid = auth.currentUser.uid;
        const sessionRef = doc(db, 'users', uid, 'life_sessions', session.id);
        await setDoc(sessionRef, session, { merge: true });
      } catch (e) {
        console.warn('Firestore session sync error:', e);
      }
    }
  }

  public static async deleteSession(sessionId: string): Promise<void> {
    try {
      const all = this.getLocalSessions();
      const filtered = all.filter((s) => s.id !== sessionId);
      localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(filtered));
      if (this.activeSession?.id === sessionId) {
        this.activeSession = null;
        localStorage.removeItem(LOCAL_ACTIVE_SESSION_ID_KEY);
        this.notifyListeners();
      }
    } catch {
      // ignore
    }

    if (firebaseInitialized && db && auth?.currentUser) {
      try {
        const uid = auth.currentUser.uid;
        const sessionRef = doc(db, 'users', uid, 'life_sessions', sessionId);
        await deleteDoc(sessionRef);
      } catch {
        // ignore
      }
    }
  }
}
