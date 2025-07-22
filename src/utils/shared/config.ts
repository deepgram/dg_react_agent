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
    thinkProviderType: 'open_ai' as const
  },
  tts: {
    default: 'aura-2-thalia-en',
    alternatives: ['aura-2-apollo-en', 'aura-2-athena-en']
  }
} as const;

// Audio context configuration
export const AUDIO_CONTEXT_CONFIG = {
  sampleRate: AUDIO_CONFIG.sampleRate,
  latencyHint: 'interactive' as const,
  // Additional settings that might be needed in the future
  // preferredSampleRate: 48000,
  // preferredBufferSize: 4096
} as const;

// Microphone configuration
export const MICROPHONE_CONFIG = {
  constraints: AUDIO_CONFIG.input.constraints,
  bufferSize: AUDIO_CONFIG.input.bufferSize,
  // Additional settings that might be needed in the future
  // autoGainControl: true,
  // preferredDevice: null
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
  microphoneConfig?: Partial<typeof MICROPHONE_CONFIG>;
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
      ? { ...MICROPHONE_CONFIG, ...userConfig.microphoneConfig }
      : MICROPHONE_CONFIG,
    endpointOverrides: userConfig.endpointOverrides
      ? { ...WEBSOCKET_CONFIG.endpoints, ...userConfig.endpointOverrides }
      : WEBSOCKET_CONFIG.endpoints
  } as T;
} 