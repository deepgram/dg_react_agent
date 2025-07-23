import { DeepgramTTSMessage } from '../../types/tts';

interface ProtocolHandlerOptions {
  debug?: boolean;
}

export class ProtocolHandler {
  private debug: boolean;

  constructor(options: ProtocolHandlerOptions = {}) {
    this.debug = options.debug || false;
  }

  private log(message: string): void {
    if (this.debug) {
      console.log(`[ProtocolHandler] ${message}`);
    }
  }

  public createSpeakMessage(text: string): DeepgramTTSMessage {
    this.log(`Creating speak message for text: ${text}`);
    return {
      type: 'Speak',
      text
    };
  }

  public createFlushMessage(): DeepgramTTSMessage {
    return {
      type: 'Flush'
    };
  }

  public createClearMessage(): DeepgramTTSMessage {
    return {
      type: 'Clear'
    };
  }

  public createCloseMessage(): DeepgramTTSMessage {
    return {
      type: 'Close'
    };
  }

  public wrapInSSML(text: string): string {
    return `<speak>${text}</speak>`;
  }
} 