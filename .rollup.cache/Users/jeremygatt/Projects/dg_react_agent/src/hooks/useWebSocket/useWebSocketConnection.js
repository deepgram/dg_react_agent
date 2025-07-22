import { useCallback, useEffect, useRef, useState } from 'react';
import { ConnectionError } from '../../types/common/error';
/**
 * Base hook for WebSocket connection management.
 * Handles connection lifecycle, message sending, and error handling.
 */
export function useWebSocketConnection(manager, options) {
    if (options === void 0) { options = {}; }
    // State
    var _a = useState('disconnected'), connectionState = _a[0], setConnectionState = _a[1];
    var _b = useState(null), error = _b[0], setError = _b[1];
    var isCleaningUpRef = useRef(false);
    // Logging utility
    var log = useCallback(function (message) {
        if (options.debug) {
            console.log("[useWebSocketConnection] ".concat(message));
        }
    }, [options.debug]);
    // Handle connection state changes
    useEffect(function () {
        if (!manager || isCleaningUpRef.current)
            return;
        var handleStateChange = function (state) {
            var _a;
            setConnectionState(state);
            (_a = options.onConnectionStateChange) === null || _a === void 0 ? void 0 : _a.call(options, state);
            log("\uD83D\uDD04 Connection state: ".concat(state));
        };
        var handleError = function (error) {
            var _a;
            setError(error);
            (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, error);
            log("\u274C Connection error: ".concat(error.message));
        };
        var removeListener = manager.addEventListener(function (event) {
            if (event.type === 'state' && event.state) {
                handleStateChange(event.state);
            }
            else if (event.type === 'error' && event.error) {
                handleError(event.error);
            }
        });
        return function () {
            isCleaningUpRef.current = true;
            removeListener();
        };
    }, [manager, options.onConnectionStateChange, options.onError, log]);
    // Connect
    var connect = useCallback(function () {
        var _a;
        try {
            if (!manager) {
                throw new ConnectionError('Cannot connect - WebSocket manager not initialized');
            }
            manager.connect();
        }
        catch (error) {
            var connectionError = error instanceof ConnectionError ? error : new ConnectionError('Failed to connect', {
                originalError: error instanceof Error ? error : new Error('Unknown error')
            });
            setError(connectionError);
            (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, connectionError);
        }
    }, [manager, options.onError]);
    // Disconnect
    var disconnect = useCallback(function () {
        var _a;
        try {
            manager === null || manager === void 0 ? void 0 : manager.disconnect();
        }
        catch (error) {
            var connectionError = error instanceof ConnectionError ? error : new ConnectionError('Failed to disconnect', {
                originalError: error instanceof Error ? error : new Error('Unknown error')
            });
            setError(connectionError);
            (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, connectionError);
        }
    }, [manager, options.onError]);
    // Send message
    var sendMessage = useCallback(function (message) {
        var _a;
        try {
            if (!manager) {
                throw new ConnectionError('Cannot send message - WebSocket manager not initialized');
            }
            if (connectionState !== 'connected') {
                throw new ConnectionError('Cannot send message - WebSocket not connected');
            }
            manager.sendMessage(message);
        }
        catch (error) {
            var connectionError = error instanceof ConnectionError ? error : new ConnectionError('Failed to send message', {
                originalError: error instanceof Error ? error : new Error('Unknown error')
            });
            setError(connectionError);
            (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, connectionError);
        }
    }, [manager, connectionState, options.onError]);
    // Send binary data
    var sendBinary = useCallback(function (data) {
        var _a;
        try {
            if (!manager) {
                throw new ConnectionError('Cannot send binary data - WebSocket manager not initialized');
            }
            if (connectionState !== 'connected') {
                throw new ConnectionError('Cannot send binary data - WebSocket not connected');
            }
            manager.sendBinary(data);
        }
        catch (error) {
            var connectionError = error instanceof ConnectionError ? error : new ConnectionError('Failed to send binary data', {
                originalError: error instanceof Error ? error : new Error('Unknown error')
            });
            setError(connectionError);
            (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, connectionError);
        }
    }, [manager, connectionState, options.onError]);
    return {
        connect: connect,
        disconnect: disconnect,
        sendMessage: sendMessage,
        sendBinary: sendBinary,
        isConnected: connectionState === 'connected',
        connectionState: connectionState,
        error: error
    };
}
//# sourceMappingURL=useWebSocketConnection.js.map