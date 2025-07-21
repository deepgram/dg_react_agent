import { __assign, __extends } from "tslib";
import { WebSocketManager } from './WebSocketManager';
var TTSWebSocketManager = /** @class */ (function (_super) {
    __extends(TTSWebSocketManager, _super);
    function TTSWebSocketManager(options, handlers) {
        if (handlers === void 0) { handlers = {}; }
        return _super.call(this, __assign(__assign({}, options), { url: 'wss://api.deepgram.com/v1/speak' }), handlers) || this;
    }
    TTSWebSocketManager.prototype.buildWebSocketURL = function () {
        var options = this.options;
        var baseURL = 'wss://api.deepgram.com/v1/speak';
        var params = new URLSearchParams({
            model: options.model || 'aura-2-thalia-en',
            encoding: options.encoding || 'linear16',
            sample_rate: String(options.sampleRate || 48000),
            container: 'none'
        });
        return "".concat(baseURL, "?").concat(params.toString());
    };
    TTSWebSocketManager.prototype.sendJSON = function (message) {
        this.sendMessage(message);
    };
    return TTSWebSocketManager;
}(WebSocketManager));
export { TTSWebSocketManager };
//# sourceMappingURL=TTSWebSocketManager.js.map