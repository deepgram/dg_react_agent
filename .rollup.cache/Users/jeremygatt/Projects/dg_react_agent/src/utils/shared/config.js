/**
 * Deepgram Component Configuration
 *
 * This file contains shared configuration settings for Deepgram React components.
 * These settings are used across different components (TTS, Voice Agent) to ensure
 * consistency and make global changes easier to manage.
 */
import { __assign } from "tslib";
// Audio Configuration
export var AUDIO_CONFIG = {
    sampleRate: 48000,
    encoding: 'linear16',
    channels: 1,
    bufferSize: 4096
};
// WebSocket Configuration
export var WEBSOCKET_CONFIG = {
    reconnectDelay: 1000,
    maxReconnectAttempts: 0,
    endpoints: {
        tts: 'wss://api.deepgram.com/v1/speak',
        transcription: 'wss://api.deepgram.com/v1/listen',
        agent: 'wss://agent.deepgram.com/v1/agent/converse'
    }
};
// Model Configuration
export var MODEL_CONFIG = {
    tts: {
        default: 'aura-2-thalia-en'
    },
    transcription: {
        default: 'nova-2'
    },
    agent: {
        listen: 'nova-2',
        think: 'gpt-4o-mini',
        speak: 'aura-2-thalia-en'
    }
};
// Microphone Configuration
export var DEFAULT_MICROPHONE_CONFIG = {
    constraints: {
        sampleRate: AUDIO_CONFIG.sampleRate,
        channelCount: AUDIO_CONFIG.channels,
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: false,
        latency: 0.01
    },
    bufferSize: AUDIO_CONFIG.bufferSize,
    debug: false
};
// Debug Configuration
export var DEBUG_CONFIG = {
    levels: ['off', 'hook', 'manager', 'verbose'],
    defaultLevel: 'off'
};
// Metrics Configuration
export var METRICS_CONFIG = {
    enableByDefault: false,
    chunkSizeLimit: 1024 * 1024 // 1MB
};
// Error Configuration
export var ERROR_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000,
    errorCodes: {
        AUDIO_INIT_ERROR: 'audio_init_error',
        WEBSOCKET_ERROR: 'websocket_error',
        API_ERROR: 'api_error',
        PERMISSION_ERROR: 'permission_error',
        NETWORK_ERROR: 'network_error'
    }
};
/**
 * Helper function to merge default config with user-provided options
 */
export function mergeConfig(defaults, userConfig) {
    return __assign(__assign(__assign({}, defaults), userConfig), { microphoneConfig: userConfig.microphoneConfig
            ? __assign(__assign({}, DEFAULT_MICROPHONE_CONFIG), userConfig.microphoneConfig) : DEFAULT_MICROPHONE_CONFIG, endpointOverrides: userConfig.endpointOverrides
            ? __assign(__assign({}, WEBSOCKET_CONFIG.endpoints), userConfig.endpointOverrides) : WEBSOCKET_CONFIG.endpoints });
}
//# sourceMappingURL=config.js.map