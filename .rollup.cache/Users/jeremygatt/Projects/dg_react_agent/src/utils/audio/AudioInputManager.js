import { __assign, __awaiter, __extends, __generator } from "tslib";
import { BaseAudioManager } from '../shared/BaseAudioManager';
import { MicrophoneManager } from './MicrophoneManager';
var AudioInputManager = /** @class */ (function (_super) {
    __extends(AudioInputManager, _super);
    function AudioInputManager(options, handlers) {
        if (options === void 0) { options = {}; }
        if (handlers === void 0) { handlers = {}; }
        var _this = _super.call(this, options, handlers) || this;
        _this._isRecording = false;
        _this.microphoneManager = null;
        return _this;
    }
    AudioInputManager.prototype.initializeMicrophone = function () {
        return __awaiter(this, void 0, void 0, function () {
            var microphoneHandlers, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        microphoneHandlers = {
                            onAudioData: function (data) {
                                var _a, _b;
                                (_b = (_a = _this.handlers).onMicrophoneData) === null || _b === void 0 ? void 0 : _b.call(_a, data);
                            },
                            onRecordingStart: function () {
                                var _a, _b;
                                _this._isRecording = true;
                                (_b = (_a = _this.handlers).onMicrophoneStart) === null || _b === void 0 ? void 0 : _b.call(_a);
                            },
                            onRecordingStop: function () {
                                var _a, _b;
                                _this._isRecording = false;
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
    AudioInputManager.prototype.handleAudioData = function (_data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // For input manager, we don't handle incoming audio data
                throw new Error('AudioInputManager does not handle incoming audio data');
            });
        });
    };
    AudioInputManager.prototype.startRecording = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2, error_3;
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
                        this.handleError(error_2, 'startRecording - microphone initialization');
                        throw error_2;
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
                        error_3 = _a.sent();
                        this.handleError(error_3, 'startRecording');
                        throw error_3;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    AudioInputManager.prototype.stopRecording = function () {
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
    AudioInputManager.prototype.checkMicrophonePermissions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
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
                        error_4 = _a.sent();
                        this.handleError(error_4, 'checkMicrophonePermissions - microphone initialization');
                        throw error_4;
                    case 4:
                        if (!this.microphoneManager) {
                            throw new Error('Microphone not configured. Provide microphoneConfig in AudioManagerOptions.');
                        }
                        return [2 /*return*/, this.microphoneManager.checkPermissions()];
                }
            });
        });
    };
    AudioInputManager.prototype.getMicrophoneState = function () {
        var _a;
        return ((_a = this.microphoneManager) === null || _a === void 0 ? void 0 : _a.getState()) || null;
    };
    AudioInputManager.prototype.hasMicrophone = function () {
        return this.microphoneManager !== null;
    };
    /**
     * Check if currently recording
     */
    AudioInputManager.prototype.isRecording = function () {
        return this._isRecording;
    };
    AudioInputManager.prototype.cleanup = function () {
        if (this.microphoneManager) {
            this.microphoneManager.cleanup();
            this.microphoneManager = null;
        }
        _super.prototype.cleanup.call(this);
    };
    return AudioInputManager;
}(BaseAudioManager));
export { AudioInputManager };
//# sourceMappingURL=AudioInputManager.js.map