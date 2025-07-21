import { WebSocketManager } from './WebSocketManager';
import { WebSocketManagerOptions, WebSocketEventHandlers } from '../../types/common/connection';

interface VoiceWebSocketOptions extends WebSocketManagerOptions {
  service: 'transcription' | 'agent';
  queryParams?: Record<string, string | number | boolean>;
}

export class VoiceWebSocketManager extends WebSocketManager {
  constructor(
    options: VoiceWebSocketOptions,
    handlers: WebSocketEventHandlers = {}
  ) {
    super(options, handlers);
  }

  protected buildWebSocketURL(): string {
    const options = this.options as VoiceWebSocketOptions;
    const baseURL = options.url;

    if (!options.queryParams) {
      return baseURL;
    }

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.queryParams)) {
      params.append(key, String(value));
    }

    return `${baseURL}?${params.toString()}`;
  }

  public sendCloseStream(): void {
    if (this.isConnected()) {
      this.sendMessage({ type: 'CloseStream' });
    }
  }

  public close(): void {
    this.disconnect();
  }

  public sendJSON(message: any): void {
    this.sendMessage(message);
  }
} 