let userInteracted = false;

if (typeof window !== 'undefined') {
  const unlockSpeech = () => {
    userInteracted = true;
    window.removeEventListener('pointerdown', unlockSpeech);
    window.removeEventListener('keydown', unlockSpeech);
  };
  window.addEventListener('pointerdown', unlockSpeech);
  window.addEventListener('keydown', unlockSpeech);
}

export function isUserInteracted(): boolean {
  return userInteracted;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakText(
  text: string,
  options?: {
    rate?: number;
    lang?: string;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
  }
): boolean {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis is not supported in this browser.');
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any previous speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options?.lang || 'vi-VN';
    utterance.rate = options?.rate || 1.0;

    if (options?.onEnd) {
      utterance.onend = () => options.onEnd?.();
    }
    if (options?.onError) {
      utterance.onerror = (e) => options.onError?.(e);
    }

    // Attempt to pick a Vietnamese voice if available
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.includes('vi') || v.lang.includes('VI'));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('Failed to execute speakText:', err);
    return false;
  }
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const SpeechRecognition =
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
  return Boolean(SpeechRecognition);
}

export function createSpeechRecognitionInstance(
  onResult: (transcript: string, isFinal: boolean) => void,
  onError?: (error: string) => void,
  onEnd?: () => void
): unknown | null {
  if (typeof window === 'undefined') return null;

  const SpeechRecognition =
    (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

  if (!SpeechRecognition) return null;

  try {
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'vi-VN';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('SpeechRecognition error:', event.error);
      if (onError) onError(event.error);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    return recognition;
  } catch (err) {
    console.error('Error instantiating SpeechRecognition:', err);
    return null;
  }
}

export function stopMediaStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (e) {
        console.warn('Error stopping media track:', e);
      }
    });
  }
}
