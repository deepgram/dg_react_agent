/**
 * Deepgram Voice Interaction
 *
 * A React component library for integrating with Deepgram's voice agent and transcription services
 */
export { DeepgramVoiceInteraction, DeepgramWrapper, DeepgramErrorBoundary } from './components/DeepgramVoiceInteraction';
export { useDeepgramTTS } from './components/DeepgramTTS';
export type { AgentOptions, AgentState, DeepgramVoiceInteractionHandle, DeepgramVoiceInteractionProps, LLMResponse, ServiceType, TranscriptResponse, UpdateInstructionsPayload } from './types/voice';
export type { DeepgramTTSOptions, TTSMetrics, TTSError, DeepgramTTSMessage, DeepgramTTSResponse } from './types/tts';
export type { ConnectionState } from './types/common/connection';
export type { AudioChunk } from './types/common/audio';
export type { DeepgramError } from './types/common/error';
export { AudioManager } from './utils/audio/AudioManager';
export { WebSocketManager } from './utils/websocket/WebSocketManager';
