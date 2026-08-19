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
    const { action, feedback } = intent;
    console.log(`[PWA Voice] Executing action: ${action}`);
    setLastAction(action);

    const finishWithFeedback = (fb: string, onDone?: () => void) => {
      if (settings.spokenFeedbackEnabled) {
        speakText(fb, () => {
          onDone?.();
          deactivateSession();
        });
      } else {
        onDone?.();
        deactivateSession();
      }
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
        finishWithFeedback('Đã tắt chế độ điều khiển bằng giọng nói.');
        break;

      case 'GO_HOME':
        onNavigate('/');
        finishWithFeedback(feedback || 'Đang chuyển về trang chủ.');
        break;

      case 'GO_BACK':
        window.history.back();
        finishWithFeedback(feedback || 'Đang quay lại trang trước.');
        break;

      case 'OPEN_VISION':
      case 'OPEN_CAMERA':
        onNavigate('/vision?action=camera');
        finishWithFeedback(feedback || 'Đang kích hoạt camera.');
        break;

      case 'OPEN_CONVERSATION':
        onNavigate('/conversation');
        finishWithFeedback(feedback || 'Đang mở nghe thoại.');
        break;

      case 'OPEN_EASY_READ':
        onNavigate('/easy-read');
        finishWithFeedback(feedback || 'Đang mở làm nội dung dễ hiểu.');
        break;

      case 'OPEN_DOCUMENTS':
        onNavigate('/documents');
        finishWithFeedback(feedback || 'Đang mở Hiểu tài liệu.');
        break;

      case 'OPEN_HISTORY':
        onNavigate('/history');
        finishWithFeedback(feedback || 'Đang mở Lịch sử.');
        break;

      case 'OPEN_ACCESSIBILITY':
        onNavigate('/settings'); // settings page contains accessibility controls
        finishWithFeedback(feedback || 'Đang mở cài đặt trợ năng.');
        break;

      case 'OPEN_SETTINGS':
        onNavigate('/settings');
        finishWithFeedback(feedback || 'Đang mở màn hình cài đặt.');
        break;

      case 'INCREASE_FONT': {
        const nextScales: Record<string, string> = { '100': '125', '125': '150', '150': '175', '175': '175' };
        onUpdateSettings({ fontScale: nextScales[settings.fontScale] as any });
        finishWithFeedback('Đã phóng to kích thước chữ.');
        break;
      }

      case 'DECREASE_FONT': {
        const prevScales: Record<string, string> = { '175': '150', '150': '125', '125': '100', '100': '100' };
        onUpdateSettings({ fontScale: prevScales[settings.fontScale] as any });
        finishWithFeedback('Đã thu nhỏ kích thước chữ.');
        break;
      }

      case 'ENABLE_HIGH_CONTRAST':
        onUpdateSettings({ highContrast: true });
        finishWithFeedback('Đã bật tương phản cao.');
        break;

      case 'DISABLE_HIGH_CONTRAST':
        onUpdateSettings({ highContrast: false });
        finishWithFeedback('Đã tắt tương phản cao.');
        break;

      case 'ENABLE_REDUCED_MOTION':
        onUpdateSettings({ reducedMotion: true });
        finishWithFeedback('Đã bật giảm chuyển động.');
        break;

      case 'DISABLE_REDUCED_MOTION':
        onUpdateSettings({ reducedMotion: false });
        finishWithFeedback('Đã tắt giảm chuyển động.');
        break;

      case 'ENABLE_LARGE_CONTROLS':
        onUpdateSettings({ largeControls: true });
        finishWithFeedback('Đã kích hoạt chế độ nút bấm trợ năng lớn.');
        break;

      case 'DISABLE_LARGE_CONTROLS':
        onUpdateSettings({ largeControls: false });
        finishWithFeedback('Đã tắt chế độ nút bấm lớn.');
        break;

      case 'STOP_READING':
        stopSpeaking();
        deactivateSession();
        break;

      case 'SPEAK_SLOWER': {
        const nextRate = Math.max(0.6, settings.speechRate - 0.15);
        onUpdateSettings({ speechRate: nextRate });
        finishWithFeedback('Đã giảm tốc độ nói.');
        break;
      }

      case 'SPEAK_FASTER': {
        const nextRate = Math.min(2.0, settings.speechRate + 0.15);
        onUpdateSettings({ speechRate: nextRate });
        finishWithFeedback('Đã tăng tốc độ nói.');
        break;
      }

      case 'DESCRIBE_CURRENT_PAGE': {
        const desc = LoviraReadingEngine.describePage(currentRoute);
        finishWithFeedback(desc);
        break;
      }

      case 'READ_PAGE':
        LoviraReadingEngine.readPage(currentRoute, getSpeechRate(), getVoiceURI());
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

      case 'READ_CURRENT_RESULT':
        LoviraReadingEngine.readCurrentResult(getSpeechRate(), getVoiceURI());
        deactivateSession();
        break;

      case 'READ_INTERACTIVE_ELEMENTS':
        LoviraReadingEngine.readInteractiveElements(getSpeechRate(), getVoiceURI());
        deactivateSession();
        break;

      case 'CAPTURE_IMAGE': {
        const event = new CustomEvent('lovira-voice-capture');
        document.dispatchEvent(event);
        finishWithFeedback('Chụp ảnh thành công. Đang tiến hành phân tích.');
        break;
      }

      case 'ANALYZE_SCENE':
      case 'READ_IMAGE_TEXT':
      case 'EXPLAIN_OBJECT': {
        const event = new CustomEvent('lovira-voice-analyze', { detail: { action } });
        document.dispatchEvent(event);
        finishWithFeedback('Đang phân tích dữ liệu hình ảnh, vui lòng đợi một chút.');
        break;
      }

      case 'SIMPLIFY_CURRENT_TEXT':
      case 'SUMMARIZE_CURRENT_CONTENT': {
        const event = new CustomEvent('lovira-voice-simplify', { detail: { action } });
        document.dispatchEvent(event);
        finishWithFeedback('Đang tiến hành giản lược văn bản hiện tại.');
        break;
      }

      case 'SAVE_CURRENT_RESULT': {
        const event = new CustomEvent('lovira-voice-save');
        document.dispatchEvent(event);
        deactivateSession();
        break;
      }

      default:
        finishWithFeedback(feedback || 'Lovira chưa hỗ trợ lệnh này.');
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
        if (settings.spokenFeedbackEnabled) {
          speakText('Lovira chưa hiểu rõ yêu cầu này.', () => deactivateSession());
        } else {
          deactivateSession();
        }
      }
    } catch (err) {
      console.warn('[PWA Voice] Semantic route note:', err);
      if (settings.spokenFeedbackEnabled) {
        speakText('Có sự cố kết nối máy chủ khi hiểu câu lệnh.', () => deactivateSession());
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

    // Check deterministic local matcher
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
    recognition.continuous = false; // Capture single sentence per 2-click session
    recognition.interimResults = false;
    recognition.lang = 'vi-VN';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[PWA Voice] Active listening session started.');
      consecutiveErrorsRef.current = 0;
    };

    recognition.onresult = (event: any) => {
      const lastResultIndex = event.results.length - 1;
      const text = event.results[lastResultIndex][0].transcript;
      handleRecognizedText(text);
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
