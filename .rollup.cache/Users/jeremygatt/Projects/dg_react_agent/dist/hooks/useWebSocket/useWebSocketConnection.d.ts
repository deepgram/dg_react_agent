import { BaseWebSocketManager } from '../../utils/shared/BaseWebSocketManager';
import { ConnectionState } from '../../types/common/connection';
import { ConnectionError } from '../../types/common/error';
interface UseWebSocketConnectionOptions {
    debug?: boolean;
    onConnectionStateChange?: (state: ConnectionState) => void;
    onError?: (error: ConnectionError) => void;
}
interface UseWebSocketConnectionReturn {
    connect: () => void;
    disconnect: () => void;
    sendMessage: (message: any) => void;
    sendBinary: (data: ArrayBuffer) => void;
    isConnected: boolean;
    connectionState: ConnectionState;
    error: ConnectionError | null;
}
/**
 * Base hook for WebSocket connection management.
 * Handles connection lifecycle, message sending, and error handling.
 */
export declare function useWebSocketConnection(manager: BaseWebSocketManager | null, options?: UseWebSocketConnectionOptions): UseWebSocketConnectionReturn;
export {};
