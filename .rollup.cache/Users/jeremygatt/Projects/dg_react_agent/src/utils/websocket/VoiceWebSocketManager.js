import { __extends } from "tslib";
import { WebSocketManager } from './WebSocketManager';
var VoiceWebSocketManager = /** @class */ (function (_super) {
    __extends(VoiceWebSocketManager, _super);
    function VoiceWebSocketManager(options, handlers) {
        if (handlers === void 0) { handlers = {}; }
        return _super.call(this, options, handlers) || this;
    }
    VoiceWebSocketManager.prototype.buildWebSocketURL = function () {
        var options = this.options;
        var baseURL = options.url;
        if (!options.queryParams) {
            return baseURL;
        }
        var params = new URLSearchParams();
        for (var _i = 0, _a = Object.entries(options.queryParams); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            params.append(key, String(value));
        }
        return "".concat(baseURL, "?").concat(params.toString());
    };
    VoiceWebSocketManager.prototype.sendCloseStream = function () {
        if (this.isConnected()) {
            this.sendMessage({ type: 'CloseStream' });
        }
    };
    VoiceWebSocketManager.prototype.close = function () {
        this.disconnect();
    };
    VoiceWebSocketManager.prototype.sendJSON = function (message) {
        this.sendMessage(message);
    };
    return VoiceWebSocketManager;
}(WebSocketManager));
export { VoiceWebSocketManager };
//# sourceMappingURL=VoiceWebSocketManager.js.map