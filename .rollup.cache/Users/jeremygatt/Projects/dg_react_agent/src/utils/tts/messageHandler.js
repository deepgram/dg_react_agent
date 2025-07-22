import { APIError } from '../../types/common/error';
var MessageHandler = /** @class */ (function () {
    function MessageHandler(options) {
        if (options === void 0) { options = {}; }
        this.sequenceId = 0;
        this.handlers = options;
    }
    MessageHandler.prototype.log = function (message) {
        if (this.handlers.debug) {
            console.log("[TTSMessageHandler] ".concat(message));
        }
    };
    MessageHandler.prototype.handleMessage = function (message) {
        var _a, _b, _c, _d, _e, _f;
        if (message instanceof ArrayBuffer) {
            if (message.byteLength === 0) {
                return;
            }
            var audioChunk = {
                data: message,
                timestamp: performance.now(),
                sequenceId: this.sequenceId++
            };
            (_b = (_a = this.handlers).onAudioChunk) === null || _b === void 0 ? void 0 : _b.call(_a, audioChunk);
            return;
        }
        if (message.type === 'Error') {
            var error = new APIError('Deepgram API error', {
                endpoint: 'tts',
                statusCode: 400,
                statusText: message.err_code,
                originalError: new Error(message.err_msg)
            });
            (_d = (_c = this.handlers).onError) === null || _d === void 0 ? void 0 : _d.call(_c, error);
            return;
        }
        if (message.type === 'Complete') {
            (_f = (_e = this.handlers).onComplete) === null || _f === void 0 ? void 0 : _f.call(_e);
            return;
        }
        this.log("Unknown message type: ".concat(message.type));
    };
    MessageHandler.prototype.resetSequence = function () {
        this.sequenceId = 0;
    };
    MessageHandler.prototype.getCurrentSequenceId = function () {
        return this.sequenceId;
    };
    return MessageHandler;
}());
export { MessageHandler };
//# sourceMappingURL=messageHandler.js.map