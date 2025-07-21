var MessageHandler = /** @class */ (function () {
    function MessageHandler(options, handlers) {
        if (options === void 0) { options = {}; }
        if (handlers === void 0) { handlers = {}; }
        this.options = options;
        this.handlers = handlers;
        this.sequenceId = 0;
    }
    MessageHandler.prototype.handleMessage = function (data) {
        if (data instanceof ArrayBuffer) {
            this.handleBinaryData(data);
        }
        else {
            this.handleJSONResponse(data);
        }
    };
    MessageHandler.prototype.handleBinaryData = function (data) {
        var _a, _b;
        if (data.byteLength === 0) {
            return;
        }
        var audioChunk = {
            data: data,
            timestamp: performance.now(),
            sequenceId: this.sequenceId++
        };
        (_b = (_a = this.handlers).onAudioData) === null || _b === void 0 ? void 0 : _b.call(_a, audioChunk);
    };
    MessageHandler.prototype.handleJSONResponse = function (response) {
        var _a, _b, _c, _d, _e, _f;
        switch (response.type) {
            case 'Metadata':
                (_b = (_a = this.handlers).onMetadata) === null || _b === void 0 ? void 0 : _b.call(_a, response);
                break;
            case 'Flushed':
                (_d = (_c = this.handlers).onFlushed) === null || _d === void 0 ? void 0 : _d.call(_c);
                break;
            case 'Cleared':
                (_f = (_e = this.handlers).onCleared) === null || _f === void 0 ? void 0 : _f.call(_e);
                break;
            case 'Error':
                if ('err_code' in response && 'err_msg' in response) {
                    this.handleError({
                        type: 'Error',
                        err_code: response.err_code,
                        err_msg: response.err_msg,
                        description: response.description
                    });
                }
                break;
        }
    };
    MessageHandler.prototype.handleError = function (response) {
        var _a, _b;
        var error = {
            name: 'DeepgramAPIError',
            message: response.err_msg,
            type: 'api',
            code: response.err_code,
            details: {
                originalResponse: response,
                description: response.description
            }
        };
        if (this.options.debug) {
            console.error('DeepgramTTS: API Error:', error);
        }
        (_b = (_a = this.handlers).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error);
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