/**
 * Deepgram TTS Configuration
 * 
 * This file contains shared configuration settings for the Deepgram TTS component.
 */

// Audio Configuration
export const AUDIO_CONFIG = {
  sampleRate: 16000,
  encoding: 'linear16',
  output: {
    channels: 1,
    bufferSize: 4096
  }
} as const;

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
  maxReconnectAttempts: 3,
  reconnectDelay: 1000, // ms
  keepAliveInterval: 30000 // ms
} as const;

// Debug Configuration
export const DEBUG_CONFIG = {
  defaultLevel: 'off' as const,
  levels: ['off', 'hook', 'manager', 'verbose'] as const
} as const;

// Metrics Configuration
export const METRICS_CONFIG = {
  enableByDefault: false,
  chunkSizeLimit: 1000,
  flushInterval: 1000 // ms
} as const;

// Model Configuration
export const MODEL_CONFIG = {
  tts: {
    default: 'aura-2-thalia-en',
    alternatives: ['aura-2-apollo-en', 'aura-2-athena-en']
  }
} as const;

// Base component configuration interface
export interface BaseComponentConfig {
  debug?: boolean | 'hook' | 'manager' | 'verbose';
  enableMetrics?: boolean;
}

// Configuration merging utility
export function mergeConfig<T extends object>(defaults: T, overrides: Partial<T>): T {
  return {
    ...defaults,
    ...overrides
  };
} 