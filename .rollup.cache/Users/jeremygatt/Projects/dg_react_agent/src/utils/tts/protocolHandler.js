var ProtocolHandler = /** @class */ (function () {
    function ProtocolHandler(options) {
        if (options === void 0) { options = {}; }
        this.options = options;
    }
    ProtocolHandler.prototype.createSpeakMessage = function (text) {
        if (this.options.debug) {
            console.log('[ProtocolHandler] Creating speak message for text:', text);
        }
        return {
            type: 'Speak',
            text: text
        };
    };
    ProtocolHandler.prototype.createFlushMessage = function () {
        return {
            type: 'Flush'
        };
    };
    ProtocolHandler.prototype.createClearMessage = function () {
        return {
            type: 'Clear'
        };
    };
    ProtocolHandler.prototype.createCloseMessage = function () {
        return {
            type: 'Close'
        };
    };
    ProtocolHandler.prototype.chunkBySentence = function (text, maxChunkSize) {
        if (maxChunkSize === void 0) { maxChunkSize = 1000; }
        // Split text into sentences using common sentence delimiters
        var sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        var chunks = [];
        var currentChunk = '';
        for (var _i = 0, sentences_1 = sentences; _i < sentences_1.length; _i++) {
            var sentence = sentences_1[_i];
            // If adding this sentence would exceed maxChunkSize, start a new chunk
            if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }
            currentChunk += sentence;
        }
        // Add the last chunk if there's anything left
        if (currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
        }
        return chunks;
    };
    ProtocolHandler.prototype.wrapInSSML = function (text) {
        return "<speak>".concat(text, "</speak>");
    };
    return ProtocolHandler;
}());
export { ProtocolHandler };
//# sourceMappingURL=protocolHandler.js.map