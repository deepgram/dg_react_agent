import { __assign, __extends } from "tslib";
import { BaseWebSocketManager } from '../shared/BaseWebSocketManager';
var VoiceWebSocketManager = /** @class */ (function (_super) {
    __extends(VoiceWebSocketManager, _super);
    function VoiceWebSocketManager(options, handlers) {
        if (handlers === void 0) { handlers = {}; }
        var _this = _super.call(this, __assign(__assign({}, options), { url: VoiceWebSocketManager.BASE_URLS[options.type] }), handlers) || this;
        _this.voiceOptions = options;
        return _this;
    }
    VoiceWebSocketManager.prototype.buildWebSocketURL = function () {
        var url = new URL(VoiceWebSocketManager.BASE_URLS[this.voiceOptions.type]);
        if (this.voiceOptions.type === 'transcription') {
            if (this.voiceOptions.model) {
                url.searchParams.append('model', this.voiceOptions.model);
            }
            if (this.voiceOptions.encoding) {
                url.searchParams.append('encoding', this.voiceOptions.encoding);
            }
            if (this.voiceOptions.sampleRate) {
                url.searchParams.append('sample_rate', this.voiceOptions.sampleRate.toString());
            }
        }
        return url.toString();
    };
    VoiceWebSocketManager.prototype.sendJSON = function (message) {
        this.sendMessage(message);
    };
    VoiceWebSocketManager.prototype.sendCloseStream = function () {
        if (this.voiceOptions.type === 'transcription') {
            this.sendMessage({ type: 'CloseStream' });
        }
    };
    VoiceWebSocketManager.prototype.sendAgentSettings = function (settings) {
        if (this.voiceOptions.type === 'agent') {
            this.sendMessage(settings);
        }
    };
    VoiceWebSocketManager.BASE_URLS = {
        transcription: 'wss://api.deepgram.com/v1/listen',
        agent: 'wss://agent.deepgram.com/v1/agent/converse'
    };
    return VoiceWebSocketManager;
}(BaseWebSocketManager));
export { VoiceWebSocketManager };
//# sourceMappingURL=VoiceWebSocketManager.js.map