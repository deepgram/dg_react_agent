/**
 * Deepgram Component Configuration
 * 
 * This file contains shared configuration settings for Deepgram React components.
 * These settings are used across different components (TTS, Voice Agent) to ensure
 * consistency and make global changes easier to manage.
 */

// Audio Configuration
export const AUDIO_CONFIG = {
  sampleRate: 48000,
  encoding: 'linear16',
  channels: 1,
  bufferSize: 4096,
  outputSampleRate: 48000,
  normalizeVolume: true,
  normalizationFactor: 128
} as const;

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  reconnectDelay: 1000,
  maxReconnectAttempts: 0,
  endpoints: {
    tts: 'wss://api.deepgram.com/v1/speak',
    transcription: 'wss://api.deepgram.com/v1/listen',
    agent: 'wss://agent.deepgram.com/v1/agent/converse'
  }
} as const;

// Model Configuration
export const MODEL_CONFIG = {
  tts: {
    default: 'aura-2-thalia-en'
  },
  transcription: {
    default: 'nova-2',
    language: 'en-US',
    smart_format: true,
    interim_results: true
  },
  agent: {
    listen: 'nova-2',
    think: 'gpt-4o-mini',
    speak: 'aura-2-apollo-en',
    language: 'en',
    thinkProviderType: 'open_ai',
    defaultInstructions: 'You are a helpful voice assistant.'
  }
} as const;

// Microphone Configuration
export const DEFAULT_MICROPHONE_CONFIG = {
  constraints: {
    sampleRate: AUDIO_CONFIG.sampleRate,
    channelCount: AUDIO_CONFIG.channels,
    echoCancellation: true,
    noiseSuppression: false,
    autoGainControl: false,
    latency: 0.01 // 10ms latency for real-time interaction
  },
  bufferSize: AUDIO_CONFIG.bufferSize,
  debug: false
} as const;

// Debug Configuration
export const DEBUG_CONFIG = {
  levels: ['off', 'hook', 'manager', 'verbose'] as const,
  defaultLevel: 'off' as const
} as const;

// Metrics Configuration
export const METRICS_CONFIG = {
  enableByDefault: false,
  chunkSizeLimit: 1024 * 1024 // 1MB
} as const;

// Error Configuration
export const ERROR_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  errorCodes: {
    AUDIO_INIT_ERROR: 'audio_init_error',
    WEBSOCKET_ERROR: 'websocket_error',
    API_ERROR: 'api_error',
    PERMISSION_ERROR: 'permission_error',
    NETWORK_ERROR: 'network_error'
  }
} as const;

// Type Definitions
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
export function mergeConfig<T extends BaseComponentConfig>(defaults: T, userConfig: Partial<T>): T {
  return {
    ...defaults,
    ...userConfig,
    microphoneConfig: userConfig.microphoneConfig
      ? { ...DEFAULT_MICROPHONE_CONFIG, ...userConfig.microphoneConfig }
      : DEFAULT_MICROPHONE_CONFIG,
    endpointOverrides: userConfig.endpointOverrides
      ? { ...WEBSOCKET_CONFIG.endpoints, ...userConfig.endpointOverrides }
      : WEBSOCKET_CONFIG.endpoints
  } as T;
} 