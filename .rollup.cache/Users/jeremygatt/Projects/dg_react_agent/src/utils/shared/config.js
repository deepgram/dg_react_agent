/**
 * Deepgram TTS Configuration
 *
 * This file contains shared configuration settings for the Deepgram TTS component.
 */
import { __assign } from "tslib";
// Audio Configuration
export var AUDIO_CONFIG = {
    sampleRate: 48000,
    encoding: 'linear16',
    output: {
        channels: 1,
        bufferSize: 4096
    }
};
// WebSocket Configuration
export var WEBSOCKET_CONFIG = {
    maxReconnectAttempts: 3,
    reconnectDelay: 1000,
    keepAliveInterval: 30000 // ms
};
// Debug Configuration
export var DEBUG_CONFIG = {
    defaultLevel: 'off',
    levels: ['off', 'hook', 'manager', 'verbose']
};
// Metrics Configuration
export var METRICS_CONFIG = {
    enableByDefault: false,
    chunkSizeLimit: 1000,
    flushInterval: 1000 // ms
};
// Model Configuration
export var MODEL_CONFIG = {
    tts: {
        default: 'aura-2-thalia-en',
        alternatives: ['aura-2-apollo-en', 'aura-2-athena-en']
    }
};
// Configuration merging utility
export function mergeConfig(defaults, overrides) {
    return __assign(__assign({}, defaults), overrides);
}
//# sourceMappingURL=config.js.map