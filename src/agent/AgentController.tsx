import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AgentState,
  AgentPlanStep,
  LifeSession,
  LifeSessionType,
  ImportantFact,
  SessionTask,
} from './types';
import { SessionManager } from './SessionManager';
import { ContextBuilder } from './ContextBuilder';
import { IntentResolver } from './IntentResolver';
import { ActionExecutor } from './ActionExecutor';
import { useScreenActionContext } from '../components/voice-access/ScreenActionRegistry';
import { speakText, stopSpeaking, createSpeechRecognitionInstance } from '../lib/speech';
import { AccessibilitySettings } from '../types';

interface AgentContextType {
  agentState: AgentState;
  statusMessage: string;
  activeSession: LifeSession | null;
  allSessions: LifeSession[];
  activePlan: AgentPlanStep[];
  currentStepIndex: number;
  totalSteps: number;
  isListening: boolean;
  transcript: string;
  isLifeModalOpen: boolean;
  setIsLifeModalOpen: (open: boolean) => void;
  startListening: () => void;
  stopListening: () => void;
  processInput: (input: string) => Promise<void>;
  createSession: (type: LifeSessionType, title?: string, goal?: string) => LifeSession;
  pauseSession: () => void;
  completeSession: () => void;
  resumeSession: (sessionId: string) => void;
  clearSession: () => void;
  toggleTask: (taskId: string) => void;
  addFact: (fact: Omit<ImportantFact, 'id' | 'createdAt'>) => void;
  addTask: (task: Omit<SessionTask, 'id' | 'createdAt'>) => void;
}

const AgentContext = createContext<AgentContextType | null>(null);

export interface AgentProviderProps {
  children: React.ReactNode;
  settings: AccessibilitySettings;
  onUpdateSettings: (settings: Partial<AccessibilitySettings>) => void;
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const AgentProvider: React.FC<AgentProviderProps> = ({
  children,
  settings,
  onUpdateSettings,
  currentRoute,
  onNavigate,
}) => {
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Sẵn sàng hỗ trợ bạn.');
  const [activeSession, setActiveSession] = useState<LifeSession | null>(() =>
    SessionManager.getActiveSession()
  );
  const [allSessions, setAllSessions] = useState<LifeSession[]>(() =>
    SessionManager.getLocalSessions()
  );
  const [activePlan, setActivePlan] = useState<AgentPlanStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLifeModalOpen, setIsLifeModalOpen] = useState(false);

  const { executeAction: executeScreenAction, currentScreenInfo } = useScreenActionContext();

  // Subscribe to SessionManager updates
  useEffect(() => {
    const unsub = SessionManager.subscribe((sess) => {
      setActiveSession(sess);
      setAllSessions(SessionManager.getLocalSessions());
    });
    return unsub;
  }, []);

  const getCustomApiKey = (): string | undefined => {
    try {
      return (
        localStorage.getItem('lovira_custom_gemini_api_key') ||
        localStorage.getItem('lovira_custom_gemini_key') ||
        undefined
      );
    } catch {
      return undefined;
    }
  };

