import { useCallback, useEffect, useRef, useState } from 'react';
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
export function useWebSocketConnection(
  manager: BaseWebSocketManager | null,
  options: UseWebSocketConnectionOptions = {}
): UseWebSocketConnectionReturn {
  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<ConnectionError | null>(null);
  const isCleaningUpRef = useRef(false);

  // Logging utility
  const log = useCallback((message: string) => {
    if (options.debug) {
      console.log(`[useWebSocketConnection] ${message}`);
    }
  }, [options.debug]);

  // Handle connection state changes
  useEffect(() => {
    if (!manager || isCleaningUpRef.current) return;

    const handleStateChange = (state: ConnectionState) => {
      setConnectionState(state);
      options.onConnectionStateChange?.(state);
      log(`🔄 Connection state: ${state}`);
    };

    const handleError = (error: ConnectionError) => {
      setError(error);
      options.onError?.(error);
      log(`❌ Connection error: ${error.message}`);
    };

    const removeListener = manager.addEventListener((event) => {
      if (event.type === 'state' && event.state) {
        handleStateChange(event.state);
      } else if (event.type === 'error' && event.error) {
        handleError(event.error);
      }
    });

    return () => {
      isCleaningUpRef.current = true;
      removeListener();
    };
  }, [manager, options.onConnectionStateChange, options.onError, log]);

  // Connect
  const connect = useCallback(() => {
    try {
      if (!manager) {
        throw new ConnectionError('Cannot connect - WebSocket manager not initialized');
      }
      manager.connect();
    } catch (error) {
      const connectionError = error instanceof ConnectionError ? error : new ConnectionError('Failed to connect', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      setError(connectionError);
      options.onError?.(connectionError);
    }
  }, [manager, options.onError]);

  // Disconnect
  const disconnect = useCallback(() => {
    try {
      manager?.disconnect();
    } catch (error) {
      const connectionError = error instanceof ConnectionError ? error : new ConnectionError('Failed to disconnect', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      setError(connectionError);
      options.onError?.(connectionError);
    }
  }, [manager, options.onError]);

  // Send message
  const sendMessage = useCallback((message: any) => {
    try {
      if (!manager) {
        throw new ConnectionError('Cannot send message - WebSocket manager not initialized');
      }
      if (connectionState !== 'connected') {
        throw new ConnectionError('Cannot send message - WebSocket not connected');
      }
      manager.sendMessage(message);
    } catch (error) {
      const connectionError = error instanceof ConnectionError ? error : new ConnectionError('Failed to send message', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      setError(connectionError);
      options.onError?.(connectionError);
    }
  }, [manager, connectionState, options.onError]);

  // Send binary data
  const sendBinary = useCallback((data: ArrayBuffer) => {
    try {
      if (!manager) {
        throw new ConnectionError('Cannot send binary data - WebSocket manager not initialized');
      }
      if (connectionState !== 'connected') {
        throw new ConnectionError('Cannot send binary data - WebSocket not connected');
      }
      manager.sendBinary(data);
    } catch (error) {
      const connectionError = error instanceof ConnectionError ? error : new ConnectionError('Failed to send binary data', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      setError(connectionError);
      options.onError?.(connectionError);
    }
  }, [manager, connectionState, options.onError]);

  return {
    connect,
    disconnect,
    sendMessage,
    sendBinary,
    isConnected: connectionState === 'connected',
    connectionState,
    error
  };
} 