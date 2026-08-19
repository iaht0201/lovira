import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { LoviraVoiceState, LoviraAction, LoviraVoiceIntent, LoviraContextType } from './voice.types';
import { matchLocalIntent } from './localIntentMatcher';
import { LoviraSpeechManager } from './SpeechManager';
import { LoviraMicCoordinator } from './MicrophoneCoordinator';
import { LoviraReadingEngine } from './ReadingEngine';
import { AccessibilitySettings, UserProfile } from '../../types';

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
  const restartTimeoutRef = useRef<any>(null);

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
    return settings.voiceURI || undefined;
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
    setVoiceState((prev) => (prev === 'speaking' ? 'listening' : prev));
  };

  // Speaks feedback text with prevention of self-recognition
  const speakText = (text: string, onEnd?: () => void) => {
    if (!settings.spokenFeedbackEnabled) {
      onEnd?.();
      return;
    }

    console.log(`[PWA Voice] Speaking: "${text}"`);
    isSpeakingRef.current = true;
    const previousState = voiceState;
    setVoiceState('speaking');

    // Pause recognition during speech to avoid self-audio loop
    pauseRecognition();

    LoviraSpeechManager.speak(text, {
      rate: getSpeechRate(),
      voiceURI: getVoiceURI(),
      onEnd: () => {
        isSpeakingRef.current = false;
        onEnd?.();
        // Restore recognition state
        if (isListeningRef.current) {
          setVoiceState('listening');
          resumeRecognition();
        } else if (isArmedRef.current) {
          setVoiceState('armed');
          resumeRecognition();
        } else {
          setVoiceState(previousState === 'speaking' ? 'listening' : previousState);
        }
      },
      onError: () => {
        isSpeakingRef.current = false;
        onEnd?.();
        if (isListeningRef.current) {
          setVoiceState('listening');
          resumeRecognition();
        } else if (isArmedRef.current) {
          setVoiceState('armed');
          resumeRecognition();
        } else {
          setVoiceState('error');
        }
      },
    });
  };

  // Manual session triggers
  const activateSession = () => {
    if (!settings.voiceAccessEnabled) return;
    isArmedRef.current = false;
    isListeningRef.current = true;
    setVoiceState('listening');
    speakText('Mình đang nghe.', () => {
      startRecognitionInstance();
    });
  };

  const deactivateSession = () => {
    isArmedRef.current = true;
    isListeningRef.current = false;
    setVoiceState('armed');
    speakText('Đã kết thúc phiên nghe thoại.');
  };

  // Central Action Executor mapping to real application commands
  const executeAction = async (intent: LoviraVoiceIntent) => {
    const { action, feedback } = intent;
    console.log(`[PWA Voice] Executing action: ${action}`);
    setLastAction(action);

    const speakFeedbackThenListen = (fb: string, onDone?: () => void) => {
      speakText(fb, () => {
        onDone?.();
      });
    };

    switch (action) {
      case 'START_VOICE_SESSION':
        activateSession();
        break;

      case 'END_VOICE_SESSION':
        deactivateSession();
        break;

      case 'DISABLE_VOICE_ACCESS':
        onUpdateSettings({ voiceAccessEnabled: false });
        speakFeedbackThenListen('Đã tắt chế độ điều khiển bằng giọng nói.');
        break;

      case 'GO_HOME':
        onNavigate('/');
        speakFeedbackThenListen(feedback || 'Đang chuyển về trang chủ.');
        break;

      case 'GO_BACK':
        window.history.back();
        speakFeedbackThenListen(feedback || 'Đang quay lại trang trước.');
        break;

      case 'OPEN_VISION':
      case 'OPEN_CAMERA':
        onNavigate('/vision?action=camera');
        speakFeedbackThenListen(feedback || 'Đang kích hoạt camera.');
        break;

      case 'OPEN_CONVERSATION':
        onNavigate('/conversation');
        speakFeedbackThenListen(feedback || 'Đang mở nghe thoại.');
        break;

      case 'OPEN_EASY_READ':
        onNavigate('/easy-read');
        speakFeedbackThenListen(feedback || 'Đang mở làm nội dung dễ hiểu.');
        break;

      case 'OPEN_DOCUMENTS':
        onNavigate('/documents');
        speakFeedbackThenListen(feedback || 'Đang mở Hiểu tài liệu.');
        break;

      case 'OPEN_HISTORY':
        onNavigate('/history');
        speakFeedbackThenListen(feedback || 'Đang mở Lịch sử.');
        break;

      case 'OPEN_ACCESSIBILITY':
        onNavigate('/settings'); // settings page contains accessibility controls
        speakFeedbackThenListen(feedback || 'Đang mở cài đặt trợ năng.');
        break;

      case 'OPEN_SETTINGS':
        onNavigate('/settings');
        speakFeedbackThenListen(feedback || 'Đang mở màn hình cài đặt.');
        break;

      case 'INCREASE_FONT': {
        const nextScales: Record<string, string> = { '100': '125', '125': '150', '150': '175', '175': '175' };
        onUpdateSettings({ fontScale: nextScales[settings.fontScale] as any });
        speakFeedbackThenListen('Đã phóng to kích thước chữ.');
        break;
      }

      case 'DECREASE_FONT': {
        const prevScales: Record<string, string> = { '175': '150', '150': '125', '125': '100', '100': '100' };
        onUpdateSettings({ fontScale: prevScales[settings.fontScale] as any });
        speakFeedbackThenListen('Đã thu nhỏ kích thước chữ.');
        break;
      }

      case 'ENABLE_HIGH_CONTRAST':
        onUpdateSettings({ highContrast: true });
        speakFeedbackThenListen('Đã bật tương phản cao.');
        break;

      case 'DISABLE_HIGH_CONTRAST':
        onUpdateSettings({ highContrast: false });
        speakFeedbackThenListen('Đã tắt tương phản cao.');
        break;

      case 'ENABLE_REDUCED_MOTION':
        onUpdateSettings({ reducedMotion: true });
        speakFeedbackThenListen('Đã bật giảm chuyển động.');
        break;

      case 'DISABLE_REDUCED_MOTION':
        onUpdateSettings({ reducedMotion: false });
        speakFeedbackThenListen('Đã tắt giảm chuyển động.');
        break;

      case 'ENABLE_LARGE_CONTROLS':
        onUpdateSettings({ largeControls: true });
        speakFeedbackThenListen('Đã kích hoạt chế độ nút bấm trợ năng lớn.');
        break;

      case 'DISABLE_LARGE_CONTROLS':
        onUpdateSettings({ largeControls: false });
        speakFeedbackThenListen('Đã tắt chế độ nút bấm lớn.');
        break;

      case 'STOP_READING':
        stopSpeaking();
        break;

      case 'SPEAK_SLOWER': {
        const nextRate = Math.max(0.6, settings.speechRate - 0.15);
        onUpdateSettings({ speechRate: nextRate });
        speakFeedbackThenListen('Đã giảm tốc độ nói.');
        break;
      }

      case 'SPEAK_FASTER': {
        const nextRate = Math.min(2.0, settings.speechRate + 0.15);
        onUpdateSettings({ speechRate: nextRate });
        speakFeedbackThenListen('Đã tăng tốc độ nói.');
        break;
      }

      case 'DESCRIBE_CURRENT_PAGE': {
        const desc = LoviraReadingEngine.describePage(currentRoute);
        speakFeedbackThenListen(desc);
        break;
      }

      case 'READ_PAGE':
        LoviraReadingEngine.readPage(currentRoute, getSpeechRate(), getVoiceURI());
        break;

      case 'READ_CURRENT_REGION':
        LoviraReadingEngine.readCurrentRegion(getSpeechRate(), getVoiceURI());
        break;

      case 'READ_NEXT':
        LoviraReadingEngine.readNextRegion(getSpeechRate(), getVoiceURI());
        break;

      case 'READ_PREVIOUS':
        LoviraReadingEngine.readPreviousRegion(getSpeechRate(), getVoiceURI());
        break;

      case 'READ_CURRENT_FOCUS':
        LoviraReadingEngine.readCurrentFocus(getSpeechRate(), getVoiceURI());
        break;

      case 'READ_CURRENT_RESULT':
        LoviraReadingEngine.readCurrentResult(getSpeechRate(), getVoiceURI());
        break;

      case 'READ_INTERACTIVE_ELEMENTS':
        LoviraReadingEngine.readInteractiveElements(getSpeechRate(), getVoiceURI());
        break;

      case 'CAPTURE_IMAGE': {
        // Dispatch document event so current route camera is triggered
        const event = new CustomEvent('lovira-voice-capture');
        document.dispatchEvent(event);
        speakFeedbackThenListen('Chụp ảnh thành công. Đang tiến hành phân tích.');
        break;
      }

      case 'ANALYZE_SCENE':
      case 'READ_IMAGE_TEXT':
      case 'EXPLAIN_OBJECT': {
        const event = new CustomEvent('lovira-voice-analyze', { detail: { action } });
        document.dispatchEvent(event);
        speakFeedbackThenListen('Đang phân tích dữ liệu hình ảnh, vui lòng đợi một chút.');
        break;
      }

      case 'SIMPLIFY_CURRENT_TEXT':
      case 'SUMMARIZE_CURRENT_CONTENT': {
        const event = new CustomEvent('lovira-voice-simplify', { detail: { action } });
        document.dispatchEvent(event);
        speakFeedbackThenListen('Đang tiến hành giản lược văn bản hiện tại.');
        break;
      }

      case 'SAVE_CURRENT_RESULT': {
        const event = new CustomEvent('lovira-voice-save');
        document.dispatchEvent(event);
        break;
      }

      default:
        speakFeedbackThenListen(feedback || 'Lovira chưa hỗ trợ lệnh này.');
        break;
    }
  };

  // Call backend semantic router for non-deterministic requests
  const processSemanticVoiceCommand = async (command: string) => {
    setVoiceState('processing');
    try {
      const response = await fetch('/api/ai/voice-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovira-client': 'pwa-voice-client',
        },
        body: JSON.stringify({
          command,
          context: contextRef.current,
          customApiKey: getCustomGeminiKey(),
        }),
      });

      if (!response.ok) {
        throw new Error('Hệ thống xử lý lệnh giọng nói gặp sự cố.');
      }

      const result = await response.json();
      if (result.success && result.data) {
        await executeAction(result.data);
      } else {
        speakText('Lovira chưa hiểu rõ yêu cầu này. Bạn có thể nói lại.');
      }
    } catch (err) {
      console.error('[PWA Voice] Semantic route failed:', err);
      setVoiceState('error');
      speakText('Có sự cố kết nối máy chủ khi hiểu câu lệnh.');
    }
  };

  // Core Speech Recognition event logic
  const handleRecognizedText = (text: string) => {
    if (!text || text.trim().length === 0) return;
    const command = text.trim();
    console.log(`[PWA Voice] Recognized text: "${command}"`);

    // 1. If currently in ARMED state, only listen for wake phrase
    if (voiceState === 'armed' || !isListeningRef.current) {
      const isWake = command.toLowerCase().includes('chào lovira') || command.toLowerCase().includes('chao lovira');
      if (isWake) {
        console.log('[PWA Voice] Wake word matched!');
        activateSession();
      }
      return;
    }

    // 2. We are in ACTIVE session (listening state)
    // First, check deterministic local matcher
    const localMatch = matchLocalIntent(command);
    if (localMatch) {
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
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'vi-VN';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[PWA Voice] Speech recognition started.');
      consecutiveErrorsRef.current = 0;
    };

    recognition.onresult = (event: any) => {
      const lastResultIndex = event.results.length - 1;
      const text = event.results[lastResultIndex][0].transcript;
      handleRecognizedText(text);
    };

    recognition.onerror = (event: any) => {
      console.error('[PWA Voice] Speech recognition error event:', event.error);
      
      if (event.error === 'not-allowed') {
        console.error('[PWA Voice] Microphone permission denied.');
        setVoiceState('disabled');
        onUpdateSettings({ voiceAccessEnabled: false });
        return;
      }

      consecutiveErrorsRef.current += 1;
      if (consecutiveErrorsRef.current > 3) {
        console.error('[PWA Voice] Too many consecutive errors. Disabling Voice Access.');
        setVoiceState('error');
        onUpdateSettings({ voiceAccessEnabled: false });
        return;
      }

      // Safe recovery on transient errors
      if (settings.voiceAccessEnabled && !isSpeakingRef.current) {
        scheduleRestart();
      }
    };

    recognition.onend = () => {
      console.log('[PWA Voice] Speech recognition ended.');
      if (settings.voiceAccessEnabled && !isSpeakingRef.current && voiceState !== 'paused') {
        scheduleRestart();
      }
    };

    recognitionRef.current = recognition;

    // Check mic ownership
    const micGranted = LoviraMicCoordinator.requestMic('VOICE_ACCESS');
    if (micGranted) {
      try {
        recognition.start();
      } catch (err) {
        console.error('[PWA Voice] Failed to start recognition:', err);
      }
    } else {
      console.warn('[PWA Voice] Mic busy, recognition suspended.');
      setVoiceState('paused');
    }
  };

  const pauseRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  };

  const resumeRecognition = () => {
    if (settings.voiceAccessEnabled && !isSpeakingRef.current) {
      startRecognitionInstance();
    }
  };

  const scheduleRestart = () => {
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    restartTimeoutRef.current = setTimeout(() => {
      if (settings.voiceAccessEnabled && !isSpeakingRef.current && voiceState !== 'paused') {
        resumeRecognition();
      }
    }, 1000);
  };

  // Handle settings trigger on voiceAccessEnabled
  useEffect(() => {
    if (settings.voiceAccessEnabled) {
      isArmedRef.current = true;
      isListeningRef.current = false;
      setVoiceState('armed');
      startRecognitionInstance();
    } else {
      isArmedRef.current = false;
      isListeningRef.current = false;
      setVoiceState('disabled');
      pauseRecognition();
      LoviraMicCoordinator.releaseMic('VOICE_ACCESS');
    }

    return () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
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
        } else if (owner === 'NONE' || owner === 'VOICE_ACCESS') {
          console.log('[PWA Voice] Mic released, resuming Voice Access...');
          setVoiceState(isListeningRef.current ? 'listening' : 'armed');
          LoviraMicCoordinator.requestMic('VOICE_ACCESS');
          resumeRecognition();
        }
      }
    });

    return unsubscribe;
  }, [settings.voiceAccessEnabled]);

  // Page visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && settings.voiceAccessEnabled) {
        console.log('[PWA Voice] Tab visible, verifying recognition status.');
        resumeRecognition();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [settings.voiceAccessEnabled]);

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