  const processInput = useCallback(
    async (rawInput: string) => {
      const input = rawInput.trim();
      if (!input) return;

      setAgentState('thinking');
      setStatusMessage('Đang phân tích yêu cầu...');

      try {
        // 1. Build current AgentContext
        const context = ContextBuilder.buildContext({
          currentRoute,
          settings,
          screenSpecificActions: currentScreenInfo?.actions as any,
        });

        // 2. Resolve intent & plan (Hybrid Layer 1 -> Layer 2 -> Layer 3)
        const resolved = await IntentResolver.resolveIntent(input, context, getCustomApiKey());

        if (resolved.needsClarification) {
          setAgentState('clarifying');
          setStatusMessage(resolved.clarificationQuestion || resolved.feedback);
          if (settings.spokenFeedbackEnabled) {
            speakText(resolved.clarificationQuestion || resolved.feedback, {
              rate: settings.speechRate || 1.0,
            });
          }
          return;
        }

        if (resolved.plan && resolved.plan.length > 0) {
          setAgentState('executing');
          setStatusMessage('Đang thực hiện...');
          setActivePlan(
            resolved.plan.map((p, idx) => ({
              id: `plan_${Date.now()}_${idx}`,
              action: p.action,
              reason: p.reason,
              parameters: p.parameters,
              status: 'pending',
            }))
          );
          setTotalSteps(resolved.plan.length);
          setCurrentStepIndex(0);

          const result = await ActionExecutor.executePlan(resolved.plan, {
            onNavigate,
            onUpdateSettings,
            executeScreenAction: async (actionId, params) => {
              const res = await executeScreenAction(actionId, params);
              return { success: res.success, result: res.result, error: res.error };
            },
            getCurrentContext: () =>
              ContextBuilder.buildContext({
                currentRoute,
                settings,
                screenSpecificActions: currentScreenInfo?.actions as any,
              }),
            onStateChange: (_step, index, total) => {
              setCurrentStepIndex(index + 1);
              setTotalSteps(total);
            },
          });

          if (result.success) {
            setAgentState('speaking');
            const feedbackText = resolved.feedback || result.feedback || 'Đã hoàn thành.';
            setStatusMessage(feedbackText);
            if (settings.spokenFeedbackEnabled) {
              speakText(feedbackText, {
                rate: settings.speechRate || 1.0,
                onEnd: () => setAgentState('idle'),
              });
            } else {
              setTimeout(() => setAgentState('idle'), 2500);
            }
          } else {
            setAgentState('error');
            const errMsg = result.error || 'Chưa hoàn thành được bước này.';
            setStatusMessage(errMsg);
            if (settings.spokenFeedbackEnabled) {
              speakText(errMsg, { rate: settings.speechRate || 1.0 });
            }
            setTimeout(() => setAgentState('idle'), 4000);
          }
        } else {
          setAgentState('idle');
          setStatusMessage(resolved.feedback);
          if (settings.spokenFeedbackEnabled) {
            speakText(resolved.feedback, { rate: settings.speechRate || 1.0 });
          }
        }
      } catch (err: any) {
        console.error('[AgentController] Error:', err);
        setAgentState('error');
        setStatusMessage(err?.message || 'Có sự cố khi xử lý yêu cầu.');
        setTimeout(() => setAgentState('idle'), 3000);
      }
    },
    [currentRoute, settings, onNavigate, onUpdateSettings, executeScreenAction, currentScreenInfo]
  );

  // Voice Listening setup using Web Speech Recognition
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusMessage('Trình duyệt chưa hỗ trợ nhận diện giọng nói trực tiếp.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setAgentState('listening');
        setStatusMessage('Đang lắng nghe bạn nói...');
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setTranscript(text);
      };

      recognition.onerror = (e: any) => {
        console.warn('[Agent Voice Recognition Error]', e);
        setIsListening(false);
        setAgentState('idle');
        setStatusMessage('Chưa nghe rõ giọng nói. Bạn hãy thử lại nhé.');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcript && transcript.trim().length > 1) {
          processInput(transcript);
        } else {
          setAgentState('idle');
          setStatusMessage('Sẵn sàng.');
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('[Agent Voice Recognition Exception]', err);
      setIsListening(false);
      setAgentState('idle');
    }
  }, [processInput, transcript]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setAgentState('idle');
    stopSpeaking();
  }, []);

  const createSession = (type: LifeSessionType, title?: string, goal?: string) => {
    const sess = SessionManager.createSession(type, title, goal);
    onNavigate('/session');
    return sess;
  };

  const pauseSession = () => SessionManager.pauseActiveSession();
  const completeSession = () => SessionManager.completeActiveSession();
  const resumeSession = (id: string) => {
    SessionManager.resumeSession(id);
    onNavigate('/session');
  };
  const clearSession = () => SessionManager.clearActiveSession();
  const toggleTask = (taskId: string) => SessionManager.toggleTask(taskId);
  const addFact = (fact: Omit<ImportantFact, 'id' | 'createdAt'>) => SessionManager.addFact(fact);
  const addTask = (task: Omit<SessionTask, 'id' | 'createdAt'>) => SessionManager.addTask(task);

  return (
    <AgentContext.Provider
      value={{
        agentState,
        statusMessage,
        activeSession,
        allSessions,
        activePlan,
        currentStepIndex,
        totalSteps,
        isListening,
        transcript,
        isLifeModalOpen,
        setIsLifeModalOpen,
        startListening,
        stopListening,
        processInput,
        createSession,
        pauseSession,
        completeSession,
        resumeSession,
        clearSession,
        toggleTask,
        addFact,
        addTask,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};
