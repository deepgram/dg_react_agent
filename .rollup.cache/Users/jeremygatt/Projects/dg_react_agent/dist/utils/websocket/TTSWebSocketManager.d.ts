import { BaseWebSocketManager } from '../shared/BaseWebSocketManager';
import { WebSocketManagerOptions, WebSocketEventHandlers } from '../../types/common/connection';
interface TTSWebSocketOptions extends Omit<WebSocketManagerOptions, 'url'> {
    model: string;
    encoding: string;
    sampleRate: number;
}
export declare class TTSWebSocketManager extends BaseWebSocketManager {
    private static readonly BASE_URL;
    private ttsOptions;
    constructor(options: TTSWebSocketOptions, handlers?: WebSocketEventHandlers);
    protected buildWebSocketURL(): string;
}
export {};
