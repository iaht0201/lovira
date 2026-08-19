import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { LoviraVoiceState, LoviraAction, LoviraVoiceIntent, LoviraContextType } from './voice.types';
import { matchLocalIntent } from './localIntentMatcher';
import { LoviraSpeechManager } from './SpeechManager';
import { LoviraMicCoordinator } from './MicrophoneCoordinator';
import { LoviraReadingEngine } from './ReadingEngine';
import { AccessibilitySettings, UserProfile } from '../../types';
import { useScreenActionContext, GLOBAL_APP_ACTIONS } from './ScreenActionRegistry';
import { AgentWorkingMemory } from '../../agent/WorkingMemory';
import { SessionManager } from '../../agent/SessionManager';

interface VoiceAccessContextValue {
  voiceState: LoviraVoiceState;
  activateSession: () => void;
  deactivateSession: () => void;
  setContextData: (data: Partial<LoviraContextType>) => void;
  lastAction?: LoviraAction;
  speakText: (text: string, onEnd?: () => void) => void;
  stopSpeaking: () => void;
}

const VoiceAccessContext = createContext<VoiceAccessContextValue | undefined>(undefined);

export const useVoiceAccess = () => {
  const context = useContext(VoiceAccessContext);
  if (!context) {
    throw new Error('useVoiceAccess must be used within a VoiceAccessProvider');
  }
  return context;
};

interface ProviderProps {
  children: React.ReactNode;
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  currentRoute: string;
  onNavigate: (route: string) => void;
  userProfile: UserProfile | null;
}

