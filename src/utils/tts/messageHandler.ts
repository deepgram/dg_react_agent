import { DeepgramTTSResponse, TTSError, AudioChunk } from '../../types/tts';
import { APIError } from '../../types/common/error';

interface MessageHandlerOptions {
  onError?: (error: TTSError) => void;
  onAudioChunk?: (chunk: AudioChunk) => void;
  onComplete?: () => void;
  debug?: boolean;
}

export class MessageHandler {
  private handlers: MessageHandlerOptions;
  private sequenceId = 0;
  private totalBytesReceived = 0;
  private chunkCount = 0;
  private isProcessingStream = false;

  constructor(options: MessageHandlerOptions = {}) {
    this.handlers = options;
  }

  public setOnComplete(handler: () => void): void {
    this.log('Setting completion handler');
    this.handlers.onComplete = () => {
      this.log('Calling completion handler');
      handler();
    };
  }

  private log(message: string): void {
    if (this.handlers.debug) {
      console.log(`[TTSMessageHandler] ${message}`);
    }
  }

  public handleMessage(message: DeepgramTTSResponse | ArrayBuffer): void {
    if (message instanceof ArrayBuffer) {
      if (message.byteLength === 0) {
        return;
      }

      // Only process audio chunks if we're not flushed
      if (!this.isProcessingStream) {
        this.isProcessingStream = true;
      }

      this.chunkCount++;
      this.totalBytesReceived += message.byteLength;

      const audioChunk: AudioChunk = {
        data: message,
        timestamp: performance.now(),
        sequenceId: this.sequenceId++
      };

      this.handlers.onAudioChunk?.(audioChunk);
      return;
    }

    if (message.type === 'Error') {
      const error = new APIError('Deepgram API error', {
        endpoint: 'tts',
        statusCode: 400,
        statusText: message.err_code,
        originalError: new Error(message.err_msg)
      });
      this.handlers.onError?.(error);
      return;
    }

    if (message.type === 'Complete') {
      this.log(`Audio stream complete. Total: ${this.totalBytesReceived} bytes in ${this.chunkCount} chunks`);
      this.handlers.onComplete?.();
      // Reset counters for next stream
      this.resetSequence();
      return;
    }

    if (message.type === 'Flushed') {
      this.log('Previous audio stream flushed');
      // Reset state for the new stream
      this.resetSequence();
      this.isProcessingStream = false;
      this.handlers.onComplete?.();
      return;
    }

    this.log(`Unknown message type: ${message.type}`);
  }

  public resetSequence(): void {
    this.sequenceId = 0;
  }

  public getCurrentSequenceId(): number {
    return this.sequenceId;
  }
} 