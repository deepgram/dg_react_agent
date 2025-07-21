// Re-export all voice-related types
export * from './agent';
export * from './transcription';
export * from './voiceBot';

// Core voice interaction types
import { ConnectionState, EndpointConfig } from '../common/connection';
import { DeepgramError } from '../common/error';
import { MicrophoneConfig } from '../common/microphone';

export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'entering_sleep' | 'sleeping';
export type ServiceType = 'transcription' | 'agent';

export interface AgentOptions {
  language?: string;
  listenModel?: string;
  thinkProviderType?: string;
  thinkModel?: string;
  thinkEndpointUrl?: string;
  thinkApiKey?: string;
  voice?: string;
  instructions?: string;
  greeting?: string;
}

export interface DeepgramVoiceInteractionProps {
  apiKey: string;
  transcriptionOptions?: Record<string, any>;
  agentOptions?: AgentOptions;
  endpointConfig?: EndpointConfig;
  microphoneConfig?: Partial<MicrophoneConfig>;
  onReady?: (isReady: boolean) => void;
  onConnectionStateChange?: (service: ServiceType, state: ConnectionState) => void;
  onTranscriptUpdate?: (transcript: TranscriptResponse) => void;
  onAgentStateChange?: (state: AgentState) => void;
  onAgentUtterance?: (response: LLMResponse) => void;
  onUserMessage?: (message: UserMessageResponse) => void;
  onUserStartedSpeaking?: () => void;
  onUserStoppedSpeaking?: () => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onMicrophoneData?: (data: ArrayBuffer) => void;
  onError?: (error: DeepgramError) => void;
  debug?: boolean;
}

export interface DeepgramVoiceInteractionHandle {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  updateAgentInstructions: (payload: UpdateInstructionsPayload) => void;
  interruptAgent: () => void;
  sleep: () => void;
  wake: () => void;
  toggleSleep: () => void;
  injectAgentMessage: (message: string) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  checkMicrophonePermissions: () => Promise<any>;
  getMicrophoneState: () => any;
}

export interface UpdateInstructionsPayload {
  instructions?: string;
  context?: string;
}

export interface LLMResponse {
  type: 'llm';
  text: string;
  metadata?: any;
}

export interface UserMessageResponse {
  type: 'user';
  text: string;
  metadata?: any;
}

export interface TranscriptResponse {
  type: string;
  channel_index?: number[];
  duration?: number;
  start?: number;
  is_final?: boolean;
  speech_final?: boolean;
  channel?: {
    alternatives: Array<{
      transcript: string;
      confidence: number;
      words?: Array<{
        word: string;
        start: number;
        end: number;
        confidence: number;
      }>;
    }>;
  };
} 