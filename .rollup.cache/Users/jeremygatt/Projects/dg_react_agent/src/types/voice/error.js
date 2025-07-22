import { __extends } from "tslib";
var VoiceError = /** @class */ (function (_super) {
    __extends(VoiceError, _super);
    function VoiceError(code, details) {
        var _this = _super.call(this, VoiceError.getMessageForCode(code)) || this;
        _this.name = 'VoiceError';
        _this.type = 'voice';
        _this.code = code;
        _this.details = details;
        return _this;
    }
    VoiceError.getMessageForCode = function (code) {
        switch (code) {
            case 'initialization_failed':
                return 'Failed to initialize voice interaction';
            case 'invalid_configuration':
                return 'Invalid voice interaction configuration';
            case 'invalid_state':
                return 'Invalid voice interaction state';
            case 'already_initialized':
                return 'Voice interaction already initialized';
            case 'connection_failed':
                return 'Failed to establish connection';
            case 'microphone_error':
                return 'Microphone error occurred';
            case 'audio_error':
                return 'Audio error occurred';
            case 'websocket_error':
                return 'WebSocket error occurred';
            case 'transcription_error':
                return 'Transcription error occurred';
            case 'agent_error':
                return 'Agent error occurred';
            case 'stop_failed':
                return 'Failed to stop voice interaction';
            default:
                return 'Unknown voice interaction error';
        }
    };
    return VoiceError;
}(Error));
export { VoiceError };
//# sourceMappingURL=error.js.map