import { __awaiter, __extends, __generator } from "tslib";
import { BaseAudioManager } from '../shared/BaseAudioManager';
import { createAudioBuffer, playAudioBuffer } from './AudioUtils';
var AudioOutputManager = /** @class */ (function (_super) {
    __extends(AudioOutputManager, _super);
    function AudioOutputManager(options, handlers) {
        if (options === void 0) { options = {}; }
        if (handlers === void 0) { handlers = {}; }
        var _this = _super.call(this, options, handlers) || this;
        _this.startTimeRef = { current: 0 };
        _this.currentSource = null;
        _this.isPlaying = false;
        return _this;
    }
    AudioOutputManager.prototype.handleAudioData = function (data) {
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
                    this.handleError(error, 'handleAudioData');
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    AudioOutputManager.prototype.queueAudio = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.handleAudioData(data)];
            });
        });
    };
    AudioOutputManager.prototype.stop = function () {
        if (this.currentSource) {
            this.currentSource.stop();
            this.currentSource = null;
        }
        this.isPlaying = false;
        this.startTimeRef.current = 0;
    };
    AudioOutputManager.prototype.clearAudioQueue = function () {
        this.stop();
    };
    AudioOutputManager.prototype.getIsPlaying = function () {
        return this.isPlaying;
    };
    AudioOutputManager.prototype.cleanup = function () {
        this.stop();
        _super.prototype.cleanup.call(this);
    };
    return AudioOutputManager;
}(BaseAudioManager));
export { AudioOutputManager };
//# sourceMappingURL=AudioOutputManager.js.map