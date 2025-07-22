import { BaseWebSocketManager } from '../shared/BaseWebSocketManager';
import { WebSocketManagerOptions, WebSocketEventHandlers } from '../../types/common/connection';

interface TTSWebSocketOptions extends Omit<WebSocketManagerOptions, 'url'> {
  model: string;
  encoding: string;
  sampleRate: number;
}

export class TTSWebSocketManager extends BaseWebSocketManager {
  private static readonly BASE_URL = 'wss://api.deepgram.com/v1/speak';
  private ttsOptions: TTSWebSocketOptions;

  constructor(
    options: TTSWebSocketOptions,
    handlers: WebSocketEventHandlers = {}
  ) {
    super({
      ...options,
      url: TTSWebSocketManager.BASE_URL
    }, handlers);
    this.ttsOptions = options;
  }

  protected override buildWebSocketURL(): string {
    const url = new URL(TTSWebSocketManager.BASE_URL);
    url.searchParams.append('model', this.ttsOptions.model);
    url.searchParams.append('encoding', this.ttsOptions.encoding);
    url.searchParams.append('sample_rate', this.ttsOptions.sampleRate.toString());
    url.searchParams.append('container', 'none');
    return url.toString();
  }
} 