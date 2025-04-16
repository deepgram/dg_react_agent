/**
 * Deepgram Voice Interaction React Component
 * 
 * A React component for real-time transcription and voice agent interactions
 * using Deepgram's WebSocket APIs.
 */

// Export the main component
export { DeepgramVoiceInteraction } from './components/DeepgramVoiceInteraction';

// Export all types
export type {
  AgentState,
  ConnectionState,
  DeepgramError,
  DeepgramVoiceInteractionHandle,
  DeepgramVoiceInteractionProps,
  LLMResponse, 
  ServiceType,
  TranscriptResponse,
  TranscriptionOptions,
  AgentOptions,
  UpdateInstructionsPayload,
  EndpointConfig
} from './types'; 