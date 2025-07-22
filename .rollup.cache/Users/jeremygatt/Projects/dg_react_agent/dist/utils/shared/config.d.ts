/**
 * Deepgram TTS Configuration
 *
 * This file contains shared configuration settings for the Deepgram TTS component.
 */
export declare const AUDIO_CONFIG: {
    readonly sampleRate: 48000;
    readonly encoding: "linear16";
    readonly output: {
        readonly channels: 1;
        readonly bufferSize: 4096;
    };
};
export declare const WEBSOCKET_CONFIG: {
    readonly maxReconnectAttempts: 3;
    readonly reconnectDelay: 1000;
    readonly keepAliveInterval: 30000;
};
export declare const DEBUG_CONFIG: {
    readonly defaultLevel: "off";
    readonly levels: readonly ["off", "hook", "manager", "verbose"];
};
export declare const METRICS_CONFIG: {
    readonly enableByDefault: false;
    readonly chunkSizeLimit: 1000;
    readonly flushInterval: 1000;
};
export declare const MODEL_CONFIG: {
    readonly tts: {
        readonly default: "aura-2-thalia-en";
        readonly alternatives: readonly ["aura-2-apollo-en", "aura-2-athena-en"];
    };
};
export interface BaseComponentConfig {
    debug?: boolean | 'hook' | 'manager' | 'verbose';
    enableMetrics?: boolean;
}
export declare function mergeConfig<T extends object>(defaults: T, overrides: Partial<T>): T;
