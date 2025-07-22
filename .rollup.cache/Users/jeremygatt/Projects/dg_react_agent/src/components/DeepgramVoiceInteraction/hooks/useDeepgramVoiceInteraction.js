import { __awaiter, __generator } from "tslib";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioInput } from '../../../hooks/useAudio/useAudioInput';
import { useWebSocketConnection } from '../../../hooks/useWebSocket/useWebSocketConnection';
import { VoiceWebSocketManager } from '../../../utils/websocket/VoiceWebSocketManager';
import { VoiceError } from '../../../types/voice/error';
import { AUDIO_CONFIG, MODEL_CONFIG } from '../../../utils/shared/config';
/**
 * Hook for Deepgram voice interaction functionality.
 * Composes base hooks for audio and WebSocket management.
 */
export function useDeepgramVoiceInteraction(options) {
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
            console.log("[useDeepgramVoiceInteraction] ".concat(message));
        }
    }, []);
    // Create WebSocket managers
    var transcriptionManager = useRef(null);
    var agentManager = useRef(null);
    // Initialize managers
    useEffect(function () {
        var _a;
        if (!optionsRef.current.apiKey || isCleaningUpRef.current)
            return;
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
    var _d = useAudioInput({
        debug: optionsRef.current.debug,
        microphoneConfig: optionsRef.current.microphoneConfig || {
            constraints: {
                sampleRate: AUDIO_CONFIG.sampleRate,
                channelCount: AUDIO_CONFIG.input.channels,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                latency: 0
            },
            bufferSize: AUDIO_CONFIG.input.bufferSize
        },
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
    }), startRecording = _d.startRecording, stopRecording = _d.stopRecording, isRecording = _d.isRecording, audioError = _d.error;
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
    // Start interaction
    var start = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1, voiceError;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    // Connect WebSocket managers
                    connectTranscription();
                    connectAgent();
                    // Start recording
                    return [4 /*yield*/, startRecording()];
                case 1:
                    // Start recording
                    _c.sent();
                    log('✅ Voice interaction started');
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _c.sent();
                    voiceError = error_1 instanceof VoiceError ? error_1 : new VoiceError('start_failed', {
                        originalError: error_1 instanceof Error ? error_1 : new Error('Unknown error')
                    });
                    setError(voiceError);
                    (_b = (_a = optionsRef.current).onError) === null || _b === void 0 ? void 0 : _b.call(_a, voiceError);
                    throw voiceError;
                case 3: return [2 /*return*/];
            }
        });
    }); }, [connectTranscription, connectAgent, startRecording]);
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
                log('✅ Voice interaction stopped');
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
    }); }, [stopRecording, disconnectTranscription, disconnectAgent]);
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
//# sourceMappingURL=useDeepgramVoiceInteraction.js.map