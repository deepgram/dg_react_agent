/**
 * Deepgram Voice Interaction
 *
 * A React component library for integrating with Deepgram's voice agent and transcription services
 */

// Voice Interaction Components
export { DeepgramVoiceInteraction, DeepgramWrapper, DeepgramErrorBoundary } from './components/DeepgramVoiceInteraction';

// TTS functionality
export { useDeepgramTTS } from './components/DeepgramTTS';

// Voice Types
export type {
  AgentOptions,
  AgentState,
  DeepgramVoiceInteractionHandle,
  DeepgramVoiceInteractionProps,
  LLMResponse,
  ServiceType,
  TranscriptResponse,
  UpdateInstructionsPayload
} from './types/voice';

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
export { AudioManager } from './utils/audio/AudioManager';
export { WebSocketManager } from './utils/websocket/WebSocketManager';
