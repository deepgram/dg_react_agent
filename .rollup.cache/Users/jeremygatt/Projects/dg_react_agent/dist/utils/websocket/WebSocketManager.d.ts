import { ConnectionState, WebSocketManagerOptions, WebSocketEventHandlers } from '../../types/common/connection';
import { ConnectionError } from '../../types/common/error';
interface WebSocketEvent {
    type: 'state' | 'message' | 'binary' | 'error';
    state?: ConnectionState;
    data?: any;
    error?: ConnectionError;
}
type WebSocketEventListener = (event: WebSocketEvent) => void;
export declare class WebSocketManager {
    protected options: WebSocketManagerOptions;
    protected handlers: WebSocketEventHandlers;
    protected ws: WebSocket | null;
    protected connectionState: ConnectionState;
    protected reconnectAttempts: number;
    protected reconnectTimer: number | null;
    protected isManualClose: boolean;
    protected instanceId: number;
    protected eventListeners: Set<WebSocketEventListener>;
    constructor(options: WebSocketManagerOptions, handlers?: WebSocketEventHandlers);
    protected log(message: string, data?: any): void;
    protected updateConnectionState(newState: ConnectionState): void;
    protected createConnection(): void;
    protected setupEventHandlers(): void;
    protected handleConnectionError(error: Error): void;
    protected handleMessageError(error: Error): void;
    protected shouldReconnect(): boolean;
    protected scheduleReconnect(): void;
    connect(): void;
    disconnect(): void;
    sendMessage(message: any): void;
    sendBinary(data: ArrayBuffer): void;
    getState(): ConnectionState;
    isConnected(): boolean;
    cleanup(): void;
    protected buildWebSocketURL(): string;
    addEventListener(listener: WebSocketEventListener): () => void;
    protected notifyListeners(event: WebSocketEvent): void;
}
export {};
