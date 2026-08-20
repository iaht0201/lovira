export interface VSLEventPayload {
  id: string;
  text: string;
  timestamp: number;
}

type VSLSubscriber = (payload: VSLEventPayload) => void;

class VSLAccessibilityService {
  private subscribers: Set<VSLSubscriber> = new Set();
  private lastPayload: VSLEventPayload | null = null;
  private isSigningActive = false;

  /**
   * Dispatches text to all active VSL listeners (e.g. from Voice Action or TTS).
   */
  public dispatchText(text: string) {
    const cleanText = text?.trim();
    if (!cleanText) return;

    const payload: VSLEventPayload = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text: cleanText,
      timestamp: Date.now(),
    };

    this.lastPayload = payload;
    console.log(`[VSL Service] Dispatched text for VSL translation: "${cleanText}"`);

    this.subscribers.forEach((subscriber) => {
      try {
        subscriber(payload);
      } catch (err) {
        console.error('[VSL Service] Error in subscriber callback:', err);
      }
    });
  }

  /**
   * Subscribe to VSL text events.
   */
  public subscribe(callback: VSLSubscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Replays the last dispatched text if available.
   */
  public replay() {
    if (this.lastPayload) {
      this.dispatchText(this.lastPayload.text);
    }
  }

  /**
   * Returns the most recent text dispatched to VSL.
   */
  public getLastText(): string {
    return this.lastPayload?.text || '';
  }

  public setSigningActive(active: boolean) {
    this.isSigningActive = active;
  }

  public isSigning(): boolean {
    return this.isSigningActive;
  }
}

export const vslAccessibilityService = new VSLAccessibilityService();
