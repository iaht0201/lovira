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

export function getAvailableVietnameseVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  return voices.filter(
    (v) =>
      v.lang.toLowerCase().includes('vi') ||
      v.name.toLowerCase().includes('vietnam') ||
      v.name.toLowerCase().includes('vietnamese')
  );
}

export function speakText(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    lang?: string;
    voiceURI?: string;
    voiceVariant?: 'female1' | 'male1' | 'female2' | string;
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

    // Pitch adjustment based on selected Vietnamese voice variant
    let computedPitch = options?.pitch ?? 1.0;
    if (options?.voiceVariant === 'male1') {
      computedPitch = 0.82; // Warm male/deeper tone pitch
    } else if (options?.voiceVariant === 'female2') {
      computedPitch = 1.25; // Bright female tone pitch
    } else if (options?.voiceVariant === 'female1') {
      computedPitch = 1.0; // Standard natural female tone pitch
    }
    utterance.pitch = computedPitch;

    if (options?.onEnd) {
      utterance.onend = () => options.onEnd?.();
    }
    if (options?.onError) {
      utterance.onerror = (e) => options.onError?.(e);
    }

    const voices = window.speechSynthesis.getVoices();
    const viVoices = voices.filter(
      (v) =>
        v.lang.toLowerCase().includes('vi') ||
        v.name.toLowerCase().includes('vietnam') ||
        v.name.toLowerCase().includes('vietnamese')
    );

    if (options?.voiceURI) {
      const selectedVoice = voices.find((v) => v.voiceURI === options.voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else if (viVoices.length > 0) {
      if (options?.voiceVariant === 'male1' && viVoices.length > 1) {
        utterance.voice = viVoices[1] || viVoices[0];
      } else {
        utterance.voice = viVoices[0];
      }
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

    let lastFinalIndex = 0;

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let newFinalTranscript = '';

      for (let i = lastFinalIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          newFinalTranscript += event.results[i][0].transcript + ' ';
          lastFinalIndex = i + 1;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (newFinalTranscript.trim()) {
        onResult(newFinalTranscript.trim(), true);
      }
      if (interimTranscript.trim()) {
        onResult(interimTranscript.trim(), false);
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
