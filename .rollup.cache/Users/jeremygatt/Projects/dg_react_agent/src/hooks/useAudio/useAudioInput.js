import { __assign, __awaiter, __generator } from "tslib";
import { useCallback, useEffect, useRef, useState } from 'react';
import { MicrophoneManager } from '../../utils/audio/MicrophoneManager';
import { AudioError } from '../../types/common/error';
import { MICROPHONE_CONFIG } from '../../utils/shared/config';
/**
 * Hook for managing microphone input.
 * Handles initialization, recording, and cleanup of microphone resources.
 */
export function useAudioInput(options) {
    var _this = this;
    var _a;
    if (options === void 0) { options = {}; }
    // State
    var _b = useState(false), isInitialized = _b[0], setIsInitialized = _b[1];
    var _c = useState(null), error = _c[0], setError = _c[1];
    var isCleaningUpRef = useRef(false);
    // Manager ref
    var microphoneRef = useRef(null);
    // Logging utility
    var log = useCallback(function (message) {
        if (options.debug) {
            console.log("[useAudioInput] ".concat(message));
        }
    }, [options.debug]);
    // Initialize microphone
    var initialize = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1, audioError;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (isInitialized || isCleaningUpRef.current) {
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    // Create microphone manager with merged config
                    microphoneRef.current = new MicrophoneManager(__assign(__assign({}, MICROPHONE_CONFIG), options.microphoneConfig), {
                        onAudioData: options.onMicrophoneData,
                        onRecordingStart: function () {
                            var _a;
                            log('🎤 Microphone recording started');
                            (_a = options.onMicrophoneStart) === null || _a === void 0 ? void 0 : _a.call(options);
                        },
                        onRecordingStop: function () {
                            var _a;
                            log('🎤 Microphone recording stopped');
                            (_a = options.onMicrophoneStop) === null || _a === void 0 ? void 0 : _a.call(options);
                        },
                        onError: function (error) {
                            var _a;
                            var audioError = error instanceof AudioError ? error : new AudioError('Microphone error', {
                                originalError: error
                            });
                            setError(audioError);
                            (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, audioError);
                        }
                    });
                    // Initialize manager
                    return [4 /*yield*/, microphoneRef.current.initialize()];
                case 2:
                    // Initialize manager
                    _b.sent();
                    setIsInitialized(true);
                    log('✅ Microphone initialized');
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _b.sent();
                    audioError = error_1 instanceof AudioError ? error_1 : new AudioError('Failed to initialize microphone', {
                        originalError: error_1 instanceof Error ? error_1 : new Error('Unknown error')
                    });
                    setError(audioError);
                    (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, audioError);
                    throw audioError;
                case 4: return [2 /*return*/];
            }
        });
    }); }, [options.debug, options.microphoneConfig, options.onMicrophoneData, options.onMicrophoneStart, options.onMicrophoneStop, options.onError, log, isInitialized]);
    // Auto-initialize if enabled
    useEffect(function () {
        if (options.autoInitialize) {
            initialize().catch(function () { }); // Errors are already handled in initialize
        }
        return function () {
            isCleaningUpRef.current = true;
            if (microphoneRef.current) {
                microphoneRef.current.cleanup();
                microphoneRef.current = null;
            }
            setIsInitialized(false);
            setError(null);
        };
    }, [options.autoInitialize, initialize]);
    // Start recording
    var startRecording = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var error_2, audioError;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    if (!!isInitialized) return [3 /*break*/, 2];
                    return [4 /*yield*/, initialize()];
                case 1:
                    _b.sent();
                    _b.label = 2;
                case 2:
                    if (!microphoneRef.current) {
                        throw new AudioError('Microphone not initialized');
                    }
                    return [4 /*yield*/, microphoneRef.current.startRecording()];
                case 3:
                    _b.sent();
                    log('✅ Recording started');
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _b.sent();
                    audioError = error_2 instanceof AudioError ? error_2 : new AudioError('Failed to start recording', {
                        originalError: error_2 instanceof Error ? error_2 : new Error('Unknown error')
                    });
                    setError(audioError);
                    (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, audioError);
                    throw audioError;
                case 5: return [2 /*return*/];
            }
        });
    }); }, [initialize, isInitialized, options.onError, log]);
    // Stop recording
    var stopRecording = useCallback(function () {
        var _a, _b;
        try {
            (_a = microphoneRef.current) === null || _a === void 0 ? void 0 : _a.stopRecording();
            log('✅ Recording stopped');
        }
        catch (error) {
            var audioError = error instanceof AudioError ? error : new AudioError('Failed to stop recording', {
                originalError: error instanceof Error ? error : new Error('Unknown error')
            });
            setError(audioError);
            (_b = options.onError) === null || _b === void 0 ? void 0 : _b.call(options, audioError);
        }
    }, [options.onError, log]);
    return {
        initialize: initialize,
        startRecording: startRecording,
        stopRecording: stopRecording,
        isRecording: ((_a = microphoneRef.current) === null || _a === void 0 ? void 0 : _a.isRecording()) || false,
        isInitialized: isInitialized,
        error: error
    };
}
//# sourceMappingURL=useAudioInput.js.map