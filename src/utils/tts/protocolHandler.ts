import { DeepgramTTSMessage } from '../../types/tts';

interface ProtocolHandlerOptions {
  debug?: boolean;
  enableTextChunking?: boolean;
  maxChunkSize?: number;
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

  public chunkBySentence(text: string, maxChunkSize: number = 1000): string[] {
    // Split text into sentences using common sentence delimiters
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      // If adding this sentence would exceed maxChunkSize, start a new chunk
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      currentChunk += sentence;
    }

    // Add the last chunk if there's anything left
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  public wrapInSSML(text: string): string {
    return `<speak>${text}</speak>`;
  }
} 