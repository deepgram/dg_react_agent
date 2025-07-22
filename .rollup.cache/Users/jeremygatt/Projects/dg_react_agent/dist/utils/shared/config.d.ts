/**
 * Deepgram Component Configuration
 *
 * This file contains shared configuration settings for Deepgram React components.
 * These settings are used across different components (TTS, Voice Agent) to ensure
 * consistency and make global changes easier to manage.
 */
export declare const AUDIO_CONFIG: {
    readonly sampleRate: 48000;
    readonly encoding: "linear16";
    readonly channels: 1;
    readonly bufferSize: 4096;
};
export declare const WEBSOCKET_CONFIG: {
    readonly reconnectDelay: 1000;
    readonly maxReconnectAttempts: 0;
    readonly endpoints: {
        readonly tts: "wss://api.deepgram.com/v1/speak";
        readonly transcription: "wss://api.deepgram.com/v1/listen";
        readonly agent: "wss://agent.deepgram.com/v1/agent/converse";
    };
};
export declare const MODEL_CONFIG: {
    readonly tts: {
        readonly default: "aura-2-thalia-en";
    };
    readonly transcription: {
        readonly default: "nova-2";
    };
    readonly agent: {
        readonly listen: "nova-2";
        readonly think: "gpt-4o-mini";
        readonly speak: "aura-2-thalia-en";
    };
};
export declare const DEFAULT_MICROPHONE_CONFIG: {
    readonly constraints: {
        readonly sampleRate: 48000;
        readonly channelCount: 1;
        readonly echoCancellation: true;
        readonly noiseSuppression: false;
        readonly autoGainControl: false;
        readonly latency: 0.01;
    };
    readonly bufferSize: 4096;
    readonly debug: false;
};
export declare const DEBUG_CONFIG: {
    readonly levels: readonly ["off", "hook", "manager", "verbose"];
    readonly defaultLevel: "off";
};
export declare const METRICS_CONFIG: {
    readonly enableByDefault: false;
    readonly chunkSizeLimit: number;
};
export declare const ERROR_CONFIG: {
    readonly maxRetries: 3;
    readonly retryDelay: 1000;
    readonly errorCodes: {
        readonly AUDIO_INIT_ERROR: "audio_init_error";
        readonly WEBSOCKET_ERROR: "websocket_error";
        readonly API_ERROR: "api_error";
        readonly PERMISSION_ERROR: "permission_error";
        readonly NETWORK_ERROR: "network_error";
    };
};
export type DebugLevel = typeof DEBUG_CONFIG.levels[number];
export type ModelType = keyof typeof MODEL_CONFIG;
export type ErrorCode = keyof typeof ERROR_CONFIG.errorCodes;
/**
 * Base configuration interface that can be extended by specific components
 */
export interface BaseComponentConfig {
    debug?: boolean | DebugLevel;
    enableMetrics?: boolean;
    microphoneConfig?: Partial<typeof DEFAULT_MICROPHONE_CONFIG>;
    endpointOverrides?: Partial<typeof WEBSOCKET_CONFIG.endpoints>;
}
/**
 * Helper function to merge default config with user-provided options
 */
export declare function mergeConfig<T extends BaseComponentConfig>(defaults: T, userConfig: Partial<T>): T;