export const VoiceAccessProvider: React.FC<ProviderProps> = ({
  children,
  settings,
  onUpdateSettings,
  currentRoute,
  onNavigate,
  userProfile,
}) => {
  const {
    currentScreenInfo,
    getAvailableActionsForAI,
    executeAction: executeScreenAction,
  } = useScreenActionContext();

  const [voiceState, setVoiceState] = useState<LoviraVoiceState>('disabled');
  const [lastAction, setLastAction] = useState<LoviraAction | undefined>(undefined);
  
  // Local application state context for semantic AI routing
  const contextRef = useRef<LoviraContextType>({
    route: currentRoute,
    currentPage: currentRoute.replace('/', '') || 'dashboard',
    currentImageAvailable: false,
    currentDocumentAvailable: false,
    currentTextAvailable: false,
    currentResultAvailable: false,
    cameraOpen: false,
    conversationRecording: false,
    fontScale: settings.fontScale,
    highContrast: settings.highContrast,
    reducedMotion: settings.reducedMotion,
    largeControls: settings.largeControls,
    ttsActive: false,
    voiceState: 'disabled',
  });

  const recognitionRef = useRef<any>(null);
  const isArmedRef = useRef<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const consecutiveErrorsRef = useRef<number>(0);
  const silenceTimeoutRef = useRef<any>(null);

  // Read Gemini BYOK from local storage if any
  const getCustomGeminiKey = () => {
    try {
      return localStorage.getItem('lovira_custom_gemini_api_key') || undefined;
    } catch {
      return undefined;
    }
  };

  const getSpeechRate = () => {
    return settings.speechRate || 1.0;
  };

  const getVoiceURI = () => {
    return settings.preferredVoiceURI || undefined;
  };

  // Sync state context
  useEffect(() => {
    contextRef.current.route = currentRoute;
    contextRef.current.currentPage = currentRoute.replace('/', '') || 'dashboard';
    contextRef.current.fontScale = settings.fontScale;
    contextRef.current.highContrast = settings.highContrast;
    contextRef.current.reducedMotion = settings.reducedMotion;
    contextRef.current.largeControls = settings.largeControls;
    contextRef.current.voiceState = voiceState;
  }, [currentRoute, settings, voiceState]);

  const setContextData = (data: Partial<LoviraContextType>) => {
    contextRef.current = { ...contextRef.current, ...data };
  };

  // Stop TTS reading
  const stopSpeaking = () => {
    LoviraSpeechManager.stop();
    isSpeakingRef.current = false;
    deactivateSession();
  };

  // Speaks feedback text with prevention of self-recognition
  const speakText = (text: string, onEnd?: () => void) => {
    if (!settings.spokenFeedbackEnabled) {
      onEnd?.();
      return;
    }

    console.log(`[PWA Voice] Speaking: "${text}"`);
    isSpeakingRef.current = true;
    setVoiceState('speaking');

    // Pause recognition during speech to avoid self-audio loop
    pauseRecognition();

    LoviraSpeechManager.speak(text, {
      rate: getSpeechRate(),
      voiceURI: getVoiceURI(),
      onEnd: () => {
        isSpeakingRef.current = false;
        onEnd?.();
      },
      onError: () => {
        isSpeakingRef.current = false;
        onEnd?.();
      },
    });
  };

  // Manual session triggers - Single-sentence 2-click on-demand session
  const activateSession = () => {
    if (!settings.voiceAccessEnabled) return;
    
    if (isSpeakingRef.current) {
      LoviraSpeechManager.stop();
      isSpeakingRef.current = false;
    }

    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

    isArmedRef.current = false;
    isListeningRef.current = true;
    setVoiceState('listening');
    startRecognitionInstance();

    // Auto-timeout after 8s if user doesn't say anything
    silenceTimeoutRef.current = setTimeout(() => {
      console.log('[PWA Voice] Silence timeout reached. Closing session.');
      deactivateSession();
    }, 8000);
  };

  const deactivateSession = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    isArmedRef.current = true;
    isListeningRef.current = false;
    pauseRecognition();
    LoviraMicCoordinator.releaseMic('VOICE_ACCESS');
    setVoiceState(settings.voiceAccessEnabled ? 'armed' : 'disabled');
  };

  // Central Action Executor mapping to real application commands
  const executeAction = async (intent: LoviraVoiceIntent) => {
    const { action, feedback, parameters, chainAction } = intent;
    console.log(`[PWA Voice] Executing action: ${action} with parameters:`, parameters);
    setLastAction(action);

    const finishWithFeedback = (fb: string, onDone?: () => void) => {
      if (settings.spokenFeedbackEnabled && fb) {
        speakText(fb, () => {
          onDone?.();
          deactivateSession();
        });
      } else {
        onDone?.();
        deactivateSession();
      }
    };

    // 1. Handle prerequisite missing (Case 7)
    if (action === 'PREREQUISITE_MISSING') {
      finishWithFeedback(feedback || 'Chưa đủ điều kiện để thực hiện hành động này.');
      return;
    }

    // 2. Handle clarification required (Case 8)
    if (action === 'CLARIFICATION_REQUIRED') {
      finishWithFeedback(feedback || intent.clarificationQuestion || 'Bạn có thể nói rõ hơn thao tác mong muốn không?');
      return;
    }

    // 3. Check if action is registered on the current screen (Case 2, 3, 4 screen actions)
    if (currentScreenInfo) {
      const isScreenAction = currentScreenInfo.actions.some(
        (a) => a.id.toLowerCase() === action.toLowerCase()
      );

      if (isScreenAction) {
        const res = await executeScreenAction(action, parameters);
        if (res.success) {
          finishWithFeedback(feedback || 'Đã thực hiện xong.');
        } else {
          finishWithFeedback(res.error || feedback || 'Không thể thực hiện hành động này.');
        }
        return;
      }
    }

    // 4. Handle Global & Navigation Actions (Support both canonical and legacy IDs)
    switch (action) {
      case 'START_VOICE_SESSION':
      case 'agent.startListening':
        activateSession();
        break;

      case 'END_VOICE_SESSION':
      case 'agent.stopListening':
        deactivateSession();
        break;

      case 'DISABLE_VOICE_ACCESS':
      case 'accessibility.disableVoiceAccess':
        onUpdateSettings({ voiceAccessEnabled: false });
        finishWithFeedback('Đã tắt chế độ điều khiển bằng giọng nói.');
        break;

      case 'GO_HOME':
      case 'navigation.home':
        onNavigate('/');
        finishWithFeedback(feedback || 'Được rồi, Lovira đã đưa bạn về Trang chủ. Nhiệm vụ đang làm vẫn được giữ.');
        break;

      case 'GO_BACK':
      case 'navigation.back':
        window.history.back();
        finishWithFeedback(feedback || 'Lovira đang quay lại màn hình trước.');
        break;

      case 'OPEN_VISION':
      case 'OPEN_CAMERA':
      case 'navigation.openVision':
        onNavigate('/vision');
        if (chainAction) {
          setTimeout(() => {
            if (chainAction.action === 'vision.openCamera' || chainAction.action === 'openCamera') {
              document.dispatchEvent(new CustomEvent('lovira-voice-open-camera'));
            }
            executeScreenAction(chainAction.action as string, chainAction.parameters);
          }, 350);
        }
        finishWithFeedback(feedback || 'Lovira đã mở Nhìn giúp tôi.');
        break;

      case 'OPEN_CONVERSATION':
      case 'navigation.openConversation':
        onNavigate('/conversation');
        if (chainAction) {
          setTimeout(() => {
            executeScreenAction(chainAction.action as string, chainAction.parameters);
          }, 450);
        }
        finishWithFeedback(feedback || 'Lovira đã mở Nghe & ghi lại.');
        break;

      case 'OPEN_EASY_READ':
      case 'navigation.openEasyRead':
        onNavigate('/easy-read');
        if (chainAction) {
          setTimeout(() => {
            executeScreenAction(chainAction.action as string, chainAction.parameters);
          }, 450);
        }
        finishWithFeedback(feedback || 'Lovira đã mở Làm nội dung dễ hiểu.');
        break;

      case 'OPEN_DOCUMENTS':
      case 'navigation.openDocuments':
      case 'navigation.openDocument':
        onNavigate('/documents');
        if (chainAction) {
          setTimeout(() => {
            executeScreenAction(chainAction.action as string, chainAction.parameters);
          }, 450);
        }
        finishWithFeedback(feedback || 'Lovira đã mở Hiểu tài liệu.');
        break;

      case 'OPEN_HISTORY':
      case 'navigation.openHistory':
        onNavigate('/history');
        finishWithFeedback(feedback || 'Lovira đã mở Lịch sử.');
        break;

      case 'OPEN_ACCESSIBILITY':
      case 'OPEN_SETTINGS':
      case 'navigation.openSettings':
        onNavigate('/settings');
        if (chainAction) {
          setTimeout(() => {
            executeAction({ action: chainAction.action as any, parameters: chainAction.parameters, confidence: 1.0 });
          }, 450);
        }
        finishWithFeedback(feedback || 'Lovira đã mở Cài đặt & Trợ năng.');
        break;

      case 'OPEN_SESSION':
      case 'navigation.openSession':
      case 'session.open':
        onNavigate('/session');
        finishWithFeedback(feedback || 'Lovira đã mở chi tiết phiên làm việc.');
        break;

      case 'session.create': {
        const type = (parameters?.type as string) || 'general';
        const event = new CustomEvent('lovira-create-session', { detail: { type } });
        document.dispatchEvent(event);
        onNavigate('/session');
        finishWithFeedback(feedback || 'Lovira đã tạo phiên đời sống mới cho bạn.');
        break;
      }

      case 'session.getNextStep': {
        const event = new CustomEvent('lovira-get-next-step');
        document.dispatchEvent(event);
        finishWithFeedback(feedback || 'Lovira đang kiểm tra bước tiếp theo trong phiên của bạn.');
        break;
      }

      case 'INCREASE_FONT':
      case 'accessibility.increaseFont': {
        const nextScales: Record<string, string> = { '100': '125', '125': '150', '150': '175', '175': '175' };
        onUpdateSettings({ fontScale: nextScales[settings.fontScale] as any });
        finishWithFeedback(feedback || 'Lovira đã tăng cỡ chữ lên một mức.');
        break;
      }

      case 'DECREASE_FONT':
      case 'accessibility.decreaseFont': {
        const prevScales: Record<string, string> = { '175': '150', '150': '125', '125': '100', '100': '100' };
        onUpdateSettings({ fontScale: prevScales[settings.fontScale] as any });
        finishWithFeedback(feedback || 'Lovira đã giảm cỡ chữ xuống một mức.');
        break;
      }

      case 'ENABLE_HIGH_CONTRAST':
      case 'accessibility.enableHighContrast':
        onUpdateSettings({ highContrast: true });
        finishWithFeedback(feedback || 'Lovira đã bật tương phản cao.');
        break;

      case 'DISABLE_HIGH_CONTRAST':
      case 'accessibility.disableHighContrast':
        onUpdateSettings({ highContrast: false });
        finishWithFeedback(feedback || 'Lovira đã trở về độ tương phản thông thường.');
        break;

      case 'ENABLE_REDUCED_MOTION':
      case 'accessibility.enableReducedMotion':
        onUpdateSettings({ reducedMotion: true });
        finishWithFeedback(feedback || 'Lovira đã bật giảm chuyển động.');
        break;

      case 'DISABLE_REDUCED_MOTION':
      case 'accessibility.disableReducedMotion':
        onUpdateSettings({ reducedMotion: false });
        finishWithFeedback(feedback || 'Lovira đã tắt giảm chuyển động.');
        break;

      case 'ENABLE_LARGE_CONTROLS':
      case 'accessibility.enableLargeControls':
        onUpdateSettings({ largeControls: true });
        finishWithFeedback(feedback || 'Lovira đã kích hoạt chế độ nút lớn trợ năng.');
        break;

      case 'DISABLE_LARGE_CONTROLS':
      case 'accessibility.disableLargeControls':
        onUpdateSettings({ largeControls: false });
        finishWithFeedback(feedback || 'Lovira đã trở về kích thước nút bấm tiêu chuẩn.');
        break;

      case 'STOP_READING':
      case 'speech.stop':
        stopSpeaking();
        deactivateSession();
        break;

      case 'SPEAK_SLOWER':
      case 'speech.slower': {
        const nextRate = Math.max(0.6, settings.speechRate - 0.15);
        onUpdateSettings({ speechRate: nextRate });
        finishWithFeedback(feedback || 'Lovira đã giảm tốc độ đọc.');
        break;
      }

      case 'SPEAK_FASTER':
      case 'speech.faster': {
        const nextRate = Math.min(2.0, settings.speechRate + 0.15);
        onUpdateSettings({ speechRate: nextRate });
        finishWithFeedback(feedback || 'Lovira đã tăng tốc độ đọc.');
        break;
      }

      case 'DESCRIBE_CURRENT_PAGE': {
        const desc = LoviraReadingEngine.describePage(currentRoute);
        finishWithFeedback(desc);
        break;
      }

      case 'READ_PAGE':
      case 'speech.readCurrent':
        LoviraReadingEngine.readPage(currentRoute, getSpeechRate(), getVoiceURI());
        deactivateSession();
        break;

      case 'READ_CURRENT_RESULT':
      case 'speech.readResult':
        LoviraReadingEngine.readCurrentResult(getSpeechRate(), getVoiceURI());
        deactivateSession();
        break;

      case 'READ_CURRENT_REGION':
        LoviraReadingEngine.readCurrentRegion(getSpeechRate(), getVoiceURI());
        deactivateSession();
        break;

      case 'READ_NEXT':
        LoviraReadingEngine.readNextRegion(getSpeechRate(), getVoiceURI());
        deactivateSession();
        break;

      case 'READ_PREVIOUS':
        LoviraReadingEngine.readPreviousRegion(getSpeechRate(), getVoiceURI());
        deactivateSession();
        break;

      case 'READ_CURRENT_FOCUS':
        LoviraReadingEngine.readCurrentFocus(getSpeechRate(), getVoiceURI());
        deactivateSession();
        break;

      case 'READ_INTERACTIVE_ELEMENTS':
        LoviraReadingEngine.readInteractiveElements(getSpeechRate(), getVoiceURI());
        deactivateSession();
        break;

      case 'CAPTURE_IMAGE':
      case 'vision.capture': {
        const event = new CustomEvent('lovira-voice-capture');
        document.dispatchEvent(event);
        finishWithFeedback(feedback || 'Đang chụp ảnh.');
        break;
      }

      case 'RETRY_LAST_ACTION': {
        const lastPlan = AgentWorkingMemory.getLastPlan();
        const lastTurn = AgentWorkingMemory.getLastTurn();
        if (lastPlan && lastPlan.length > 0) {
          const firstStep = lastPlan[0];
          executeAction({
            action: firstStep.action as any,
            parameters: firstStep.parameters,
            confidence: 1.0,
            feedback: feedback || 'Đang thực hiện lại thao tác cho bạn.',
          });
        } else if (lastTurn && lastTurn.intent && lastTurn.intent !== 'RETRY_LAST_ACTION') {
          executeAction({
            action: lastTurn.intent as any,
            confidence: 1.0,
            feedback: feedback || 'Đang thực hiện lại thao tác cho bạn.',
          });
        } else {
          finishWithFeedback('Chưa có thao tác trước đó để thực hiện lại.');
        }
        break;
      }

      default:
        finishWithFeedback(feedback || 'Lovira chưa hỗ trợ lệnh này.');
        break;
    }
  };

  // Call backend semantic router for natural language requests
  const processSemanticVoiceCommand = async (command: string) => {
    setVoiceState('processing');
    try {
      const screenContext = getAvailableActionsForAI();
      const recentTurns = AgentWorkingMemory.getRecentTurns(5);
      const workingMemory = AgentWorkingMemory.getLastTurn();
      const activeSession = SessionManager.getActiveSession();

      const response = await fetch('/api/ai/voice-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovira-client': 'pwa-voice-client',
        },
        body: JSON.stringify({
          command,
          context: contextRef.current,
          screenContext,
          globalActions: GLOBAL_APP_ACTIONS,
          customApiKey: getCustomGeminiKey(),
          recentTurns,
          workingMemory,
          activeSession,
        }),
      });

      if (!response.ok) {
        throw new Error('Hệ thống xử lý lệnh giọng nói gặp sự cố.');
      }

      const result = await response.json();
      if (result.success && result.data) {
        // Record into working memory for conversational continuity
        AgentWorkingMemory.recordTurn(
          command,
          result.data.action,
          result.data.chainAction
            ? [
                { action: result.data.action, parameters: result.data.parameters },
                { action: result.data.chainAction.action, parameters: result.data.chainAction.parameters },
              ]
            : [{ action: result.data.action, parameters: result.data.parameters }],
          result.data.feedback || ''
        );
        await executeAction(result.data);
      } else {
        if (settings.spokenFeedbackEnabled) {
          speakText('Lovira chưa hiểu rõ yêu cầu này.', () => deactivateSession());
        } else {
          deactivateSession();
        }
      }
    } catch (err) {
      console.warn('[PWA Voice] Semantic route note:', err);
      if (settings.spokenFeedbackEnabled) {
        speakText('Có sự cố kết nối khi hiểu câu lệnh.', () => deactivateSession());
      } else {
        deactivateSession();
      }
    }
  };

  // Core Speech Recognition event logic
  const handleRecognizedText = (text: string) => {
    if (!text || text.trim().length === 0) return;
    const command = text.trim();
    console.log(`[PWA Voice] Recognized text: "${command}"`);

    // Reset silence timeout
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

    // Stop recognition immediately since we captured the user's sentence
    pauseRecognition();

    // Check fast local matcher with current screen available actions
    const screenActions = currentScreenInfo?.actions.map((a) => ({
      id: a.id,
      label: a.label,
      aliases: a.aliases,
      isSatisfied: a.prerequisites ? a.prerequisites.isSatisfied : true,
      missingReason: a.prerequisites?.missingReason,
      promptForMissing: a.prerequisites?.promptForMissing,
    }));

    const localMatch = matchLocalIntent(command, screenActions);
    if (localMatch) {
      if (localMatch.action !== 'RETRY_LAST_ACTION') {
        AgentWorkingMemory.recordTurn(
          command,
          localMatch.action,
          localMatch.chainAction
            ? [
                { action: localMatch.action, parameters: localMatch.parameters },
                { action: localMatch.chainAction.action, parameters: localMatch.chainAction.parameters },
              ]
            : [{ action: localMatch.action, parameters: localMatch.parameters }],
          localMatch.feedback || ''
        );
      }
      executeAction(localMatch);
    } else {
      // Send to semantic AI
      processSemanticVoiceCommand(command);
    }
  };

  // Initialize and register speech recognition client
  const startRecognitionInstance = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[PWA Voice] SpeechRecognition is not supported in this browser.');
      return;
    }

    // Clean up older instances if any
    if (recognitionRef.current) {
      const oldInstance = recognitionRef.current;
      oldInstance.onstart = null;
      oldInstance.onresult = null;
      oldInstance.onerror = null;
      oldInstance.onend = null;
      try {
        oldInstance.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'vi-VN';
    recognition.maxAlternatives = 1;

    let recognizedBuffer = '';
    let quickSilenceTimer: any = null;

    recognition.onstart = () => {
      console.log('[PWA Voice] Active listening session started.');
      consecutiveErrorsRef.current = 0;
    };

    recognition.onresult = (event: any) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const tr = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += tr + ' ';
        } else {
          interimText += tr;
        }
      }

      const activeText = (finalText || interimText).trim();
      if (activeText) {
        recognizedBuffer = activeText;
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        if (quickSilenceTimer) clearTimeout(quickSilenceTimer);

        if (finalText.trim()) {
          // Fast commit 800ms after final segment
          quickSilenceTimer = setTimeout(() => {
            if (recognizedBuffer) {
              handleRecognizedText(recognizedBuffer);
            }
          }, 800);
        } else {
          // Fast commit 1200ms after user pauses speaking
          quickSilenceTimer = setTimeout(() => {
            if (recognizedBuffer) {
              handleRecognizedText(recognizedBuffer);
            }
          }, 1200);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        return;
      }

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        console.warn('[PWA Voice] Microphone permission denied.');
        deactivateSession();
        onUpdateSettings({ voiceAccessEnabled: false });
        return;
      }

      console.warn('[PWA Voice] Speech recognition event:', event.error);
      consecutiveErrorsRef.current += 1;
      if (consecutiveErrorsRef.current > 3) {
        deactivateSession();
      }
    };

    recognition.onend = () => {
      console.log('[PWA Voice] Speech recognition ended.');
      // If we finished listening and not speaking, return to armed standby
      if (!isSpeakingRef.current && voiceState === 'listening') {
        deactivateSession();
      }
    };

    recognitionRef.current = recognition;

    // Check mic ownership
    const micGranted = LoviraMicCoordinator.requestMic('VOICE_ACCESS');
    if (micGranted) {
      try {
        recognition.start();
      } catch (err) {
        console.warn('[PWA Voice] Notice starting recognition:', err);
      }
    } else {
      console.warn('[PWA Voice] Mic busy, recognition suspended.');
      setVoiceState('paused');
    }
  };

  const pauseRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
  };

  // Handle settings trigger on voiceAccessEnabled
  useEffect(() => {
    if (settings.voiceAccessEnabled) {
      isArmedRef.current = true;
      isListeningRef.current = false;
      setVoiceState('armed');
    } else {
      isArmedRef.current = false;
      isListeningRef.current = false;
      setVoiceState('disabled');
      pauseRecognition();
      LoviraMicCoordinator.releaseMic('VOICE_ACCESS');
    }

    return () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, [settings.voiceAccessEnabled]);

  // Listen to Mic Coordinator changes
  useEffect(() => {
    const unsubscribe = LoviraMicCoordinator.subscribe((owner) => {
      if (settings.voiceAccessEnabled) {
        if (owner === 'CONVERSATION') {
          console.log('[PWA Voice] Conversation is recording, pausing Voice Access...');
          setVoiceState('paused');
          pauseRecognition();
        } else if (owner === 'NONE' && voiceState === 'paused') {
          setVoiceState('armed');
        }
      }
    });

    return unsubscribe;
  }, [settings.voiceAccessEnabled, voiceState]);

  return (
    <VoiceAccessContext.Provider
      value={{
        voiceState,
        activateSession,
        deactivateSession,
        setContextData,
        lastAction,
        speakText,
        stopSpeaking,
      }}
    >
      {children}
    </VoiceAccessContext.Provider>
  );
};
