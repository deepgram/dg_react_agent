import { WebSocketManager } from './WebSocketManager';
import { WebSocketManagerOptions, WebSocketEventHandlers } from '../../types/common/connection';
import { DeepgramTTSMessage } from '../../types/tts';
interface TTSWebSocketOptions extends Omit<WebSocketManagerOptions, 'url'> {
    model?: string;
    encoding?: string;
    sampleRate?: number;
}
export declare class TTSWebSocketManager extends WebSocketManager {
    constructor(options: TTSWebSocketOptions, handlers?: WebSocketEventHandlers);
    protected buildWebSocketURL(): string;
    sendJSON(message: DeepgramTTSMessage): void;
}
export {};
