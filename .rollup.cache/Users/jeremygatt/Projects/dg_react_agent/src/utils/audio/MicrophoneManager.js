import { __assign, __awaiter, __generator } from "tslib";
import { DEFAULT_MICROPHONE_CONFIG } from '../../types/common/microphone';
var MicrophoneManager = /** @class */ (function () {
    function MicrophoneManager(config, handlers) {
        if (config === void 0) { config = {}; }
        if (handlers === void 0) { handlers = {}; }
        this.audioContext = null;
        this.mediaStream = null;
        this.sourceNode = null;
        this.workletNode = null;
        this.config = __assign(__assign({}, DEFAULT_MICROPHONE_CONFIG), config);
        this.handlers = handlers;
        this.state = {
            isInitialized: false,
            isRecording: false,
            hasPermission: false,
            permissionState: null,
            error: null
        };
    }
    MicrophoneManager.prototype.log = function (message, data) {
        if (this.config.debug) {
            console.log("[MicrophoneManager] ".concat(message), data || '');
        }
    };
    MicrophoneManager.prototype.handleError = function (error, context) {
        var _a, _b;
        this.state.error = "".concat(context, ": ").concat(error.message);
        this.log("Error in ".concat(context, ":"), error);
        (_b = (_a = this.handlers).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error);
    };
    MicrophoneManager.prototype.checkPermissions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var permissionStatus_1, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Check if permissions API is available
                        if (!navigator.permissions) {
                            // Fallback: try to access microphone directly
                            this.log('Permissions API not available, attempting direct access');
                            return [2 /*return*/, this.requestPermissionFallback()];
                        }
                        return [4 /*yield*/, navigator.permissions.query({
                                name: 'microphone'
                            })];
                    case 1:
                        permissionStatus_1 = _a.sent();
                        this.state.permissionState = permissionStatus_1.state;
                        this.state.hasPermission = permissionStatus_1.state === 'granted';
                        // Listen for permission changes
                        permissionStatus_1.addEventListener('change', function () {
                            var _a, _b;
                            _this.state.permissionState = permissionStatus_1.state;
                            _this.state.hasPermission = permissionStatus_1.state === 'granted';
                            (_b = (_a = _this.handlers).onPermissionChange) === null || _b === void 0 ? void 0 : _b.call(_a, permissionStatus_1.state);
                        });
                        this.log('Permission status:', permissionStatus_1.state);
                        return [2 /*return*/, {
                                granted: this.state.hasPermission,
                                state: permissionStatus_1.state
                            }];
                    case 2:
                        error_1 = _a.sent();
                        this.log('Permission check failed, falling back to direct access');
                        return [2 /*return*/, this.requestPermissionFallback()];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MicrophoneManager.prototype.requestPermissionFallback = function () {
        return __awaiter(this, void 0, void 0, function () {
            var testStream, error_2, err, permissionState;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, navigator.mediaDevices.getUserMedia({
                                audio: { channelCount: 1 }
                            })];
                    case 1:
                        testStream = _a.sent();
                        // If successful, we have permission
                        testStream.getTracks().forEach(function (track) { return track.stop(); });
                        this.state.hasPermission = true;
                        this.state.permissionState = 'granted';
                        return [2 /*return*/, {
                                granted: true,
                                state: 'granted'
                            }];
                    case 2:
                        error_2 = _a.sent();
                        err = error_2;
                        permissionState = 'prompt';
                        if (err.name === 'NotAllowedError') {
                            permissionState = 'denied';
                        }
                        this.state.hasPermission = false;
                        this.state.permissionState = permissionState;
                        return [2 /*return*/, {
                                granted: false,
                                state: permissionState,
                                error: err.message
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    MicrophoneManager.prototype.initialize = function () {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 4, , 5]);
                        this.log('Initializing microphone manager');
                        // Create audio context with optimal settings (no permission needed for this)
                        this.audioContext = new AudioContext({
                            sampleRate: this.config.constraints.sampleRate,
                            latencyHint: this.config.constraints.latency || 'interactive'
                        });
                        if (!(this.audioContext.state === 'suspended')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.audioContext.resume()];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2: 
                    // Load the audio worklet processor
                    return [4 /*yield*/, this.loadAudioWorklet()];
                    case 3:
                        // Load the audio worklet processor
                        _c.sent();
                        this.state.isInitialized = true;
                        this.state.error = null;
                        this.log('Microphone manager initialized successfully');
                        (_b = (_a = this.handlers).onInitialized) === null || _b === void 0 ? void 0 : _b.call(_a);
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _c.sent();
                        this.handleError(error_3, 'initialize');
                        throw error_3;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    MicrophoneManager.prototype.loadAudioWorklet = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.audioContext) {
                            throw new Error('Audio context not initialized');
                        }
                        // Use inline worklet for better compatibility
                        this.log('Loading inline audio worklet processor');
                        return [4 /*yield*/, this.loadInlineWorklet()];
                    case 1:
                        _a.sent();
                        this.log('Audio worklet loaded successfully');
                        return [2 /*return*/];
                }
            });
        });
    };
    MicrophoneManager.prototype.loadInlineWorklet = function () {
        return __awaiter(this, void 0, void 0, function () {
            var workletCode, blob, workletUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.audioContext) {
                            throw new Error('Audio context not initialized');
                        }
                        workletCode = "\n/**\n * Inline AudioWorkletProcessor for microphone capture and processing\n */\nclass MicrophoneProcessor extends AudioWorkletProcessor {\n  constructor() {\n    super();\n    \n    // State\n    this.isRecording = false;\n    this.sampleRate = 48000; // Target sample rate\n    this.bufferSize = 4096;  // Buffer size in samples\n    this.buffer = new Float32Array(this.bufferSize);\n    this.bufferIndex = 0;\n    \n    // Set up message handler\n    this.port.onmessage = (event) => this.onMessage(event.data);\n  }\n  \n  /**\n   * Handles messages from the main thread\n   */\n  onMessage(message) {\n    if (message.type === 'start') {\n      this.isRecording = true;\n      this.port.postMessage({ type: 'started' });\n    } else if (message.type === 'stop') {\n      this.isRecording = false;\n      this.port.postMessage({ type: 'stopped' });\n    }\n  }\n  \n  /**\n   * Processes audio input and sends it to the main thread\n   */\n  process(inputs, outputs, parameters) {\n    if (!this.isRecording || !inputs[0] || !inputs[0][0]) {\n      return true;\n    }\n    \n    const input = inputs[0][0];\n    \n    // Add input samples to our buffer\n    for (let i = 0; i < input.length; i++) {\n      this.buffer[this.bufferIndex++] = input[i];\n      \n      // When buffer is full, send it to the main thread\n      if (this.bufferIndex >= this.bufferSize) {\n        this.sendBufferToMainThread();\n        this.bufferIndex = 0;\n      }\n    }\n    \n    return true;\n  }\n  \n  /**\n   * Converts the buffer to the required format and sends it to the main thread\n   */\n  sendBufferToMainThread() {\n    // Create a copy of the buffer\n    const audioData = this.buffer.slice(0, this.bufferIndex);\n    \n    // Convert to 16-bit PCM\n    const pcmData = new Int16Array(audioData.length);\n    for (let i = 0; i < audioData.length; i++) {\n      // Convert float [-1.0, 1.0] to 16-bit PCM [-32768, 32767]\n      const s = Math.max(-1, Math.min(1, audioData[i]));\n      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;\n    }\n    \n    // Send the PCM data to the main thread\n    this.port.postMessage({\n      type: 'audio',\n      data: pcmData.buffer\n    }, [pcmData.buffer]);\n  }\n}\n\n// Register the processor\nregisterProcessor('microphone-processor', MicrophoneProcessor);\n";
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
                        // Clean up the blob URL
                        URL.revokeObjectURL(workletUrl);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MicrophoneManager.prototype.startRecording = function () {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var _c, error_4;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!this.state.isInitialized || !this.audioContext) {
                            throw new Error('Microphone manager not initialized');
                        }
                        if (this.state.isRecording) {
                            this.log('Already recording');
                            return [2 /*return*/];
                        }
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        this.log('Starting microphone recording');
                        // Get user media
                        _c = this;
                        return [4 /*yield*/, navigator.mediaDevices.getUserMedia({
                                audio: this.config.constraints
                            })];
                    case 2:
                        // Get user media
                        _c.mediaStream = _d.sent();
                        // Create source node
                        this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
                        // Create worklet node
                        this.workletNode = new AudioWorkletNode(this.audioContext, 'microphone-processor', {
                            numberOfInputs: 1,
                            numberOfOutputs: 0,
                            channelCount: this.config.constraints.channelCount || 1
                        });
                        // Set up worklet message handling
                        this.workletNode.port.onmessage = function (event) {
                            _this.handleWorkletMessage(event.data);
                        };
                        // Connect the audio graph
                        this.sourceNode.connect(this.workletNode);
                        // Start the worklet processor
                        this.workletNode.port.postMessage({ type: 'start' });
                        this.state.isRecording = true;
                        this.state.error = null;
                        this.log('Recording started successfully');
                        (_b = (_a = this.handlers).onRecordingStart) === null || _b === void 0 ? void 0 : _b.call(_a);
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _d.sent();
                        this.handleError(error_4, 'startRecording');
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MicrophoneManager.prototype.stopRecording = function () {
        var _a, _b;
        if (!this.state.isRecording) {
            this.log('Not currently recording');
            return;
        }
        try {
            this.log('Stopping microphone recording');
            // Stop the worklet processor
            if (this.workletNode) {
                this.workletNode.port.postMessage({ type: 'stop' });
                this.workletNode.disconnect();
                this.workletNode = null;
            }
            // Disconnect source node
            if (this.sourceNode) {
                this.sourceNode.disconnect();
                this.sourceNode = null;
            }
            // Stop media stream
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(function (track) { return track.stop(); });
                this.mediaStream = null;
            }
            this.state.isRecording = false;
            this.state.error = null;
            this.log('Recording stopped successfully');
            (_b = (_a = this.handlers).onRecordingStop) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
        catch (error) {
            this.handleError(error, 'stopRecording');
        }
    };
    MicrophoneManager.prototype.handleWorkletMessage = function (message) {
        var _a, _b;
        switch (message.type) {
            case 'started':
                this.log('Worklet processor started');
                break;
            case 'stopped':
                this.log('Worklet processor stopped');
                break;
            case 'audio':
                if (message.data) {
                    (_b = (_a = this.handlers).onAudioData) === null || _b === void 0 ? void 0 : _b.call(_a, message.data);
                }
                break;
            default:
                this.log('Unknown worklet message:', message);
        }
    };
    MicrophoneManager.prototype.getState = function () {
        return __assign({}, this.state);
    };
    MicrophoneManager.prototype.isRecording = function () {
        return this.state.isRecording;
    };
    MicrophoneManager.prototype.isInitialized = function () {
        return this.state.isInitialized;
    };
    MicrophoneManager.prototype.hasPermission = function () {
        return this.state.hasPermission;
    };
    MicrophoneManager.prototype.getAudioContext = function () {
        return this.audioContext;
    };
    MicrophoneManager.prototype.cleanup = function () {
        this.log('Cleaning up microphone manager');
        this.stopRecording();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.state.isInitialized = false;
        this.state.hasPermission = false;
        this.state.permissionState = null;
        this.state.error = null;
    };
    return MicrophoneManager;
}());
export { MicrophoneManager };
//# sourceMappingURL=MicrophoneManager.js.map