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
    input: {
        channels: 1,
        bufferSize: 4096,
        constraints: {
            sampleRate: 48000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            latency: 0
        }
    },
    output: {
        channels: 1,
        bufferSize: 4096
    }
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
    transcription: {
        default: 'nova-2',
        alternatives: ['nova', 'enhanced']
    },
    agent: {
        default: 'gpt-4',
        alternatives: ['gpt-3.5-turbo', 'claude-2'],
        listen: 'nova-2',
        think: 'gpt-4',
        speak: 'aura-2-apollo-en',
        language: 'en',
        thinkProviderType: 'open_ai'
    },
    tts: {
        default: 'aura-2-thalia-en',
        alternatives: ['aura-2-apollo-en', 'aura-2-athena-en']
    }
};
// Audio context configuration
export var AUDIO_CONTEXT_CONFIG = {
    sampleRate: AUDIO_CONFIG.sampleRate,
    latencyHint: 'interactive',
    // Additional settings that might be needed in the future
    // preferredSampleRate: 48000,
    // preferredBufferSize: 4096
};
// Microphone configuration
export var MICROPHONE_CONFIG = {
    constraints: AUDIO_CONFIG.input.constraints,
    bufferSize: AUDIO_CONFIG.input.bufferSize,
    // Additional settings that might be needed in the future
    // autoGainControl: true,
    // preferredDevice: null
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
            ? __assign(__assign({}, MICROPHONE_CONFIG), userConfig.microphoneConfig) : MICROPHONE_CONFIG, endpointOverrides: userConfig.endpointOverrides
            ? __assign(__assign({}, WEBSOCKET_CONFIG.endpoints), userConfig.endpointOverrides) : WEBSOCKET_CONFIG.endpoints });
}
//# sourceMappingURL=config.js.map