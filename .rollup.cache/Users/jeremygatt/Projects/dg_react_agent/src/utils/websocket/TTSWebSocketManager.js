import { __assign, __extends } from "tslib";
import { BaseWebSocketManager } from '../shared/BaseWebSocketManager';
var TTSWebSocketManager = /** @class */ (function (_super) {
    __extends(TTSWebSocketManager, _super);
    function TTSWebSocketManager(options, handlers) {
        if (handlers === void 0) { handlers = {}; }
        var _this = _super.call(this, __assign(__assign({}, options), { url: TTSWebSocketManager.BASE_URL }), handlers) || this;
        _this.ttsOptions = options;
        return _this;
    }
    TTSWebSocketManager.prototype.buildWebSocketURL = function () {
        var url = new URL(TTSWebSocketManager.BASE_URL);
        url.searchParams.append('model', this.ttsOptions.model);
        url.searchParams.append('encoding', this.ttsOptions.encoding);
        url.searchParams.append('sample_rate', this.ttsOptions.sampleRate.toString());
        url.searchParams.append('container', 'none');
        return url.toString();
    };
    TTSWebSocketManager.BASE_URL = 'wss://api.deepgram.com/v1/speak';
    return TTSWebSocketManager;
}(BaseWebSocketManager));
export { TTSWebSocketManager };
//# sourceMappingURL=TTSWebSocketManager.js.map