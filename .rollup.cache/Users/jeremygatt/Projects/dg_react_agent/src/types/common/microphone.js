export var DEFAULT_MICROPHONE_CONFIG = {
    constraints: {
        sampleRate: 48000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: false,
        latency: 0.01 // 10ms latency
    },
    bufferSize: 4096,
    debug: false
};
//# sourceMappingURL=microphone.js.map