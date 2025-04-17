/**
 * DeepgramVoiceInteraction Type Definitions
 */

// Import types we need directly in this file
import type { AgentOptions, AgentState, AgentFunction, AgentSettingsMessage, UpdateInstructionsPayload } from './agent';
import type { ConnectionState, ServiceType, EndpointConfig, DeepgramError } from './connection';
import type { TranscriptionOptions, TranscriptResponse } from './transcription';

// Re-export all types from specific files
export * from './agent';
export * from './connection';
export * from './transcription';
export * from './voiceBot';

// Additional exports for backward compatibility
export type {
  AgentOptions,
  AgentState,
  AgentFunction,
  AgentSettingsMessage,
  UpdateInstructionsPayload
} from './agent';

export type {
  ConnectionState,
  ServiceType,
  EndpointConfig,
  DeepgramError
} from './connection';

export type {
  TranscriptionOptions,
  TranscriptResponse
} from './transcription';

/**
 * LLM response format
 */
export interface LLMResponse {
  type: 'llm';
  text: string;
  metadata?: any;
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
   * Called when audio playback state changes
   */
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  
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

  /**
   * Options for auto-sleep functionality
   */
  sleepOptions?: {
    /**
     * Enable auto-sleep after inactivity
     */
    autoSleep?: boolean;
    
    /**
     * Seconds of inactivity before auto-sleep (default: 30)
     */
    timeout?: number;
    
    /**
     * Phrases that can wake the agent from sleep
     */
    wakeWords?: string[];
  };
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
  
  /**
   * Put the agent to sleep
   */
  sleep: () => void;
  
  /**
   * Wake the agent from sleep
   */
  wake: () => void;
  
  /**
   * Toggle between sleep and wake states
   */
  toggleSleep: () => void;
}

/**
 * Possible states of the agent interaction
 */
export type AgentState =
  | 'idle'       // Agent is ready, not actively listening, speaking, or thinking
  | 'listening'  // Agent is actively processing user audio input
  | 'thinking'   // Agent has received user input and is processing/generating a response
  | 'speaking'   // Agent is generating or sending audio output
  | 'entering_sleep' // Intermediate state while transitioning to sleep
  | 'sleeping';  // Agent is paused, ignoring audio input until woken 