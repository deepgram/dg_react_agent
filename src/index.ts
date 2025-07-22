/**
 * Deepgram Voice Interaction
 *
 * A React component library for integrating with Deepgram's voice agent and transcription services
 */

// TTS functionality
export { useDeepgramTTS } from './components/DeepgramTTS';

// Voice Interaction functionality
export { useDeepgramVoiceInteraction, DeepgramWrapper, DeepgramErrorBoundary } from './components/DeepgramVoiceInteraction';

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
  TTSError,
  TTSMetrics,
  DeepgramTTSMessage,
  DeepgramTTSResponse
} from './types/tts';

// Common Types
export type {
  ConnectionState,
  WebSocketManagerOptions,
  WebSocketEventHandlers
} from './types/common/connection';

export type {
  AudioError,
  ConnectionError,
  DeepgramError
} from './types/common/error';

export type {
  MicrophoneConfig,
  MicrophoneState,
  MicrophoneEventHandlers
} from './types/common/microphone';

// Utils
export { AudioManager } from './utils/audio/AudioManager';
export { WebSocketManager } from './utils/websocket/WebSocketManager';
