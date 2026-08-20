import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
import { speakText, stopSpeaking } from '../lib/speech';
import { AccessibilitySettings, UserProfile } from '../types';
import { LoviraMicCoordinator } from '../components/voice-access/MicrophoneCoordinator';

import { auth } from '../lib/firebase';

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
  deleteSession: (sessionId: string) => void;
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
  userProfile?: UserProfile | null;
}

export const AgentProvider: React.FC<AgentProviderProps> = ({
  children,
  settings,
  onUpdateSettings,
  currentRoute,
  onNavigate,
  userProfile,
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

  const recognitionRef = useRef<any>(null);
  const cancelledRef = useRef<boolean>(false);
  const latestTranscriptRef = useRef<string>('');

  const { executeAction: executeScreenAction, currentScreenInfo } = useScreenActionContext();

  // Subscribe to SessionManager updates and sync cloud sessions
  useEffect(() => {
    const unsub = SessionManager.subscribe((sess) => {
      setActiveSession(sess);
      setAllSessions(SessionManager.getLocalSessions());
    });

    if (auth?.currentUser?.uid) {
      SessionManager.syncCloudSessions(auth.currentUser.uid);
    }

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

  const stopListening = useCallback(() => {
    cancelledRef.current = true;
    LoviraMicCoordinator.releaseMic('AGENT_COMMAND');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {
        console.warn('[AgentController] Error aborting recognition:', e);
      }
      recognitionRef.current = null;
    }

    latestTranscriptRef.current = '';
    setTranscript('');
    setIsListening(false);
    setAgentState('idle');
    setStatusMessage('Đã dừng nghe.');
    stopSpeaking();
  }, []);

  // Clean up recognition and speech when unmounting or navigating away
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

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
            onStopListening: stopListening,
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
    [currentRoute, settings, onNavigate, onUpdateSettings, executeScreenAction, currentScreenInfo, stopListening]
  );

  // Voice Listening setup using Web Speech Recognition with Mic Coordination & Ref guards
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusMessage('Trình duyệt chưa hỗ trợ nhận diện giọng nói trực tiếp.');
      return;
    }

    // Stop speaking if currently speaking
    stopSpeaking();

    // Request exclusive mic ownership
    const micGranted = LoviraMicCoordinator.requestMic('AGENT_COMMAND');
    if (!micGranted) {
      setStatusMessage('Micro đang được tính năng trò chuyện sử dụng. Vui lòng dừng nghe thoại trước.');
      return;
    }

    // Abort existing instance if any
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    cancelledRef.current = false;
    latestTranscriptRef.current = '';
    setTranscript('');

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        if (cancelledRef.current) return;
        setIsListening(true);
        setAgentState('listening');
        setStatusMessage('Đang lắng nghe bạn nói...');
      };

      recognition.onresult = (event: any) => {
        if (cancelledRef.current) return;
        let interimText = '';
        let finalText = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalText += res[0].transcript + ' ';
          } else {
            interimText += res[0].transcript;
          }
        }

        const combined = (finalText + interimText).trim();
        latestTranscriptRef.current = combined;
        setTranscript(combined);
      };

      recognition.onerror = (e: any) => {
        console.warn('[Agent Voice Recognition Error]', e.error);
        LoviraMicCoordinator.releaseMic('AGENT_COMMAND');
        setIsListening(false);

        if (cancelledRef.current || e.error === 'aborted') {
          return;
        }

        setAgentState('error');
        if (e.error === 'not-allowed') {
          setStatusMessage('Quyền truy cập micro bị từ chối. Vui lòng cho phép quyền micro trong trình duyệt.');
        } else if (e.error === 'audio-capture') {
          setStatusMessage('Không tìm thấy micro thu âm trên thiết bị.');
        } else if (e.error === 'no-speech') {
          setStatusMessage('Không nhận được giọng nói. Bạn hãy bấm vào micro để nói lại nhé.');
        } else if (e.error === 'network') {
          setStatusMessage('Lỗi kết nối mạng khi nhận diện giọng nói.');
        } else {
          setStatusMessage('Chưa nghe rõ giọng nói. Bạn hãy thử lại nhé.');
        }

        setTimeout(() => {
          setAgentState('idle');
        }, 3500);
      };

      recognition.onend = () => {
        LoviraMicCoordinator.releaseMic('AGENT_COMMAND');
        setIsListening(false);
        recognitionRef.current = null;

        if (cancelledRef.current) {
          return;
        }

        const capturedText = latestTranscriptRef.current.trim();
        if (capturedText && capturedText.length >= 1) {
          processInput(capturedText);
        } else {
          setAgentState('idle');
          setStatusMessage('Sẵn sàng hỗ trợ bạn.');
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('[Agent Voice Recognition Exception]', err);
      LoviraMicCoordinator.releaseMic('AGENT_COMMAND');
      setIsListening(false);
      setAgentState('idle');
    }
  }, [processInput]);

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
  const deleteSession = (id: string) => SessionManager.deleteSession(id);
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
        deleteSession,
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

