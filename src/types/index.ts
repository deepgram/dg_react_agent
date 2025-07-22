// Re-export all types
export * from './voice';
export * from './tts';
export * from './common/audio';
export * from './common/connection';
export * from './common/microphone';

// Re-export error types except VoiceError (already exported from ./voice)
export type { AudioError, ConnectionError, APIError, DeepgramError } from './common/error'; 