import { __assign, __awaiter, __generator } from "tslib";
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { MessageHandler } from '../../../utils/tts/messageHandler';
import { AudioManager } from '../../../utils/audio/AudioManager';
import { MetricsCollector } from '../../../utils/tts/metricsCollector';
import { TTSWebSocketManager } from '../../../utils/websocket/TTSWebSocketManager';
import { AUDIO_CONFIG, WEBSOCKET_CONFIG, MODEL_CONFIG, DEBUG_CONFIG, METRICS_CONFIG, mergeConfig } from '../../../utils/shared/config';
var DEFAULT_TTS_CONFIG = {
    debug: DEBUG_CONFIG.defaultLevel,
    enableMetrics: METRICS_CONFIG.enableByDefault,
    enableTextChunking: false,
    maxChunkSize: METRICS_CONFIG.chunkSizeLimit,
    model: MODEL_CONFIG.tts.default
};
export function useDeepgramTTS(apiKey, options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    // Merge configuration with defaults
    var config = useMemo(function () { return mergeConfig(DEFAULT_TTS_CONFIG, options); }, [options]);
    // State management
    var _a = useState(false), isConnected = _a[0], setIsConnected = _a[1];
    var _b = useState(false), isReady = _b[0], setIsReady = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    var _d = useState(false), isPlaying = _d[0], setIsPlaying = _d[1];
    var _e = useState(null), metrics = _e[0], setMetrics = _e[1];
    // Refs for managers (prevent recreating on every render)
    var websocketManagerRef = useRef(null);
    var messageHandlerRef = useRef(null);
    var protocolHandlerRef = useRef(null);
    var audioManagerRef = useRef(null);
    var metricsCollectorRef = useRef(null);
    // Smart debug level processing
    var debugConfig = useMemo(function () {
        var config = {
            level: 'off',
            hookDebug: false,
            managerDebug: false
        };
        var debugOption = options.debug;
        switch (debugOption) {
            case true:
            case 'hook':
                return __assign(__assign({}, config), { level: 'hook', hookDebug: true });
            case 'manager':
                return __assign(__assign({}, config), { level: 'manager', hookDebug: true, managerDebug: true });
            case 'verbose':
                return __assign(__assign({}, config), { level: 'verbose', hookDebug: true, managerDebug: true });
            default:
                return config;
        }
    }, [options.debug]);
    // Centralized logging function
    var log = useCallback(function (message, level) {
        if (level === void 0) { level = 'hook'; }
        if (debugConfig.level === 'off')
            return;
        if (level === 'hook' && debugConfig.hookDebug) {
            console.log("[DeepgramTTS] ".concat(message));
        }
        else if (level === 'manager' && debugConfig.level === 'manager') {
            console.log("[DeepgramTTS:Manager] ".concat(message));
        }
        else if (level === 'verbose' && debugConfig.level === 'verbose') {
            console.log("[DeepgramTTS:Verbose] ".concat(message));
        }
    }, [debugConfig]);
    // Memoized options to prevent unnecessary re-initializations
    var memoizedOptions = useMemo(function () { return ({
        enableMetrics: config.enableMetrics,
        enableTextChunking: config.enableTextChunking,
        maxChunkSize: config.maxChunkSize,
        debugConfig: debugConfig,
        onConnectionChange: config.onConnectionChange,
        onError: config.onError,
        onMetrics: config.onMetrics
    }); }, [
        config.enableMetrics,
        config.enableTextChunking,
        config.maxChunkSize,
        config.onConnectionChange,
        config.onError,
        config.onMetrics,
        debugConfig
    ]);
    // Utility function to handle operation errors
    var handleOperationError = useCallback(function (error, operation) {
        var _a;
        var ttsError = error;
        log("\u274C ".concat(operation, " failed: ").concat(ttsError.message));
        setError(ttsError);
        (_a = memoizedOptions.onError) === null || _a === void 0 ? void 0 : _a.call(memoizedOptions, ttsError);
        throw ttsError;
    }, [log, memoizedOptions.onError]);
    // Utility function to send WebSocket messages
    var sendWebSocketMessage = useCallback(function (createMessage) {
        var message = createMessage();
        if (message && websocketManagerRef.current) {
            websocketManagerRef.current.sendMessage(message);
            return true;
        }
        return false;
    }, []);
    // Utility function to ensure the system is ready
    var ensureReady = useCallback(function () {
        if (!isReady) {
            throw new Error('TTS is not ready');
        }
    }, [isReady]);
    // Utility function to clean up resources
    var cleanupResources = useCallback(function () {
        var _a, _b, _c, _d, _e;
        log('🧹 Cleaning up TTS resources', 'verbose');
        // Stop and clean audio
        (_a = audioManagerRef.current) === null || _a === void 0 ? void 0 : _a.stop();
        (_b = audioManagerRef.current) === null || _b === void 0 ? void 0 : _b.clearAudioQueue();
        (_c = audioManagerRef.current) === null || _c === void 0 ? void 0 : _c.cleanup();
        // Clean up other managers
        (_d = websocketManagerRef.current) === null || _d === void 0 ? void 0 : _d.cleanup();
        (_e = metricsCollectorRef.current) === null || _e === void 0 ? void 0 : _e.reset();
        // Reset refs
        audioManagerRef.current = null;
        websocketManagerRef.current = null;
        messageHandlerRef.current = null;
        protocolHandlerRef.current = null;
        metricsCollectorRef.current = null;
        // Reset state
        setIsConnected(false);
        setIsReady(false);
        setError(null);
        setIsPlaying(false);
        setMetrics(null);
        log('✅ TTS system cleaned up');
    }, [log]);
    // Initialize metrics collector
    var initializeMetrics = useCallback(function () {
        metricsCollectorRef.current = new MetricsCollector({
            debug: memoizedOptions.debugConfig.managerDebug
        });
    }, [memoizedOptions.debugConfig.managerDebug]);
    // Initialize message handler
    var initializeMessageHandler = useCallback(function () {
        messageHandlerRef.current = new MessageHandler({
            debug: memoizedOptions.debugConfig.managerDebug
        }, {
            onAudioData: function (chunk) {
                var _a;
                log("\uD83D\uDCE6 Audio chunk received: ".concat(chunk.data.byteLength, " bytes"), 'verbose');
                if (metricsCollectorRef.current) {
                    metricsCollectorRef.current.markFirstByte();
                    metricsCollectorRef.current.addChunk(chunk.data.byteLength);
                }
                (_a = audioManagerRef.current) === null || _a === void 0 ? void 0 : _a.queueAudio(chunk.data);
            },
            onMetadata: function (metadata) {
                log('📋 Metadata received', 'hook');
                log("\uD83D\uDCCB Metadata details: ".concat(JSON.stringify(metadata)), 'verbose');
            },
            onFlushed: function () {
                log('✅ Audio stream flushed', 'verbose');
            },
            onCleared: function () {
                log('🧹 Audio queue cleared', 'verbose');
            },
            onError: function (error) {
                handleOperationError(error, 'Message handler');
            }
        });
    }, [log, handleOperationError, memoizedOptions.debugConfig.managerDebug]);
    // Initialize WebSocket manager
    var initializeWebSocket = useCallback(function () {
        websocketManagerRef.current = new TTSWebSocketManager({
            apiKey: apiKey,
            debug: memoizedOptions.debugConfig.managerDebug,
            maxReconnectAttempts: WEBSOCKET_CONFIG.maxReconnectAttempts,
            reconnectDelay: WEBSOCKET_CONFIG.reconnectDelay,
            model: config.model || MODEL_CONFIG.tts.default,
            encoding: AUDIO_CONFIG.encoding,
            sampleRate: AUDIO_CONFIG.sampleRate
        }, {
            onOpen: function () {
                log('🔗 Connected to Deepgram TTS');
            },
            onMessage: function (data) {
                var _a;
                (_a = messageHandlerRef.current) === null || _a === void 0 ? void 0 : _a.handleMessage(data);
            },
            onClose: function () {
                log('🔌 Disconnected from Deepgram TTS');
                setIsConnected(false);
            },
            onError: function (error) {
                handleOperationError(error, 'WebSocket connection');
            },
            onConnectionStateChange: function (state) {
                var _a;
                var stateEmojis = {
                    'disconnected': '⚫',
                    'connecting': '🟡',
                    'connected': '🟢',
                    'error': '🔴',
                    'closed': '⚪'
                };
                log("".concat(stateEmojis[state], " Connection: ").concat(state));
                setIsConnected(state === 'connected');
                (_a = memoizedOptions.onConnectionChange) === null || _a === void 0 ? void 0 : _a.call(memoizedOptions, state === 'connected');
            }
        });
    }, [apiKey, memoizedOptions.debugConfig.managerDebug, config.model]);
    // Initialize audio manager
    var initializeAudio = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    audioManagerRef.current = new AudioManager(__assign({ debug: memoizedOptions.debugConfig.managerDebug }, config.microphoneConfig));
                    audioManagerRef.current.addEventListener(function (event) {
                        if (event.type === 'ready') {
                            log('🔊 Audio system ready');
                        }
                        else if (event.type === 'playing') {
                            log('▶️ Audio playback started', 'verbose');
                            setIsPlaying(true);
                            if (metricsCollectorRef.current) {
                                metricsCollectorRef.current.markFirstAudio();
                            }
                        }
                        else if (event.type === 'error' && event.error) {
                            handleOperationError(event.error, 'Audio system');
                        }
                    });
                    return [4 /*yield*/, audioManagerRef.current.initialize()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [memoizedOptions.debugConfig.managerDebug, config.microphoneConfig]);
    // Initialize TTS system
    useEffect(function () {
        if (!apiKey || apiKey.trim() === '') {
            log('No API key provided, skipping initialization');
            return;
        }
        var initialize = function () { return __awaiter(_this, void 0, void 0, function () {
            var error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        log('🚀 Initializing Deepgram TTS...');
                        initializeMetrics();
                        initializeMessageHandler();
                        initializeWebSocket();
                        return [4 /*yield*/, initializeAudio()];
                    case 1:
                        _c.sent();
                        // Connect WebSocket
                        (_a = websocketManagerRef.current) === null || _a === void 0 ? void 0 : _a.connect();
                        // Start metrics collection
                        if (memoizedOptions.enableMetrics) {
                            (_b = metricsCollectorRef.current) === null || _b === void 0 ? void 0 : _b.start();
                        }
                        setIsReady(true);
                        log('✅ Deepgram TTS ready!');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _c.sent();
                        handleOperationError(error_1, 'Initialization');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        initialize();
        return cleanupResources;
    }, [
        apiKey,
        log,
        memoizedOptions.enableMetrics,
        initializeMetrics,
        initializeMessageHandler,
        initializeWebSocket,
        initializeAudio,
        cleanupResources,
        handleOperationError
    ]);
    // Speak text
    var speak = useCallback(function (text) { return __awaiter(_this, void 0, void 0, function () {
        var speakSuccess, flushSuccess;
        var _a;
        return __generator(this, function (_b) {
            ensureReady();
            if (!text || text.trim().length === 0) {
                throw new Error('Text cannot be empty');
            }
            try {
                log("\uD83D\uDDE3\uFE0F Speaking: \"".concat(text.substring(0, 50)).concat(text.length > 50 ? '...' : '', "\""));
                if (memoizedOptions.enableMetrics) {
                    (_a = metricsCollectorRef.current) === null || _a === void 0 ? void 0 : _a.start();
                }
                speakSuccess = sendWebSocketMessage(function () { var _a; return (_a = protocolHandlerRef.current) === null || _a === void 0 ? void 0 : _a.createSpeakMessage(text); });
                if (!speakSuccess) {
                    throw new Error('Failed to send speak message');
                }
                flushSuccess = sendWebSocketMessage(function () { var _a; return (_a = protocolHandlerRef.current) === null || _a === void 0 ? void 0 : _a.createFlushMessage(); });
                if (!flushSuccess) {
                    throw new Error('Failed to send flush message');
                }
            }
            catch (error) {
                handleOperationError(error, 'Speak');
            }
            return [2 /*return*/];
        });
    }); }, [ensureReady, log, memoizedOptions.enableMetrics, sendWebSocketMessage, handleOperationError]);
    // Stream text (for LLM streaming)
    var streamText = useCallback(function (text) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            ensureReady();
            if (!text || text.trim().length === 0) {
                return [2 /*return*/];
            }
            try {
                log("\uD83D\uDCDD Streaming text: \"".concat(text.substring(0, 30), "...\""), 'verbose');
                sendWebSocketMessage(function () { var _a; return (_a = protocolHandlerRef.current) === null || _a === void 0 ? void 0 : _a.createSpeakMessage(text); });
            }
            catch (error) {
                handleOperationError(error, 'Stream');
            }
            return [2 /*return*/];
        });
    }); }, [ensureReady, log, sendWebSocketMessage, handleOperationError]);
    // Flush stream
    var flushStream = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            ensureReady();
            try {
                log('🚿 Flushing stream', 'verbose');
                sendWebSocketMessage(function () { var _a; return (_a = protocolHandlerRef.current) === null || _a === void 0 ? void 0 : _a.createFlushMessage(); });
            }
            catch (error) {
                handleOperationError(error, 'Flush');
            }
            return [2 /*return*/];
        });
    }); }, [ensureReady, log, sendWebSocketMessage, handleOperationError]);
    // Clear audio
    var clear = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            ensureReady();
            try {
                log('🧹 Clearing audio queue');
                sendWebSocketMessage(function () { var _a; return (_a = protocolHandlerRef.current) === null || _a === void 0 ? void 0 : _a.createClearMessage(); });
                (_a = audioManagerRef.current) === null || _a === void 0 ? void 0 : _a.clearAudioQueue();
            }
            catch (error) {
                handleOperationError(error, 'Clear');
            }
            return [2 /*return*/];
        });
    }); }, [ensureReady, log, sendWebSocketMessage, handleOperationError]);
    // Stop playback
    var stop = useCallback(function () {
        var _a, _b;
        log('⏹️ Stopping playback', 'verbose');
        (_a = audioManagerRef.current) === null || _a === void 0 ? void 0 : _a.stop();
        (_b = metricsCollectorRef.current) === null || _b === void 0 ? void 0 : _b.reset();
        setIsPlaying(false);
    }, [log]);
    // Disconnect and cleanup
    var disconnect = useCallback(function () {
        log('🔌 Disconnecting TTS system');
        cleanupResources();
    }, [log, cleanupResources]);
    return {
        speak: speak,
        streamText: streamText,
        flushStream: flushStream,
        stop: stop,
        clear: clear,
        disconnect: disconnect,
        isPlaying: isPlaying,
        isConnected: isConnected,
        isReady: isReady,
        error: error,
        metrics: metrics
    };
}
//# sourceMappingURL=useDeepgramTTS.js.map