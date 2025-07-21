import { __assign, __awaiter, __generator } from "tslib";
import { createOptimizedAudioContext, createAudioBuffer, playAudioBuffer, validateWebAudioSupport } from './AudioUtils';
import { MicrophoneManager } from './MicrophoneManager';
var AudioManager = /** @class */ (function () {
    function AudioManager(options, handlers) {
        if (options === void 0) { options = {}; }
        if (handlers === void 0) { handlers = {}; }
        this.options = options;
        this.handlers = handlers;
        this.audioContext = null;
        this.gainNode = null;
        this.analyzer = null;
        this.startTimeRef = { current: 0 };
        this.currentSource = null;
        this.isPlaying = false;
        this.isRecording = false;
        this.microphoneManager = null;
        this.debug = options.debug || false;
    }
    AudioManager.prototype.log = function (message, data) {
        if (this.debug) {
            console.log("[AudioManager] ".concat(message), data || '');
        }
    };
    AudioManager.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var support;
            return __generator(this, function (_a) {
                try {
                    support = validateWebAudioSupport();
                    if (!support.supported) {
                        throw new Error("Web Audio API not supported: ".concat(support.missingFeatures.join(', ')));
                    }
                    // Create audio context
                    this.audioContext = createOptimizedAudioContext();
                    // Create gain node if volume control is enabled
                    if (this.options.enableVolumeControl && this.audioContext) {
                        this.gainNode = this.audioContext.createGain();
                        this.gainNode.gain.value = this.options.initialVolume || 1.0;
                        this.gainNode.connect(this.audioContext.destination);
                    }
                    // Create analyzer node
                    if (this.audioContext) {
                        this.analyzer = this.audioContext.createAnalyser();
                        this.analyzer.fftSize = 2048;
                    }
                    // Note: Microphone initialization is deferred until user interaction
                    // due to browser security requirements
                    this.log('Audio manager initialized');
                }
                catch (error) {
                    this.handleError(error, 'initialize');
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    AudioManager.prototype.initializeMicrophone = function () {
        return __awaiter(this, void 0, void 0, function () {
            var microphoneHandlers, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        microphoneHandlers = {
                            onAudioData: function (data) { var _a, _b; return (_b = (_a = _this.handlers).onMicrophoneData) === null || _b === void 0 ? void 0 : _b.call(_a, data); },
                            onRecordingStart: function () {
                                var _a, _b;
                                _this.isRecording = true;
                                (_b = (_a = _this.handlers).onMicrophoneStart) === null || _b === void 0 ? void 0 : _b.call(_a);
                            },
                            onRecordingStop: function () {
                                var _a, _b;
                                _this.isRecording = false;
                                (_b = (_a = _this.handlers).onMicrophoneStop) === null || _b === void 0 ? void 0 : _b.call(_a);
                            },
                            onError: function (error) { return _this.handleError(error, 'microphone'); }
                        };
                        this.microphoneManager = new MicrophoneManager(__assign(__assign({}, this.options.microphoneConfig), { debug: this.debug }), microphoneHandlers);
                        return [4 /*yield*/, this.microphoneManager.initialize()];
                    case 1:
                        _a.sent();
                        this.log('Microphone manager initialized');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        this.handleError(error_1, 'initializeMicrophone');
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AudioManager.prototype.handleError = function (error, context) {
        var _a, _b, _c;
        var audioError = {
            name: 'AudioError',
            message: "".concat(context, ": ").concat(error.message),
            type: 'audio',
            code: 'AUDIO_ERROR',
            details: {
                context: context,
                originalError: error,
                audioContextState: (_a = this.audioContext) === null || _a === void 0 ? void 0 : _a.state
            }
        };
        if (this.debug) {
            console.error('Audio Error:', audioError);
        }
        (_c = (_b = this.handlers).onError) === null || _c === void 0 ? void 0 : _c.call(_b, audioError);
    };
    AudioManager.prototype.queueAudio = function (data) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var buffer, source;
            var _this = this;
            return __generator(this, function (_c) {
                if (!this.audioContext) {
                    throw new Error('Audio context not initialized');
                }
                try {
                    buffer = createAudioBuffer(this.audioContext, data);
                    if (!buffer) {
                        return [2 /*return*/];
                    }
                    source = playAudioBuffer(this.audioContext, buffer, this.startTimeRef, this.analyzer || undefined);
                    this.currentSource = source;
                    this.isPlaying = true;
                    source.onended = function () {
                        var _a, _b;
                        _this.isPlaying = false;
                        _this.currentSource = null;
                        (_b = (_a = _this.handlers).onAudioEnd) === null || _b === void 0 ? void 0 : _b.call(_a);
                    };
                    (_b = (_a = this.handlers).onAudioStart) === null || _b === void 0 ? void 0 : _b.call(_a);
                }
                catch (error) {
                    this.handleError(error, 'queueAudio');
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    AudioManager.prototype.stop = function () {
        if (this.currentSource) {
            this.currentSource.stop();
            this.currentSource = null;
        }
        this.isPlaying = false;
        this.startTimeRef.current = 0;
    };
    AudioManager.prototype.cleanup = function () {
        this.stop();
        // Cleanup microphone manager
        if (this.microphoneManager) {
            this.microphoneManager.cleanup();
            this.microphoneManager = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.gainNode = null;
        this.analyzer = null;
    };
    AudioManager.prototype.getIsPlaying = function () {
        return this.isPlaying;
    };
    AudioManager.prototype.getIsRecording = function () {
        return this.isRecording;
    };
    AudioManager.prototype.addEventListener = function (_listener) {
        // TODO: Implement event listener functionality
        return function () { };
    };
    AudioManager.prototype.clearAudioQueue = function () {
        this.stop();
    };
    AudioManager.prototype.dispose = function () {
        this.cleanup();
    };
    AudioManager.prototype.getMicrophoneState = function () {
        var _a;
        return ((_a = this.microphoneManager) === null || _a === void 0 ? void 0 : _a.getState()) || null;
    };
    AudioManager.prototype.hasMicrophone = function () {
        return this.microphoneManager !== null;
    };
    AudioManager.prototype.checkMicrophonePermissions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!this.microphoneManager && this.options.microphoneConfig)) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.initializeMicrophone()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        this.handleError(error_2, 'checkMicrophonePermissions - microphone initialization');
                        throw error_2;
                    case 4:
                        if (!this.microphoneManager) {
                            throw new Error('Microphone not configured. Provide microphoneConfig in AudioManagerOptions.');
                        }
                        return [2 /*return*/, this.microphoneManager.checkPermissions()];
                }
            });
        });
    };
    AudioManager.prototype.startRecording = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_3, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!this.microphoneManager && this.options.microphoneConfig)) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.initializeMicrophone()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        this.handleError(error_3, 'startRecording - microphone initialization');
                        throw error_3;
                    case 4:
                        if (!this.microphoneManager) {
                            throw new Error('Microphone not configured. Provide microphoneConfig in AudioManagerOptions.');
                        }
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.microphoneManager.startRecording()];
                    case 6:
                        _a.sent();
                        this.log('Recording started');
                        return [3 /*break*/, 8];
                    case 7:
                        error_4 = _a.sent();
                        this.handleError(error_4, 'startRecording');
                        throw error_4;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    AudioManager.prototype.stopRecording = function () {
        if (!this.microphoneManager) {
            this.log('Microphone not initialized');
            return;
        }
        try {
            this.microphoneManager.stopRecording();
            this.log('Recording stopped');
        }
        catch (error) {
            this.handleError(error, 'stopRecording');
        }
    };
    return AudioManager;
}());
export { AudioManager };
//# sourceMappingURL=AudioManager.js.map