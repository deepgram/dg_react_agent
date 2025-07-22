/**
 * Deepgram Text-to-Speech
 *
 * A React hook for integrating with Deepgram's text-to-speech service
 */
export { useDeepgramTTS } from './components/DeepgramTTS';
export type { DeepgramTTSOptions, TTSMetrics, TTSError, DeepgramTTSMessage, DeepgramTTSResponse } from './types/tts';
export type { ConnectionState } from './types/common/connection';
export type { AudioChunk } from './types/common/audio';
export type { DeepgramError } from './types/common/error';
export { AudioOutputManager } from './utils/audio/AudioOutputManager';
export { TTSWebSocketManager } from './utils/websocket/TTSWebSocketManager';
