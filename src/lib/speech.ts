let userInteracted = false;

if (typeof window !== 'undefined') {
  const unlockSpeech = () => {
    userInteracted = true;
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }
    }
    window.removeEventListener('pointerdown', unlockSpeech);
    window.removeEventListener('keydown', unlockSpeech);
    window.removeEventListener('touchstart', unlockSpeech);
  };
  window.addEventListener('pointerdown', unlockSpeech, { passive: true });
  window.addEventListener('keydown', unlockSpeech, { passive: true });
  window.addEventListener('touchstart', unlockSpeech, { passive: true });
}

export function isUserInteracted(): boolean {
  return userInteracted;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const updateVoices = () => {
    try {
      cachedVoices = window.speechSynthesis.getVoices();
    } catch {
      // ignore
    }
  };
  updateVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }
}

export function getAvailableVietnameseVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  return voices.filter(
    (v) =>
      v.lang.toLowerCase().includes('vi') ||
      v.name.toLowerCase().includes('vietnam') ||
      v.name.toLowerCase().includes('vietnamese')
  );
}

export function speakText(
  text: string,
  options?:
    | {
        rate?: number;
        pitch?: number;
        lang?: string;
        voiceURI?: string;
        voiceVariant?: 'female1' | 'male1' | 'female2' | string;
        onEnd?: () => void;
        onError?: (err: unknown) => void;
      }
    | (() => void)
): boolean {
  const opts = typeof options === 'function' ? { onEnd: options } : options;
  if (!isSpeechSynthesisSupported()) {
    console.warn('[Speech] Speech synthesis is not supported in this browser.');
    opts?.onError?.('unsupported');
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any previous speech
    try {
      window.speechSynthesis.resume();
    } catch {
      // ignore
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = opts?.lang || 'vi-VN';
    utterance.rate = opts?.rate || 1.0;

    // Pitch adjustment based on selected Vietnamese voice variant
    let computedPitch = opts?.pitch ?? 1.0;
    if (opts?.voiceVariant === 'male1') {
      computedPitch = 0.82; // Warm male/deeper tone pitch
    } else if (opts?.voiceVariant === 'female2') {
      computedPitch = 1.25; // Bright female tone pitch
    } else if (opts?.voiceVariant === 'female1') {
      computedPitch = 1.0; // Standard natural female tone pitch
    }
    utterance.pitch = computedPitch;

    if (opts?.onEnd) {
      utterance.onend = () => opts.onEnd?.();
    }
    if (opts?.onError) {
      utterance.onerror = (e) => {
        if ((e as any)?.error === 'interrupted' || (e as any)?.error === 'canceled') {
          return;
        }
        opts.onError?.(e);
      };
    }

    const viVoices = getAvailableVietnameseVoices();

    if (opts?.voiceURI) {
      const selectedVoice = viVoices.find((v) => v.voiceURI === opts.voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else if (viVoices.length > 0) {
      if (opts?.voiceVariant === 'male1' && viVoices.length > 1) {
        utterance.voice = viVoices[1] || viVoices[0];
      } else {
        utterance.voice = viVoices[0];
      }
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('[Speech] Failed to execute speakText:', err);
    opts?.onError?.(err);
    return false;
  }
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const SpeechRecognition =
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
  return Boolean(SpeechRecognition);
}

export interface SpeechRecognitionOptions {
  continuous?: boolean;
  lang?: string;
}

export function createSpeechRecognitionInstance(
  onResult: (transcript: string, isFinal: boolean) => void,
  onError?: (error: string) => void,
  onEnd?: () => void,
  options?: SpeechRecognitionOptions
): unknown | null {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

  if (!SpeechRecognition) return null;

  try {
    const isMobile =
      typeof navigator !== 'undefined' &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const recognition = new SpeechRecognition();
    // Use non-continuous for mobile devices to prevent WebKit abort crashes
    recognition.continuous = options?.continuous ?? (isMobile ? false : true);
    recognition.interimResults = true;
    recognition.lang = options?.lang || 'vi-VN';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let newFinalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (newFinalTranscript.trim()) {
        onResult(newFinalTranscript.trim(), true);
      } else if (interimTranscript.trim()) {
        onResult(interimTranscript.trim(), false);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[Speech] SpeechRecognition error:', event.error);
      if (onError) onError(event.error);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    return recognition;
  } catch (err) {
    console.error('[Speech] Error instantiating SpeechRecognition:', err);
    return null;
  }
}

export function stopMediaStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (e) {
        console.warn('[Speech] Error stopping media track:', e);
      }
    });
  }
}
