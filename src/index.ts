/**
 * Deepgram Text-to-Speech
 *
 * A React hook for integrating with Deepgram's text-to-speech service
 */

// TTS functionality
export { useDeepgramTTS } from './components/DeepgramTTS';

// TTS Types
export type {
  DeepgramTTSOptions,
  TTSMetrics,
  TTSError,
  DeepgramTTSMessage,
  DeepgramTTSResponse
} from './types/tts';

// Common Types
export type { ConnectionState } from './types/common/connection';
export type { AudioChunk } from './types/common/audio';
export type { DeepgramError } from './types/common/error';

// Utils
export { AudioOutputManager } from './utils/audio/AudioOutputManager';
export { TTSWebSocketManager } from './utils/websocket/TTSWebSocketManager';
