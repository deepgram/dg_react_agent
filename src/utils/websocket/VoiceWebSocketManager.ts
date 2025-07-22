import { BaseWebSocketManager } from '../shared/BaseWebSocketManager';
import { WebSocketManagerOptions, WebSocketEventHandlers } from '../../types/common/connection';
import { AgentOptions } from '../../types/voice';

interface VoiceWebSocketOptions extends Omit<WebSocketManagerOptions, 'url'> {
  type: 'transcription' | 'agent';
  model?: string;
  encoding?: string;
  sampleRate?: number;
  agentOptions?: AgentOptions;
}

export class VoiceWebSocketManager extends BaseWebSocketManager {
  private static readonly BASE_URLS = {
    transcription: 'wss://api.deepgram.com/v1/listen',
    agent: 'wss://agent.deepgram.com/v1/agent/converse'
  };

  private voiceOptions: VoiceWebSocketOptions;

  constructor(
    options: VoiceWebSocketOptions,
    handlers: WebSocketEventHandlers = {}
  ) {
    super({
      ...options,
      url: VoiceWebSocketManager.BASE_URLS[options.type]
    }, handlers);
    this.voiceOptions = options;
  }

  protected override buildWebSocketURL(): string {
    const url = new URL(VoiceWebSocketManager.BASE_URLS[this.voiceOptions.type]);

    if (this.voiceOptions.type === 'transcription') {
      if (this.voiceOptions.model) {
        url.searchParams.append('model', this.voiceOptions.model);
      }
      if (this.voiceOptions.encoding) {
        url.searchParams.append('encoding', this.voiceOptions.encoding);
      }
      if (this.voiceOptions.sampleRate) {
        url.searchParams.append('sample_rate', this.voiceOptions.sampleRate.toString());
      }
    }

    return url.toString();
  }

  public sendJSON(message: any): void {
    this.sendMessage(message);
  }

  public sendCloseStream(): void {
    if (this.voiceOptions.type === 'transcription') {
      this.sendMessage({ type: 'CloseStream' });
    }
  }

  public sendAgentSettings(settings: any): void {
    if (this.voiceOptions.type === 'agent') {
      this.sendMessage(settings);
    }
  }
} 