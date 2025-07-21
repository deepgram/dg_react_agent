import { DeepgramTTSResponse, TTSError, AudioChunk } from '../../types/tts';

interface MessageHandlerOptions {
  debug?: boolean;
}

interface MessageEventHandlers {
  onAudioData?: (chunk: AudioChunk) => void;
  onMetadata?: (metadata: any) => void;
  onFlushed?: () => void;
  onCleared?: () => void;
  onError?: (error: TTSError) => void;
}

export class MessageHandler {
  private sequenceId = 0;

  constructor(
    private options: MessageHandlerOptions = {},
    private handlers: MessageEventHandlers = {}
  ) {}



  public handleMessage(data: ArrayBuffer | DeepgramTTSResponse): void {
    if (data instanceof ArrayBuffer) {
      this.handleBinaryData(data);
    } else {
      this.handleJSONResponse(data);
    }
  }

  private handleBinaryData(data: ArrayBuffer): void {
    if (data.byteLength === 0) {
      return;
    }

    const audioChunk: AudioChunk = {
      data,
      timestamp: performance.now(),
      sequenceId: this.sequenceId++
    };

    this.handlers.onAudioData?.(audioChunk);
  }

  private handleJSONResponse(response: DeepgramTTSResponse): void {
    switch (response.type) {
      case 'Metadata':
        this.handlers.onMetadata?.(response);
        break;
      
      case 'Flushed':
        this.handlers.onFlushed?.();
        break;
      
      case 'Cleared':
        this.handlers.onCleared?.();
        break;
      
      case 'Error':
        if ('err_code' in response && 'err_msg' in response) {
          this.handleError({
            type: 'Error',
            err_code: response.err_code as string,
            err_msg: response.err_msg as string,
            description: response.description as string
          });
        }
        break;
    }
  }

  private handleError(response: { type: 'Error'; err_code: string; err_msg: string; description: string }): void {
    const error: TTSError = {
      name: 'DeepgramAPIError',
      message: response.err_msg,
      type: 'api',
      code: response.err_code,
      details: {
        originalResponse: response,
        description: response.description
      }
    };

    if (this.options.debug) {
      console.error('DeepgramTTS: API Error:', error);
    }

    this.handlers.onError?.(error);
  }

  public resetSequence(): void {
    this.sequenceId = 0;
  }

  public getCurrentSequenceId(): number {
    return this.sequenceId;
  }
} 