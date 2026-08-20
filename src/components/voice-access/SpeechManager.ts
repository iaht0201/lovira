import { getAvailableVietnameseVoices } from '../../lib/speech';

class SpeechManager {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingActive = false;

  public speak(
    text: string,
    options: {
      rate: number;
      voiceURI?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    }
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('[SpeechManager] Web Speech Synthesis is not supported in this browser.');
      options.onError?.();
      return;
    }

    this.stop();

    // Limit text length to avoid SpeechSynthesis issues on some mobile devices
    const cleanText = text.slice(0, 1000).trim();
    if (!cleanText) {
      options.onEnd?.();
      return;
    }

    try {
      if (this.currentUtterance) {
        this.currentUtterance.onstart = null;
        this.currentUtterance.onend = null;
        this.currentUtterance.onerror = null;
      }

      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }

      this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
      this.currentUtterance.rate = Math.max(0.6, Math.min(2.0, options.rate));
      this.currentUtterance.lang = 'vi-VN';

      // Find appropriate voice
      const viVoices = getAvailableVietnameseVoices();
      if (options.voiceURI) {
        const customVoice = viVoices.find((v) => v.voiceURI === options.voiceURI);
        if (customVoice) {
          this.currentUtterance.voice = customVoice;
        }
      } else if (viVoices.length > 0) {
        // Fallback to first Vietnamese voice
        this.currentUtterance.voice = viVoices[0];
      }

      this.currentUtterance.onstart = () => {
        this.isSpeakingActive = true;
        options.onStart?.();
      };

      this.currentUtterance.onend = () => {
        this.isSpeakingActive = false;
        options.onEnd?.();
        this.currentUtterance = null;
      };

      this.currentUtterance.onerror = (e: any) => {
        // 'interrupted' or 'canceled' happens normally when stopped or replaced
        if (e.error === 'interrupted' || e.error === 'canceled') {
          this.isSpeakingActive = false;
          this.currentUtterance = null;
          return;
        }
        console.warn('[SpeechManager] Speech Synthesis notice:', e.error || 'canceled');
        this.isSpeakingActive = false;
        options.onError?.();
        this.currentUtterance = null;
      };

      window.speechSynthesis.speak(this.currentUtterance);
    } catch (err) {
      console.warn('[SpeechManager] Could not start speech utterance:', err);
      this.isSpeakingActive = false;
      options.onError?.();
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeakingActive = false;
    this.currentUtterance = null;
  }

  public pause() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }

  public resume() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }

  public isSpeaking(): boolean {
    return this.isSpeakingActive;
  }
}

export const LoviraSpeechManager = new SpeechManager();
