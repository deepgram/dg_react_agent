/**
 * Deepgram React Components
 *
 * A React component library for integrating with Deepgram's voice agent and transcription services
 */
export * from './types/voice';
export * from './types/tts';
export * from './types/common/audio';
export * from './types/common/connection';
export * from './types/common/microphone';
export type { AudioError, ConnectionError, APIError, DeepgramError } from './types/common/error';
export { useDeepgramTTS } from './components/DeepgramTTS';
export { useDeepgramAgent } from './components/DeepgramAgent/hooks/useDeepgramAgent';
export { useAgentState } from './hooks/useVoice/useAgentState';
export { useMessageHandling } from './hooks/useVoice/useMessageHandling';
export { useWebSocketConnection } from './hooks/useWebSocket/useWebSocketConnection';
export { useAudioManager } from './hooks/useAudio/useAudioManager';
export { useAudioInput } from './hooks/useAudio/useAudioInput';
export { useAudioOutput } from './hooks/useAudio/useAudioOutput';
export { DeepgramAgent } from './components/DeepgramAgent';
export { DeepgramErrorBoundary } from './components/DeepgramAgent';
