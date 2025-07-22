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
export declare class VoiceWebSocketManager extends BaseWebSocketManager {
    private static readonly BASE_URLS;
    private voiceOptions;
    constructor(options: VoiceWebSocketOptions, handlers?: WebSocketEventHandlers);
    protected buildWebSocketURL(): string;
    sendJSON(message: any): void;
    sendCloseStream(): void;
    sendAgentSettings(settings: any): void;
}
export {};
