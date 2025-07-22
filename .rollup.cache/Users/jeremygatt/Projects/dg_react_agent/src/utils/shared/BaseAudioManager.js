import { __awaiter, __generator } from "tslib";
import { createOptimizedAudioContext, validateWebAudioSupport } from '../audio/AudioUtils';
var BaseAudioManager = /** @class */ (function () {
    function BaseAudioManager(options, handlers) {
        if (options === void 0) { options = {}; }
        if (handlers === void 0) { handlers = {}; }
        this.options = options;
        this.handlers = handlers;
        this.audioContext = null;
        this.gainNode = null;
        this.analyzer = null;
        this.debug = options.debug || false;
    }
    BaseAudioManager.prototype.log = function (message, data) {
        if (this.debug) {
            console.log("[AudioManager] ".concat(message), data || '');
        }
    };
    BaseAudioManager.prototype.initialize = function () {
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
    BaseAudioManager.prototype.handleError = function (error, context) {
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
    BaseAudioManager.prototype.cleanup = function () {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.gainNode = null;
        this.analyzer = null;
    };
    BaseAudioManager.prototype.dispose = function () {
        this.cleanup();
    };
    return BaseAudioManager;
}());
export { BaseAudioManager };
//# sourceMappingURL=BaseAudioManager.js.map