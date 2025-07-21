import { WebSocketManager } from './WebSocketManager';
import { WebSocketManagerOptions, WebSocketEventHandlers } from '../../types/common/connection';
import { DeepgramTTSMessage } from '../../types/tts';

interface TTSWebSocketOptions extends Omit<WebSocketManagerOptions, 'url'> {
  model?: string;
  encoding?: string;
  sampleRate?: number;
}

export class TTSWebSocketManager extends WebSocketManager {
  constructor(
    options: TTSWebSocketOptions,
    handlers: WebSocketEventHandlers = {}
  ) {
    super({
      ...options,
      url: 'wss://api.deepgram.com/v1/speak'
    }, handlers);
  }

  protected buildWebSocketURL(): string {
    const options = this.options as TTSWebSocketOptions;
    const baseURL = 'wss://api.deepgram.com/v1/speak';
    const params = new URLSearchParams({
      model: options.model || 'aura-2-thalia-en',
      encoding: options.encoding || 'linear16',
      sample_rate: String(options.sampleRate || 48000),
      container: 'none'
    });

    return `${baseURL}?${params.toString()}`;
  }

  public sendJSON(message: DeepgramTTSMessage): void {
    this.sendMessage(message);
  }
} 