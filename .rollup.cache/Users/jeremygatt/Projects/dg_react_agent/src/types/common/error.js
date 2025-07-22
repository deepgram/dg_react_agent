import { __extends } from "tslib";
var AudioError = /** @class */ (function (_super) {
    __extends(AudioError, _super);
    function AudioError(message, details) {
        var _this = _super.call(this, message) || this;
        _this.name = 'AudioError';
        _this.type = 'audio';
        _this.code = 'AUDIO_ERROR';
        _this.details = details;
        return _this;
    }
    return AudioError;
}(Error));
export { AudioError };
var ConnectionError = /** @class */ (function (_super) {
    __extends(ConnectionError, _super);
    function ConnectionError(message, details) {
        var _this = _super.call(this, message) || this;
        _this.name = 'ConnectionError';
        _this.type = 'connection';
        _this.code = 'CONNECTION_ERROR';
        _this.details = details;
        return _this;
    }
    return ConnectionError;
}(Error));
export { ConnectionError };
var APIError = /** @class */ (function (_super) {
    __extends(APIError, _super);
    function APIError(message, details) {
        var _this = _super.call(this, message) || this;
        _this.name = 'APIError';
        _this.type = 'api';
        _this.code = 'API_ERROR';
        _this.details = details;
        return _this;
    }
    return APIError;
}(Error));
export { APIError };
//# sourceMappingURL=error.js.map