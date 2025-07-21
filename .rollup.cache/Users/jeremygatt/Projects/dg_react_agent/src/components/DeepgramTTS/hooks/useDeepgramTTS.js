import { __awaiter, __generator } from "tslib";
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { MessageHandler } from '../../../utils/tts/messageHandler';
import { ProtocolHandler } from '../../../utils/tts/protocolHandler';
import { AudioManager } from '../../../utils/audio/AudioManager';
import { MetricsCollector } from '../../../utils/tts/metricsCollector';
import { TTSWebSocketManager } from '../../../utils/websocket/TTSWebSocketManager';
export function useDeepgramTTS(apiKey, options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    // State management
    var isPlaying = useState(false)[0];
    var _a = useState(false), isConnected = _a[0], setIsConnected = _a[1];
    var _b = useState('disconnected'), setConnectionState = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    var metrics = useState(null)[0];
    var _d = useState(false), isReady = _d[0], setIsReady = _d[1];
    // Refs for managers (prevent recreating on every render)
    var websocketManagerRef = useRef(null);
    var messageHandlerRef = useRef(null);
    var protocolHandlerRef = useRef(null);
    var audioManagerRef = useRef(null);
    var metricsCollectorRef = useRef(null);
    // Smart debug level processing
    var debugConfig = useMemo(function () {
        var debugOption = options.debug;
        if (debugOption === false || debugOption === 'off') {
            return { level: 'off', hookDebug: false, managerDebug: false };
        }
        if (debugOption === true || debugOption === 'hook') {
            return { level: 'hook', hookDebug: true, managerDebug: false };
        }
        if (debugOption === 'manager') {
            return { level: 'manager', hookDebug: true, managerDebug: true };
        }
        if (debugOption === 'verbose') {
            return { level: 'verbose', hookDebug: true, managerDebug: true };
        }
        return { level: 'off', hookDebug: false, managerDebug: false };
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
        enableMetrics: options.enableMetrics,
        enableTextChunking: options.enableTextChunking,
        maxChunkSize: options.maxChunkSize,
        debugConfig: debugConfig,
        onConnectionChange: options.onConnectionChange,
        onError: options.onError,
        onMetrics: options.onMetrics
    }); }, [
        options.enableMetrics,
        options.enableTextChunking,
        options.maxChunkSize,
        debugConfig,
        options.onConnectionChange,
        options.onError,
        options.onMetrics
    ]);
    // Initialize TTS system
    useEffect(function () {
        // Safety check: Don't initialize if no API key
        if (!apiKey || apiKey.trim() === '') {
            log('No API key provided, skipping initialization');
            return;
        }
        var cleanup;
        var initialize = function () { return __awaiter(_this, void 0, void 0, function () {
            var unsubscribe_1, error_1, ttsError;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        log('🚀 Initializing Deepgram TTS...');
                        // Initialize metrics collector
                        metricsCollectorRef.current = new MetricsCollector({
                            debug: memoizedOptions.debugConfig.managerDebug
                        });
                        // Initialize message handler
                        messageHandlerRef.current = new MessageHandler({
                            debug: memoizedOptions.debugConfig.managerDebug
                        }, {
                            onAudioData: function (chunk) {
                                var _a;
                                log("\uD83D\uDCE6 Audio chunk received: ".concat(chunk.data.byteLength, " bytes"), 'verbose');
                                // Record metrics
                                if (metricsCollectorRef.current) {
                                    metricsCollectorRef.current.markFirstByte();
                                    metricsCollectorRef.current.addChunk(chunk.data.byteLength);
                                }
                                // Queue audio for playback
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
                                var _a;
                                log("\u274C Message handler error: ".concat(error.message));
                                setError(error);
                                (_a = memoizedOptions.onError) === null || _a === void 0 ? void 0 : _a.call(memoizedOptions, error);
                            }
                        });
                        // Initialize protocol handler
                        protocolHandlerRef.current = new ProtocolHandler({
                            debug: memoizedOptions.debugConfig.managerDebug,
                            enableTextChunking: memoizedOptions.enableTextChunking,
                            maxChunkSize: memoizedOptions.maxChunkSize
                        });
                        // Initialize WebSocket manager
                        websocketManagerRef.current = new TTSWebSocketManager({
                            apiKey: apiKey,
                            debug: memoizedOptions.debugConfig.managerDebug,
                            maxReconnectAttempts: 0,
                            reconnectDelay: 1000,
                            model: 'aura-2-thalia-en',
                            encoding: 'linear16',
                            sampleRate: 48000
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
                            },
                            onError: function (error) {
                                var _a;
                                log("\u274C Connection error: ".concat(error.message));
                                setError(error);
                                (_a = memoizedOptions.onError) === null || _a === void 0 ? void 0 : _a.call(memoizedOptions, error);
                            },
                            onConnectionStateChange: function (state) {
                                // Only update state if it actually changed
                                setConnectionState(function (prevState) {
                                    var _a;
                                    if (prevState !== state) {
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
                                        return state;
                                    }
                                    return prevState;
                                });
                            }
                        });
                        // Initialize audio manager
                        audioManagerRef.current = new AudioManager({
                            debug: memoizedOptions.debugConfig.managerDebug
                        });
                        unsubscribe_1 = audioManagerRef.current.addEventListener(function (event) {
                            var _a;
                            if (event.type === 'ready') {
                                log('🔊 Audio system ready');
                            }
                            else if (event.type === 'playing') {
                                log('▶️ Audio playback started', 'verbose');
                                if (metricsCollectorRef.current) {
                                    metricsCollectorRef.current.markFirstAudio();
                                }
                            }
                            else if (event.type === 'error' && event.error) {
                                log("\u274C Audio error: ".concat(event.error.message));
                                setError(event.error);
                                (_a = memoizedOptions.onError) === null || _a === void 0 ? void 0 : _a.call(memoizedOptions, event.error);
                            }
                        });
                        cleanup = function () {
                            var _a, _b;
                            log('🧹 Cleaning up TTS resources', 'verbose');
                            unsubscribe_1();
                            (_a = audioManagerRef.current) === null || _a === void 0 ? void 0 : _a.cleanup();
                            (_b = websocketManagerRef.current) === null || _b === void 0 ? void 0 : _b.cleanup();
                        };
                        // Initialize audio manager
                        return [4 /*yield*/, audioManagerRef.current.initialize()];
                    case 1:
                        // Initialize audio manager
                        _c.sent();
                        // Connect WebSocket
                        websocketManagerRef.current.connect();
                        // Start metrics collection
                        if (memoizedOptions.enableMetrics) {
                            (_a = metricsCollectorRef.current) === null || _a === void 0 ? void 0 : _a.start();
                        }
                        // Set ready state
                        setIsReady(true);
                        log('✅ Deepgram TTS ready!');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _c.sent();
                        ttsError = error_1;
                        log("\u274C Initialization failed: ".concat(ttsError.message));
                        setError(ttsError);
                        (_b = memoizedOptions.onError) === null || _b === void 0 ? void 0 : _b.call(memoizedOptions, ttsError);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        initialize();
        return function () {
            cleanup === null || cleanup === void 0 ? void 0 : cleanup();
        };
    }, [apiKey, memoizedOptions.debugConfig.level, memoizedOptions.enableMetrics, log, memoizedOptions]);
    // Speak text
    var speak = useCallback(function (text) { return __awaiter(_this, void 0, void 0, function () {
        var message, flushMessage, ttsError;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            if (!isReady) {
                throw new Error('TTS is not ready');
            }
            if (!text || text.trim().length === 0) {
                throw new Error('Text cannot be empty');
            }
            try {
                log("\uD83D\uDDE3\uFE0F Speaking: \"".concat(text.substring(0, 50)).concat(text.length > 50 ? '...' : '', "\""));
                // Start metrics collection
                if (memoizedOptions.enableMetrics) {
                    (_a = metricsCollectorRef.current) === null || _a === void 0 ? void 0 : _a.start();
                }
                message = (_b = protocolHandlerRef.current) === null || _b === void 0 ? void 0 : _b.createSpeakMessage(text);
                if (message && websocketManagerRef.current) {
                    websocketManagerRef.current.sendMessage(message);
                }
                flushMessage = (_c = protocolHandlerRef.current) === null || _c === void 0 ? void 0 : _c.createFlushMessage();
                if (flushMessage && websocketManagerRef.current) {
                    websocketManagerRef.current.sendMessage(flushMessage);
                }
            }
            catch (error) {
                ttsError = error;
                log("\u274C Speak failed: ".concat(ttsError.message));
                setError(ttsError);
                (_d = memoizedOptions.onError) === null || _d === void 0 ? void 0 : _d.call(memoizedOptions, ttsError);
                throw ttsError;
            }
            return [2 /*return*/];
        });
    }); }, [isReady, memoizedOptions.enableMetrics, memoizedOptions.onError, log]);
    // Stream text (for LLM streaming)
    var streamText = useCallback(function (text) { return __awaiter(_this, void 0, void 0, function () {
        var message, ttsError;
        var _a, _b;
        return __generator(this, function (_c) {
            if (!isReady) {
                throw new Error('TTS is not ready');
            }
            if (!text || text.trim().length === 0) {
                return [2 /*return*/];
            }
            try {
                log("\uD83D\uDCDD Streaming text: \"".concat(text.substring(0, 30), "...\""), 'verbose');
                message = (_a = protocolHandlerRef.current) === null || _a === void 0 ? void 0 : _a.createSpeakMessage(text);
                if (message && websocketManagerRef.current) {
                    websocketManagerRef.current.sendMessage(message);
                }
            }
            catch (error) {
                ttsError = error;
                log("\u274C Stream failed: ".concat(ttsError.message));
                setError(ttsError);
                (_b = memoizedOptions.onError) === null || _b === void 0 ? void 0 : _b.call(memoizedOptions, ttsError);
                throw ttsError;
            }
            return [2 /*return*/];
        });
    }); }, [isReady, memoizedOptions.onError, log]);
    // Flush stream
    var flushStream = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var flushMessage, ttsError;
        var _a, _b;
        return __generator(this, function (_c) {
            if (!isReady) {
                throw new Error('TTS is not ready');
            }
            try {
                log('🚿 Flushing stream', 'verbose');
                flushMessage = (_a = protocolHandlerRef.current) === null || _a === void 0 ? void 0 : _a.createFlushMessage();
                if (flushMessage && websocketManagerRef.current) {
                    websocketManagerRef.current.sendMessage(flushMessage);
                }
            }
            catch (error) {
                ttsError = error;
                log("\u274C Flush failed: ".concat(ttsError.message));
                setError(ttsError);
                (_b = memoizedOptions.onError) === null || _b === void 0 ? void 0 : _b.call(memoizedOptions, ttsError);
                throw ttsError;
            }
            return [2 /*return*/];
        });
    }); }, [isReady, memoizedOptions.onError, log]);
    // Clear audio
    var clear = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var clearMessage, ttsError;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            if (!isReady) {
                throw new Error('TTS is not ready');
            }
            try {
                log('🧹 Clearing audio queue');
                clearMessage = (_a = protocolHandlerRef.current) === null || _a === void 0 ? void 0 : _a.createClearMessage();
                if (clearMessage && websocketManagerRef.current) {
                    websocketManagerRef.current.sendMessage(clearMessage);
                }
                // Clear audio queue
                (_b = audioManagerRef.current) === null || _b === void 0 ? void 0 : _b.clearAudioQueue();
            }
            catch (error) {
                ttsError = error;
                log("\u274C Clear failed: ".concat(ttsError.message));
                setError(ttsError);
                (_c = memoizedOptions.onError) === null || _c === void 0 ? void 0 : _c.call(memoizedOptions, ttsError);
                throw ttsError;
            }
            return [2 /*return*/];
        });
    }); }, [isReady, memoizedOptions.onError, log]);
    // Stop playback
    var stop = useCallback(function () {
        var _a, _b;
        log('⏹️ Stopping playback', 'verbose');
        (_a = audioManagerRef.current) === null || _a === void 0 ? void 0 : _a.stop();
        (_b = metricsCollectorRef.current) === null || _b === void 0 ? void 0 : _b.reset();
    }, [log]);
    // Return hook interface
    return {
        speak: speak,
        streamText: streamText,
        flushStream: flushStream,
        stop: stop,
        clear: clear,
        isPlaying: isPlaying,
        isConnected: isConnected,
        isReady: isReady,
        error: error,
        metrics: metrics
    };
}
//# sourceMappingURL=useDeepgramTTS.js.map