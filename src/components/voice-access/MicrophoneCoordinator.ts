type MicOwner = 'VOICE_ACCESS' | 'CONVERSATION' | 'NONE';

class MicrophoneCoordinator {
  private currentOwner: MicOwner = 'NONE';
  private onOwnerChangeCallbacks: Set<(owner: MicOwner) => void> = new Set();

  public requestMic(owner: MicOwner): boolean {
    console.log(`[MicCoordinator] Mic requested by: ${owner}. Current owner: ${this.currentOwner}`);
    
    if (this.currentOwner === owner) {
      return true; // Already owns it
    }

    if (owner === 'CONVERSATION') {
      // Conversation takes absolute high priority
      this.currentOwner = 'CONVERSATION';
      this.notifyChange();
      return true;
    }

    if (owner === 'VOICE_ACCESS') {
      if (this.currentOwner === 'CONVERSATION') {
        console.warn('[MicCoordinator] Voice Access requested mic, but Conversation currently active. Rejecting.');
        return false;
      }
      this.currentOwner = 'VOICE_ACCESS';
      this.notifyChange();
      return true;
    }

    return false;
  }

  public releaseMic(owner: MicOwner) {
    if (this.currentOwner === owner) {
      console.log(`[MicCoordinator] Mic released by: ${owner}`);
      this.currentOwner = 'NONE';
      this.notifyChange();
    }
  }

  public getCurrentOwner(): MicOwner {
    return this.currentOwner;
  }

  public subscribe(callback: (owner: MicOwner) => void): () => void {
    this.onOwnerChangeCallbacks.add(callback);
    return () => {
      this.onOwnerChangeCallbacks.delete(callback);
    };
  }

  private notifyChange() {
    this.onOwnerChangeCallbacks.forEach((cb) => {
      try {
        cb(this.currentOwner);
      } catch (e) {
        console.error('[MicCoordinator] Callback error:', e);
      }
    });
  }
}

export const LoviraMicCoordinator = new MicrophoneCoordinator();
