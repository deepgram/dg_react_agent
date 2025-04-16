/**
 * DeepgramVoiceInteraction Type Definitions
 */

/**
 * Connection states for Deepgram services
 */
export type ConnectionState = 'connecting' | 'connected' | 'error' | 'closed';

/**
 * Agent conversation states
 */
export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';

/**
 * Service types used in status reporting
 */
export type ServiceType = 'transcription' | 'agent';

/**
 * Configuration for the Deepgram transcription API
 * Based on Deepgram /v1/listen query parameters
 */
export interface TranscriptionOptions {
  // Core parameters
  model?: string;      // e.g., "nova-2"
  language?: string;   // e.g., "en-US"
  
  // Feature toggles
  diarize?: boolean;   // Enable speaker identification
  smart_format?: boolean;
  punctuate?: boolean;
  endpointing?: boolean | number; // true or milliseconds
  
  // Additional parameters
  interim_results?: boolean;
  vad_events?: boolean;
  
  // Any additional parameters Deepgram supports
  [key: string]: any;
}

/**
 * Configuration for the Deepgram agent API
 * Based on Deepgram /v1/agent query parameters and config
 */
export interface AgentOptions {
  // Core parameters
  model?: string;        // e.g., "aura-polaris"
  language?: string;     // e.g., "en-US"
  voice?: string;        // e.g., "male-1"
  
  // Agent behavior
  instructions?: string; // Base instructions for the agent
  endpointing?: boolean | number; // true or milliseconds
  
  // Any additional parameters Deepgram supports
  [key: string]: any;
}

/**
 * Configuration for Deepgram API endpoints
 */
export interface EndpointConfig {
  transcriptionUrl?: string; // Default: "wss://api.deepgram.com/v1/listen"
  agentUrl?: string;         // Default: "wss://api.deepgram.com/v1/agent"
}

/**
 * Payload for updating agent instructions during an active session
 */
export interface UpdateInstructionsPayload {
  context?: string;
  instructions?: string;
  [key: string]: any;
}

/**
 * Transcript response from Deepgram
 * Simplified for now - will expand based on actual API responses
 */
export interface TranscriptResponse {
  type: 'transcript';
  channel: number;
  is_final: boolean;
  speech_final: boolean;
  channel_index: number[];
  start: number;
  duration: number;
  alternatives: {
    transcript: string;
    confidence: number;
    words: Array<{
      word: string;
      start: number;
      end: number;
      confidence: number;
      speaker?: number;
    }>;
  }[];
  metadata?: any;
}

/**
 * Agent response format
 */
export interface LLMResponse {
  type: 'llm';
  text: string;
  metadata?: any;
}

/**
 * Error object structure
 */
export interface DeepgramError {
  service: ServiceType;
  code: string;
  message: string;
  details?: any;
}

/**
 * Props for the DeepgramVoiceInteraction component
 */
export interface DeepgramVoiceInteractionProps {
  /**
   * Deepgram API key
   */
  apiKey: string;
  
  /**
   * Options for the transcription service
   */
  transcriptionOptions?: TranscriptionOptions;
  
  /**
   * Options for the agent service
   */
  agentOptions?: AgentOptions;
  
  /**
   * Configuration for API endpoints
   */
  endpointConfig?: EndpointConfig;
  
  /**
   * URL to the AudioWorklet processor file
   */
  processorUrl?: string;
  
  /**
   * Called when the component is ready (initialized, mic permissions, etc.)
   */
  onReady?: (isReady: boolean) => void;
  
  /**
   * Called when the connection state of either service changes
   */
  onConnectionStateChange?: (service: ServiceType, state: ConnectionState) => void;
  
  /**
   * Called when a new transcript is received
   */
  onTranscriptUpdate?: (transcriptData: TranscriptResponse) => void;
  
  /**
   * Called when the agent's state changes
   */
  onAgentStateChange?: (state: AgentState) => void;
  
  /**
   * Called when the agent produces text output
   */
  onAgentUtterance?: (utterance: LLMResponse) => void;
  
  /**
   * Called when the user starts speaking (based on VAD/endpointing)
   */
  onUserStartedSpeaking?: () => void;
  
  /**
   * Called when the user stops speaking (based on VAD/endpointing)
   */
  onUserStoppedSpeaking?: () => void;
  
  /**
   * Called when an error occurs
   */
  onError?: (error: DeepgramError) => void;
  
  /**
   * Enable verbose logging
   */
  debug?: boolean;
}

/**
 * Control methods for the DeepgramVoiceInteraction component
 */
export interface DeepgramVoiceInteractionHandle {
  /**
   * Start the voice interaction
   */
  start: () => Promise<void>;
  
  /**
   * Stop the voice interaction
   */
  stop: () => Promise<void>;
  
  /**
   * Update the agent's instructions or context during an active session
   */
  updateAgentInstructions: (payload: UpdateInstructionsPayload) => void;
  
  /**
   * Interrupt the agent while it is speaking
   */
  interruptAgent: () => void;
} 