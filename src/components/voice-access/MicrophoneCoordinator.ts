export type MicConsumer =
  | 'voice-access'
  | 'conversation'
  | 'agent-command'
  | 'none'
  | 'VOICE_ACCESS'
  | 'CONVERSATION'
  | 'AGENT_COMMAND'
  | 'NONE';

class MicCoordinator {
  private activeConsumer: MicConsumer = 'NONE';
  private listeners: Array<(consumer: MicConsumer) => void> = [];

  public getActiveConsumer(): MicConsumer {
    return this.activeConsumer;
  }

  public requestAccess(consumer: MicConsumer): boolean {
    return this.requestMic(consumer);
  }

  public releaseAccess(consumer: MicConsumer) {
    this.releaseMic(consumer);
  }

  public requestMic(consumer: MicConsumer): boolean {
    this.activeConsumer = consumer;
    this.notify();
    return true;
  }

  public releaseMic(consumer: MicConsumer) {
    if (
      this.activeConsumer === consumer ||
      (consumer === 'VOICE_ACCESS' && this.activeConsumer === 'voice-access') ||
      (consumer === 'CONVERSATION' && this.activeConsumer === 'conversation') ||
      (consumer === 'AGENT_COMMAND' && this.activeConsumer === 'agent-command')
    ) {
      this.activeConsumer = 'NONE';
      this.notify();
    }
  }

  public subscribe(cb: (consumer: MicConsumer) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.activeConsumer));
  }
}

export const LoviraMicCoordinator = new MicCoordinator();
