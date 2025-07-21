import { WebSocketManager } from './WebSocketManager';
import { WebSocketManagerOptions, WebSocketEventHandlers } from '../../types/common/connection';
interface VoiceWebSocketOptions extends WebSocketManagerOptions {
    service: 'transcription' | 'agent';
    queryParams?: Record<string, string | number | boolean>;
}
export declare class VoiceWebSocketManager extends WebSocketManager {
    constructor(options: VoiceWebSocketOptions, handlers?: WebSocketEventHandlers);
    protected buildWebSocketURL(): string;
    sendCloseStream(): void;
    close(): void;
    sendJSON(message: any): void;
}
export {};
