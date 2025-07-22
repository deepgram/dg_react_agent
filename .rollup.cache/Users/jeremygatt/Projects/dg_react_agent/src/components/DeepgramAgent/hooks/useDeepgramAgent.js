import { __awaiter, __generator } from "tslib";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioInput } from '../../../hooks/useAudio/useAudioInput';
import { useWebSocketConnection } from '../../../hooks/useWebSocket/useWebSocketConnection';
import { VoiceWebSocketManager } from '../../../utils/websocket/VoiceWebSocketManager';
import { VoiceError } from '../../../types/voice/error';
import { AUDIO_CONFIG } from '../../../utils/shared/config';
/**
 * Hook for Deepgram agent functionality.
 * Composes base hooks for audio and WebSocket management.
 */
export function useDeepgramAgent(options) {
    var _this = this;
    // State
    var _a = useState(false), isReady = _a[0], setIsReady = _a[1];
    var _b = useState(null), error = _b[0], setError = _b[1];
    var _c = useState('idle'), agentState = _c[0], setAgentState = _c[1];
    var isCleaningUpRef = useRef(false);
    var optionsRef = useRef(options);
    // Update options ref when they change
    useEffect(function () {
        optionsRef.current = options;
    }, [options]);
    // Logging utility
    var log = useCallback(function (message) {
        if (optionsRef.current.debug) {
            console.log("[useDeepgramAgent] ".concat(message));
        }
    }, []);
    // Create WebSocket managers
    var transcriptionManager = useRef(null);
    var agentManager = useRef(null);
    // Initialize managers
    var createManagers = useCallback(function () {
        var _a;
        if (!optionsRef.current.apiKey || isCleaningUpRef.current)
            return;
        // Only create managers if they don't exist
        if (!transcriptionManager.current) {
            transcriptionManager.current = new VoiceWebSocketManager({
                type: 'transcription',
                apiKey: optionsRef.current.apiKey,
                model: ((_a = optionsRef.current.transcriptionOptions) === null || _a === void 0 ? void 0 : _a.model) || 'nova-2',
                encoding: AUDIO_CONFIG.encoding,
                sampleRate: AUDIO_CONFIG.sampleRate,
                debug: optionsRef.current.debug
            });
        }
        if (!agentManager.current) {
            agentManager.current = new VoiceWebSocketManager({
                type: 'agent',
                apiKey: optionsRef.current.apiKey,
                debug: optionsRef.current.debug
            });
        }
    }, []);
    // Cleanup function
    var cleanup = useCallback(function () {
        if (isCleaningUpRef.current) {
            if (transcriptionManager.current) {
                transcriptionManager.current.cleanup();
                transcriptionManager.current = null;
            }
            if (agentManager.current) {
                agentManager.current.cleanup();
                agentManager.current = null;
            }
            setIsReady(false);
        }
    }, []);
    // Cleanup on unmount
    useEffect(function () {
        return function () {
            isCleaningUpRef.current = true;
            cleanup();
        };
    }, [cleanup]);
    // Use base hooks
    var _d = useAudioInput({
        debug: optionsRef.current.debug,
        microphoneConfig: optionsRef.current.microphoneConfig,
        autoInitialize: false,
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
    }), initializeMicrophone = _d.initialize, startRecording = _d.startRecording, stopRecording = _d.stopRecording, isRecording = _d.isRecording, audioError = _d.error;
    var _e = useWebSocketConnection(transcriptionManager.current, {
        debug: optionsRef.current.debug,
        onError: function (error) {
            var _a, _b;
            setError(new VoiceError('transcription_error', { originalError: error }));
            (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, new VoiceError('transcription_error', { originalError: error }));
        }
    }), connectTranscription = _e.connect, disconnectTranscription = _e.disconnect, transcriptionError = _e.error;
    var _f = useWebSocketConnection(agentManager.current, {
        debug: optionsRef.current.debug,
        onError: function (error) {
            var _a, _b;
            setError(new VoiceError('agent_error', { originalError: error }));
            (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, new VoiceError('agent_error', { originalError: error }));
        }
    }), connectAgent = _f.connect, disconnectAgent = _f.disconnect, sendAgentMessage = _f.sendMessage, agentError = _f.error;
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
    // Initialize function that sets up everything
    var initialize = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1, voiceError;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    if (!optionsRef.current.apiKey) {
                        throw new VoiceError('invalid_configuration', {
                            originalError: new Error('API key is required')
                        });
                    }
                    // Create WebSocket managers
                    createManagers();
                    // Initialize microphone
                    return [4 /*yield*/, initializeMicrophone()];
                case 1:
                    // Initialize microphone
                    _c.sent();
                    setIsReady(true);
                    log('✅ Agent system ready');
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _c.sent();
                    voiceError = error_1 instanceof VoiceError ? error_1 : new VoiceError('initialization_failed', {
                        originalError: error_1 instanceof Error ? error_1 : new Error('Unknown error')
                    });
                    setError(voiceError);
                    (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, voiceError);
                    throw voiceError;
                case 3: return [2 /*return*/];
            }
        });
    }); }, [createManagers, initializeMicrophone, log]);
    // Auto-initialize if enabled
    useEffect(function () {
        if (optionsRef.current.autoInitialize && !isCleaningUpRef.current) {
            initialize().catch(function () { }); // Errors are already handled in initialize
        }
    }, [initialize]);
    // Start interaction
    var start = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var error_2, voiceError;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 4, , 5]);
                    if (!!isReady) return [3 /*break*/, 2];
                    return [4 /*yield*/, initialize()];
                case 1:
                    _c.sent();
                    _c.label = 2;
                case 2:
                    // Connect WebSocket managers
                    connectTranscription();
                    connectAgent();
                    // Start recording
                    return [4 /*yield*/, startRecording()];
                case 3:
                    // Start recording
                    _c.sent();
                    log('✅ Agent started');
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _c.sent();
                    voiceError = error_2 instanceof VoiceError ? error_2 : new VoiceError('start_failed', {
                        originalError: error_2 instanceof Error ? error_2 : new Error('Unknown error')
                    });
                    setError(voiceError);
                    (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, voiceError);
                    throw voiceError;
                case 5: return [2 /*return*/];
            }
        });
    }); }, [initialize, isReady, connectTranscription, connectAgent, startRecording, log]);
    // Stop interaction
    var stop = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var voiceError;
        var _a, _b;
        return __generator(this, function (_c) {
            try {
                // Stop recording first
                stopRecording();
                // Then disconnect WebSockets
                disconnectTranscription();
                disconnectAgent();
                log('✅ Agent stopped');
            }
            catch (error) {
                voiceError = error instanceof VoiceError ? error : new VoiceError('stop_failed', {
                    originalError: error instanceof Error ? error : new Error('Unknown error')
                });
                setError(voiceError);
                (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, voiceError);
                throw voiceError;
            }
            return [2 /*return*/];
        });
    }); }, [stopRecording, disconnectTranscription, disconnectAgent, log]);
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
        initialize: initialize,
        start: start,
        stop: stop,
        updateAgentInstructions: updateAgentInstructions,
        interruptAgent: interruptAgent,
        sleep: sleep,
        wake: wake,
        toggleSleep: toggleSleep,
        injectAgentMessage: injectAgentMessage,
        isReady: isReady,
        isRecording: isRecording,
        agentState: agentState,
        error: error
    };
}
//# sourceMappingURL=useDeepgramAgent.js.map