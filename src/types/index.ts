// Re-export TTS types
export * from './tts';
export * from './common/audio';
export * from './common/connection';
export { 
  BaseError, 
  ConnectionError, 
  AudioError, 
  APIError, 
  DeepgramError,
  type ConnectionErrorDetails,
  type AudioErrorDetails,
  type APIErrorDetails
} from './common/error'; 