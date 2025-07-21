var MetricsCollector = /** @class */ (function () {
    function MetricsCollector(options) {
        if (options === void 0) { options = {}; }
        this.options = options;
        this.startTime = null;
        this.firstByteTime = null;
        this.firstAudioTime = null;
        this.totalBytes = 0;
        this.chunkCount = 0;
    }
    MetricsCollector.prototype.start = function () {
        this.startTime = performance.now();
        this.firstByteTime = null;
        this.firstAudioTime = null;
        this.totalBytes = 0;
        this.chunkCount = 0;
        if (this.options.debug) {
            console.log('[MetricsCollector] Started collecting metrics');
        }
    };
    MetricsCollector.prototype.markFirstByte = function () {
        if (this.startTime && !this.firstByteTime) {
            this.firstByteTime = performance.now();
        }
    };
    MetricsCollector.prototype.markFirstAudio = function () {
        if (this.startTime && !this.firstAudioTime) {
            this.firstAudioTime = performance.now();
        }
    };
    MetricsCollector.prototype.addChunk = function (bytes) {
        this.totalBytes += bytes;
        this.chunkCount++;
    };
    MetricsCollector.prototype.getMetrics = function () {
        var now = performance.now();
        var startTime = this.startTime || now;
        return {
            totalDuration: now - startTime,
            firstByteLatency: this.firstByteTime ? this.firstByteTime - startTime : 0,
            firstAudioLatency: this.firstAudioTime ? this.firstAudioTime - startTime : 0,
            totalBytes: this.totalBytes,
            averageChunkSize: this.chunkCount > 0 ? this.totalBytes / this.chunkCount : 0,
            chunkCount: this.chunkCount
        };
    };
    MetricsCollector.prototype.reset = function () {
        this.startTime = null;
        this.firstByteTime = null;
        this.firstAudioTime = null;
        this.totalBytes = 0;
        this.chunkCount = 0;
    };
    return MetricsCollector;
}());
export { MetricsCollector };
//# sourceMappingURL=metricsCollector.js.map