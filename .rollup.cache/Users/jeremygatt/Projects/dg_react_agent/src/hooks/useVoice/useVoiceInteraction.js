import { __assign, __awaiter, __generator } from "tslib";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioInput } from '../useAudio/useAudioInput';
import { useWebSocketConnection } from '../useWebSocket/useWebSocketConnection';
import { VoiceWebSocketManager } from '../../utils/websocket/VoiceWebSocketManager';
import { VoiceError } from '../../types/voice/error';
import { AUDIO_CONFIG, MODEL_CONFIG } from '../../utils/shared/config';
export function useVoiceInteraction(options) {
    var _this = this;
    var _a;
    // State
    var _b = useState(false), isReady = _b[0], setIsReady = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    var _d = useState('idle'), agentState = _d[0], setAgentState = _d[1];
    var isCleaningUpRef = useRef(false);
    var userSpeakingRef = useRef(false);
    var isWaitingForUserVoiceAfterSleep = useRef(false);
    var isInitializedRef = useRef(false);
    var optionsRef = useRef(options);
    // Update options ref when they change
    useEffect(function () {
        optionsRef.current = options;
    }, [options]);
    // Logging utility
    var log = useCallback(function (message) {
        if (optionsRef.current.debug) {
            console.log("[VoiceInteraction] ".concat(message));
        }
    }, []); // No dependencies needed since we use ref
    // Managers
    var transcriptionManager = useRef(null);
    var agentManager = useRef(null);
    var audioInputRef = useRef(null);
    var audioOutputRef = useRef(null);
    // Cleanup utility
    var cleanupManagers = useCallback(function () {
        if (!isCleaningUpRef.current) {
            isCleaningUpRef.current = true;
            log('🧹 Cleaning up voice interaction system...');
            if (transcriptionManager.current) {
                transcriptionManager.current.cleanup();
                transcriptionManager.current = null;
            }
            if (agentManager.current) {
                agentManager.current.cleanup();
                agentManager.current = null;
            }
            if (audioInputRef.current) {
                audioInputRef.current.cleanup();
                audioInputRef.current = null;
            }
            if (audioOutputRef.current) {
                audioOutputRef.current.cleanup();
                audioOutputRef.current = null;
            }
            isCleaningUpRef.current = false;
            isInitializedRef.current = false;
            setIsReady(false);
            log('✅ Voice interaction system cleaned up');
        }
    }, []); // No dependencies needed since we use refs
    // Initialize voice interaction system
    useEffect(function () {
        if (!optionsRef.current.apiKey || isCleaningUpRef.current)
            return;
        var initialize = function () { return __awaiter(_this, void 0, void 0, function () {
            var voiceError;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                try {
                    log('🚀 Initializing voice interaction system...');
                    // Create WebSocket managers
                    transcriptionManager.current = new VoiceWebSocketManager({
                        type: 'transcription',
                        apiKey: optionsRef.current.apiKey,
                        model: ((_a = optionsRef.current.transcriptionOptions) === null || _a === void 0 ? void 0 : _a.model) || MODEL_CONFIG.transcription.default,
                        encoding: AUDIO_CONFIG.encoding,
                        sampleRate: AUDIO_CONFIG.sampleRate,
                        debug: optionsRef.current.debug
                    });
                    agentManager.current = new VoiceWebSocketManager({
                        type: 'agent',
                        apiKey: optionsRef.current.apiKey,
                        debug: optionsRef.current.debug
                    });
                    setIsReady(true);
                    log('✅ Voice interaction system ready');
                }
                catch (error) {
                    voiceError = error instanceof VoiceError ? error : new VoiceError('initialization_failed', {
                        originalError: error instanceof Error ? error : new Error('Unknown error')
                    });
                    setError(voiceError);
                    (_c = (_b = optionsRef.current).onError) === null || _c === void 0 ? void 0 : _c.call(_b, voiceError);
                    throw voiceError;
                }
                return [2 /*return*/];
            });
        }); };
        initialize().catch(function (error) {
            log("\u274C Auto-initialization failed: ".concat(error.message));
        });
        return function () {
            var _a, _b;
            isCleaningUpRef.current = true;
            (_a = transcriptionManager.current) === null || _a === void 0 ? void 0 : _a.cleanup();
            (_b = agentManager.current) === null || _b === void 0 ? void 0 : _b.cleanup();
            transcriptionManager.current = null;
            agentManager.current = null;
        };
    }, []);
    // Use base hooks
    var _e = useAudioInput({
        debug: optionsRef.current.debug,
        microphoneConfig: optionsRef.current.microphoneConfig,
        onMicrophoneData: function (data) {
            var _a;
            if ((_a = transcriptionManager.current) === null || _a === void 0 ? void 0 : _a.isConnected()) {
                transcriptionManager.current.sendBinary(data);
            }
        },
        onError: function (error) {
            var _a, _b;
            setError(new VoiceError('audio_error', { originalError: error }));
            (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, new VoiceError('audio_error', { originalError: error }));
        }
    }), startAudioInput = _e.startRecording, stopAudioInput = _e.stopRecording, isRecording = _e.isRecording, audioError = _e.error;
    var _f = useWebSocketConnection(transcriptionManager.current, {
        debug: optionsRef.current.debug,
        onError: function (error) {
            var _a, _b;
            setError(new VoiceError('transcription_error', { originalError: error }));
            (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, new VoiceError('transcription_error', { originalError: error }));
        }
    }), connectTranscription = _f.connect, disconnectTranscription = _f.disconnect, transcriptionError = _f.error;
    var _g = useWebSocketConnection(agentManager.current, {
        debug: optionsRef.current.debug,
        onError: function (error) {
            var _a, _b;
            setError(new VoiceError('agent_error', { originalError: error }));
            (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, new VoiceError('agent_error', { originalError: error }));
        }
    }), connectAgent = _g.connect, disconnectAgent = _g.disconnect, sendAgentMessage = _g.sendMessage, agentError = _g.error;
    // Handle errors from base hooks
    useEffect(function () {
        var _a, _b, _c, _d, _e, _f;
        if (audioError) {
            setError(new VoiceError('audio_error', { originalError: audioError }));
            (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, new VoiceError('audio_error', { originalError: audioError }));
        }
        else if (transcriptionError) {
            setError(new VoiceError('transcription_error', { originalError: transcriptionError }));
            (_d = (_c = optionsRef.current).onError) === null || _d === void 0 ? void 0 : _d.call(_c, new VoiceError('transcription_error', { originalError: transcriptionError }));
        }
        else if (agentError) {
            setError(new VoiceError('agent_error', { originalError: agentError }));
            (_f = (_e = optionsRef.current).onError) === null || _f === void 0 ? void 0 : _f.call(_e, new VoiceError('agent_error', { originalError: agentError }));
        }
    }, [audioError, transcriptionError, agentError]);
    // Start interaction
    var start = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var transcription_1, agent_1, connectTranscription_1, connectAgent_1, error_1, voiceError;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    if (!isReady) {
                        throw new VoiceError('invalid_state', {
                            context: 'Voice interaction system is not ready'
                        });
                    }
                    transcription_1 = transcriptionManager.current;
                    agent_1 = agentManager.current;
                    if (!transcription_1 || !agent_1) {
                        throw new VoiceError('invalid_state', {
                            context: 'WebSocket managers not initialized'
                        });
                    }
                    connectTranscription_1 = new Promise(function (resolve, reject) {
                        var removeListener = transcription_1.addEventListener(function (event) {
                            if (event.type === 'state' && event.state === 'connected') {
                                removeListener();
                                resolve();
                            }
                            else if (event.type === 'error') {
                                removeListener();
                                reject(event.error);
                            }
                        });
                        transcription_1.connect();
                    });
                    connectAgent_1 = new Promise(function (resolve, reject) {
                        var removeListener = agent_1.addEventListener(function (event) {
                            if (event.type === 'message' && event.data.type === 'Welcome') {
                                // Send initial agent settings
                                if (optionsRef.current.agentOptions) {
                                    agent_1.sendJSON({
                                        type: 'Settings',
                                        audio: {
                                            input: {
                                                encoding: AUDIO_CONFIG.encoding,
                                                sample_rate: AUDIO_CONFIG.sampleRate,
                                            },
                                            output: {
                                                encoding: AUDIO_CONFIG.encoding,
                                                sample_rate: AUDIO_CONFIG.sampleRate,
                                            },
                                        },
                                        agent: {
                                            language: optionsRef.current.agentOptions.language || 'en',
                                            listen: {
                                                provider: {
                                                    type: 'deepgram',
                                                    model: optionsRef.current.agentOptions.listenModel || MODEL_CONFIG.agent.listen,
                                                },
                                            },
                                            think: __assign({ provider: {
                                                    type: optionsRef.current.agentOptions.thinkProviderType || 'open_ai',
                                                    model: optionsRef.current.agentOptions.thinkModel || MODEL_CONFIG.agent.think,
                                                }, prompt: optionsRef.current.agentOptions.instructions || 'You are a helpful voice assistant.' }, (optionsRef.current.agentOptions.thinkEndpointUrl && optionsRef.current.agentOptions.thinkApiKey
                                                ? {
                                                    endpoint: {
                                                        url: optionsRef.current.agentOptions.thinkEndpointUrl,
                                                        headers: {
                                                            authorization: "bearer ".concat(optionsRef.current.agentOptions.thinkApiKey),
                                                        },
                                                    },
                                                }
                                                : {})),
                                            speak: {
                                                provider: {
                                                    type: 'deepgram',
                                                    model: optionsRef.current.agentOptions.voice || MODEL_CONFIG.agent.speak,
                                                },
                                            },
                                            greeting: optionsRef.current.agentOptions.greeting,
                                        },
                                    });
                                }
                                removeListener();
                                resolve();
                            }
                            else if (event.type === 'error') {
                                removeListener();
                                reject(event.error);
                            }
                        });
                        agent_1.connect();
                    });
                    // Wait for both connections and settings to be applied
                    return [4 /*yield*/, Promise.all([connectTranscription_1, connectAgent_1])];
                case 1:
                    // Wait for both connections and settings to be applied
                    _c.sent();
                    // Start recording
                    return [4 /*yield*/, startAudioInput()];
                case 2:
                    // Start recording
                    _c.sent();
                    log('✅ Voice interaction started');
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _c.sent();
                    voiceError = error_1 instanceof VoiceError ? error_1 : new VoiceError('start_failed', {
                        originalError: error_1 instanceof Error ? error_1 : new Error('Unknown error')
                    });
                    setError(voiceError);
                    (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, voiceError);
                    throw voiceError;
                case 4: return [2 /*return*/];
            }
        });
    }); }, [isReady, log, startAudioInput]);
    // Stop interaction
    var stop = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var voiceError;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            try {
                // Stop recording first
                stopAudioInput();
                // Then disconnect WebSockets
                (_a = transcriptionManager.current) === null || _a === void 0 ? void 0 : _a.disconnect();
                (_b = agentManager.current) === null || _b === void 0 ? void 0 : _b.disconnect();
                log('✅ Voice interaction stopped');
            }
            catch (error) {
                voiceError = error instanceof VoiceError ? error : new VoiceError('stop_failed', {
                    originalError: error instanceof Error ? error : new Error('Unknown error')
                });
                setError(voiceError);
                (_d = (_c = optionsRef.current).onError) === null || _d === void 0 ? void 0 : _d.call(_c, voiceError);
                throw voiceError;
            }
            return [2 /*return*/];
        });
    }); }, [stopAudioInput, log]);
    // Agent control methods
    var updateAgentInstructions = useCallback(function (payload) {
        var _a, _b;
        try {
            if (!agentManager.current) {
                throw new VoiceError('agent_not_initialized');
            }
            sendAgentMessage({
                type: 'UpdateInstructions',
                instructions: payload.instructions,
                context: payload.context
            });
        }
        catch (error) {
            var voiceError = error instanceof VoiceError ? error : new VoiceError('update_failed', {
                originalError: error instanceof Error ? error : new Error('Unknown error')
            });
            setError(voiceError);
            (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, voiceError);
        }
    }, [sendAgentMessage]);
    var interruptAgent = useCallback(function () {
        var _a, _b;
        try {
            if (!agentManager.current) {
                throw new VoiceError('agent_not_initialized');
            }
            sendAgentMessage({ type: 'Interrupt' });
            setAgentState('idle');
        }
        catch (error) {
            var voiceError = error instanceof VoiceError ? error : new VoiceError('interrupt_failed', {
                originalError: error instanceof Error ? error : new Error('Unknown error')
            });
            setError(voiceError);
            (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, voiceError);
        }
    }, [sendAgentMessage]);
    var sleep = useCallback(function () {
        var _a, _b;
        try {
            if (!agentManager.current) {
                throw new VoiceError('agent_not_initialized');
            }
            sendAgentMessage({ type: 'Sleep' });
            setAgentState('sleeping');
        }
        catch (error) {
            var voiceError = error instanceof VoiceError ? error : new VoiceError('sleep_failed', {
                originalError: error instanceof Error ? error : new Error('Unknown error')
            });
            setError(voiceError);
            (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, voiceError);
        }
    }, [sendAgentMessage]);
    var wake = useCallback(function () {
        var _a, _b;
        try {
            if (!agentManager.current) {
                throw new VoiceError('agent_not_initialized');
            }
            if (agentState !== 'sleeping') {
                throw new VoiceError('agent_not_sleeping');
            }
            sendAgentMessage({ type: 'Wake' });
            setAgentState('listening');
        }
        catch (error) {
            var voiceError = error instanceof VoiceError ? error : new VoiceError('wake_failed', {
                originalError: error instanceof Error ? error : new Error('Unknown error')
            });
            setError(voiceError);
            (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, voiceError);
        }
    }, [sendAgentMessage, agentState]);
    var toggleSleep = useCallback(function () {
        if (agentState === 'sleeping') {
            wake();
        }
        else {
            sleep();
        }
    }, [agentState, wake, sleep]);
    var injectAgentMessage = useCallback(function (text) {
        var _a, _b;
        try {
            if (!agentManager.current) {
                throw new VoiceError('agent_not_initialized');
            }
            sendAgentMessage({
                type: 'InjectMessage',
                text: text
            });
        }
        catch (error) {
            var voiceError = error instanceof VoiceError ? error : new VoiceError('inject_failed', {
                originalError: error instanceof Error ? error : new Error('Unknown error')
            });
            setError(voiceError);
            (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, voiceError);
        }
    }, [sendAgentMessage]);
    return {
        initialize: function () { return Promise.resolve(); },
        start: start,
        stop: stop,
        startRecording: startAudioInput,
        stopRecording: stopAudioInput,
        updateAgentInstructions: updateAgentInstructions,
        interruptAgent: interruptAgent,
        sleep: sleep,
        wake: wake,
        toggleSleep: toggleSleep,
        injectAgentMessage: injectAgentMessage,
        getMicrophoneState: function () { var _a; return ((_a = audioInputRef.current) === null || _a === void 0 ? void 0 : _a.getMicrophoneState()) || null; },
        getConnectionState: function () {
            var _a, _b;
            return ({
                transcription: ((_a = transcriptionManager.current) === null || _a === void 0 ? void 0 : _a.isConnected()) || false,
                agent: ((_b = agentManager.current) === null || _b === void 0 ? void 0 : _b.isConnected()) || false
            });
        },
        getAgentState: function () { return agentState; },
        isReady: isReady,
        isRecording: ((_a = audioInputRef.current) === null || _a === void 0 ? void 0 : _a.isRecording()) || false,
        agentState: agentState,
        error: error
    };
}
//# sourceMappingURL=useVoiceInteraction.js.map