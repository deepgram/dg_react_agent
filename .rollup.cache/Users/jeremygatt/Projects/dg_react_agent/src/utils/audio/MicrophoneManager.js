import { __assign, __awaiter, __generator } from "tslib";
import { MICROPHONE_CONFIG, AUDIO_CONTEXT_CONFIG } from '../shared/config';
import { AudioError } from '../../types/common/error';
/**
 * Manages microphone access, recording, and audio processing.
 * This class is responsible for:
 * 1. Microphone permissions and access
 * 2. Audio context and worklet setup
 * 3. Recording state management
 * 4. Audio data processing and streaming
 */
var MicrophoneManager = /** @class */ (function () {
    function MicrophoneManager(config, handlers) {
        if (config === void 0) { config = MICROPHONE_CONFIG; }
        if (handlers === void 0) { handlers = {}; }
        this.config = config;
        this.handlers = handlers;
        this.audioContext = null;
        this.mediaStream = null;
        this.sourceNode = null;
        this.workletNode = null;
        this.state = {
            isInitialized: false,
            isRecording: false,
            hasPermission: false,
            permissionState: null,
            error: null
        };
    }
    /**
     * Checks and requests microphone permissions
     */
    MicrophoneManager.prototype.checkPermissions = function () {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var permissionStatus_1, stream, error_1, audioError;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 4, , 5]);
                        if (!navigator.permissions) return [3 /*break*/, 2];
                        return [4 /*yield*/, navigator.permissions.query({
                                name: 'microphone'
                            })];
                    case 1:
                        permissionStatus_1 = _c.sent();
                        this.state.permissionState = permissionStatus_1.state;
                        this.state.hasPermission = permissionStatus_1.state === 'granted';
                        // Listen for permission changes
                        permissionStatus_1.addEventListener('change', function () {
                            var _a, _b;
                            _this.state.permissionState = permissionStatus_1.state;
                            _this.state.hasPermission = permissionStatus_1.state === 'granted';
                            (_b = (_a = _this.handlers).onPermissionChange) === null || _b === void 0 ? void 0 : _b.call(_a, permissionStatus_1.state);
                        });
                        return [2 /*return*/, {
                                granted: this.state.hasPermission,
                                state: permissionStatus_1.state
                            }];
                    case 2: return [4 /*yield*/, navigator.mediaDevices.getUserMedia({
                            audio: this.config.constraints
                        })];
                    case 3:
                        stream = _c.sent();
                        stream.getTracks().forEach(function (track) { return track.stop(); }); // Clean up test stream
                        this.state.hasPermission = true;
                        this.state.permissionState = 'granted';
                        return [2 /*return*/, {
                                granted: true,
                                state: 'granted'
                            }];
                    case 4:
                        error_1 = _c.sent();
                        this.state.hasPermission = false;
                        this.state.permissionState = 'denied';
                        audioError = new AudioError('Microphone permission denied', {
                            originalError: error_1 instanceof Error ? error_1 : new Error('Unknown error')
                        });
                        (_b = (_a = this.handlers).onError) === null || _b === void 0 ? void 0 : _b.call(_a, audioError);
                        throw audioError;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Initializes the audio context and worklet
     */
    MicrophoneManager.prototype.initialize = function () {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function () {
            var error_2, audioError;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 4, , 5]);
                        if (this.state.isInitialized) {
                            throw new AudioError('Microphone already initialized');
                        }
                        // Create audio context
                        this.audioContext = new AudioContext(AUDIO_CONTEXT_CONFIG);
                        if (!(this.audioContext.state === 'suspended')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.audioContext.resume()];
                    case 1:
                        _e.sent();
                        _e.label = 2;
                    case 2: 
                    // Load worklet
                    return [4 /*yield*/, this.loadWorklet()];
                    case 3:
                        // Load worklet
                        _e.sent();
                        this.state.isInitialized = true;
                        this.state.error = null;
                        (_b = (_a = this.handlers).onInitialized) === null || _b === void 0 ? void 0 : _b.call(_a);
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _e.sent();
                        audioError = error_2 instanceof AudioError ? error_2 : new AudioError('Failed to initialize microphone', {
                            originalError: error_2 instanceof Error ? error_2 : new Error('Unknown error')
                        });
                        (_d = (_c = this.handlers).onError) === null || _d === void 0 ? void 0 : _d.call(_c, audioError);
                        throw audioError;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Starts recording from the microphone
     */
    MicrophoneManager.prototype.startRecording = function () {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function () {
            var _e, error_3, audioError;
            var _this = this;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 2, , 3]);
                        if (!this.state.isInitialized || !this.audioContext) {
                            throw new AudioError('Microphone not initialized');
                        }
                        if (this.state.isRecording) {
                            return [2 /*return*/]; // Already recording
                        }
                        // Get microphone access
                        _e = this;
                        return [4 /*yield*/, navigator.mediaDevices.getUserMedia({
                                audio: this.config.constraints
                            })];
                    case 1:
                        // Get microphone access
                        _e.mediaStream = _f.sent();
                        // Create and connect nodes
                        this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
                        this.workletNode = new AudioWorkletNode(this.audioContext, 'microphone-processor', {
                            numberOfInputs: 1,
                            numberOfOutputs: 0,
                            channelCount: this.config.constraints.channelCount
                        });
                        // Handle worklet messages
                        this.workletNode.port.onmessage = function (event) {
                            var _a, _b;
                            var message = event.data;
                            if (message.type === 'audio' && message.data) {
                                (_b = (_a = _this.handlers).onAudioData) === null || _b === void 0 ? void 0 : _b.call(_a, message.data);
                            }
                        };
                        // Connect nodes
                        this.sourceNode.connect(this.workletNode);
                        // Start processing
                        this.workletNode.port.postMessage({ type: 'start' });
                        this.state.isRecording = true;
                        (_b = (_a = this.handlers).onRecordingStart) === null || _b === void 0 ? void 0 : _b.call(_a);
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _f.sent();
                        audioError = error_3 instanceof AudioError ? error_3 : new AudioError('Failed to start recording', {
                            originalError: error_3 instanceof Error ? error_3 : new Error('Unknown error')
                        });
                        (_d = (_c = this.handlers).onError) === null || _d === void 0 ? void 0 : _d.call(_c, audioError);
                        throw audioError;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Stops recording
     */
    MicrophoneManager.prototype.stopRecording = function () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        try {
            if (!this.state.isRecording) {
                return; // Not recording
            }
            // Stop worklet
            (_a = this.workletNode) === null || _a === void 0 ? void 0 : _a.port.postMessage({ type: 'stop' });
            // Disconnect nodes
            (_b = this.sourceNode) === null || _b === void 0 ? void 0 : _b.disconnect();
            (_c = this.workletNode) === null || _c === void 0 ? void 0 : _c.disconnect();
            // Stop media stream
            (_d = this.mediaStream) === null || _d === void 0 ? void 0 : _d.getTracks().forEach(function (track) { return track.stop(); });
            // Clear references
            this.sourceNode = null;
            this.workletNode = null;
            this.mediaStream = null;
            this.state.isRecording = false;
            (_f = (_e = this.handlers).onRecordingStop) === null || _f === void 0 ? void 0 : _f.call(_e);
        }
        catch (error) {
            var audioError = error instanceof AudioError ? error : new AudioError('Failed to stop recording', {
                originalError: error instanceof Error ? error : new Error('Unknown error')
            });
            (_h = (_g = this.handlers).onError) === null || _h === void 0 ? void 0 : _h.call(_g, audioError);
            throw audioError;
        }
    };
    /**
     * Cleans up all resources
     */
    MicrophoneManager.prototype.cleanup = function () {
        this.stopRecording();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.state = {
            isInitialized: false,
            isRecording: false,
            hasPermission: false,
            permissionState: null,
            error: null
        };
    };
    // State accessors
    MicrophoneManager.prototype.isRecording = function () {
        return this.state.isRecording;
    };
    MicrophoneManager.prototype.isInitialized = function () {
        return this.state.isInitialized;
    };
    MicrophoneManager.prototype.hasPermission = function () {
        return this.state.hasPermission;
    };
    MicrophoneManager.prototype.getState = function () {
        return __assign({}, this.state);
    };
    MicrophoneManager.prototype.loadWorklet = function () {
        return __awaiter(this, void 0, void 0, function () {
            var workletCode, blob, workletUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.audioContext) {
                            throw new AudioError('Audio context not initialized');
                        }
                        workletCode = "\n      class MicrophoneProcessor extends AudioWorkletProcessor {\n        constructor() {\n          super();\n          \n          this.isRecording = false;\n          this.sampleRate = ".concat(this.audioContext.sampleRate, "; // Use actual audio context sample rate\n          this.bufferSize = ").concat(this.config.bufferSize, ";\n          this.buffer = new Float32Array(this.bufferSize);\n          this.bufferIndex = 0;\n          \n          this.port.onmessage = (event) => {\n            if (event.data.type === 'start') {\n              this.isRecording = true;\n            } else if (event.data.type === 'stop') {\n              this.isRecording = false;\n            }\n          };\n        }\n        \n        process(inputs) {\n          if (!this.isRecording || !inputs[0] || !inputs[0][0]) {\n            return true;\n          }\n          \n          const input = inputs[0][0];\n          \n          for (let i = 0; i < input.length; i++) {\n            this.buffer[this.bufferIndex++] = input[i];\n            \n            if (this.bufferIndex >= this.bufferSize) {\n              this.sendBuffer();\n              this.bufferIndex = 0;\n            }\n          }\n          \n          return true;\n        }\n        \n        sendBuffer() {\n          const audioData = this.buffer.slice(0, this.bufferIndex);\n          const pcmData = new Int16Array(audioData.length);\n          \n          for (let i = 0; i < audioData.length; i++) {\n            const s = Math.max(-1, Math.min(1, audioData[i]));\n            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;\n          }\n          \n          this.port.postMessage({\n            type: 'audio',\n            data: pcmData.buffer\n          }, [pcmData.buffer]);\n        }\n      }\n      \n      registerProcessor('microphone-processor', MicrophoneProcessor);\n    ");
                        blob = new Blob([workletCode], { type: 'application/javascript' });
                        workletUrl = URL.createObjectURL(blob);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 3, 4]);
                        return [4 /*yield*/, this.audioContext.audioWorklet.addModule(workletUrl)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        URL.revokeObjectURL(workletUrl);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return MicrophoneManager;
}());
export { MicrophoneManager };
//# sourceMappingURL=MicrophoneManager.js.map