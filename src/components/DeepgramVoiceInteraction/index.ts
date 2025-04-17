// Original version that directly exports the standalone component
import DeepgramVoiceInteraction from './DeepgramVoiceInteraction';
export { DeepgramVoiceInteraction };

// Re-export types
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
  UpdateInstructionsPayload
} from '../../types'; 