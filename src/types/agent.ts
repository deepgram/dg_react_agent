/**
 * Types related to the Deepgram Voice Agent API
 * Based on the VA-API Spec README.md
 */

/**
 * Agent states in the voice interaction process
 */
export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'sleeping';

/**
 * Agent message types for outgoing messages to the API
 */
export enum AgentMessageType {
  SETTINGS = 'Settings',
  UPDATE_PROMPT = 'UpdatePrompt',
  UPDATE_SPEAK = 'UpdateSpeak',
  INJECT_AGENT_MESSAGE = 'InjectAgentMessage',
  FUNCTION_CALL_RESPONSE = 'FunctionCallResponse',
  KEEP_ALIVE = 'KeepAlive'
}

/**
 * Agent message types for incoming messages from the API
 */
export enum AgentResponseType {
  WELCOME = 'Welcome',
  SETTINGS_APPLIED = 'SettingsApplied',
  PROMPT_UPDATED = 'PromptUpdated',
  SPEAK_UPDATED = 'SpeakUpdated',
  CONVERSATION_TEXT = 'ConversationText',
  USER_STARTED_SPEAKING = 'UserStartedSpeaking',
  AGENT_THINKING = 'AgentThinking',
  FUNCTION_CALL_REQUEST = 'FunctionCallRequest',
  FUNCTION_CALL_RESPONSE = 'FunctionCallResponse',
  AGENT_STARTED_SPEAKING = 'AgentStartedSpeaking',
  AGENT_AUDIO_DONE = 'AgentAudioDone',
  ERROR = 'Error',
  WARNING = 'Warning'
}

/**
 * Role in a conversation
 */
export type ConversationRole = 'user' | 'assistant';

/**
 * Settings message as per the spec
 */
export interface AgentSettingsMessage {
  type: AgentMessageType.SETTINGS;
  experimental?: boolean;
  audio: {
    input: {
      encoding: string;
      sample_rate: number;
    };
    output?: {
      encoding: string;
      sample_rate: number;
      bitrate?: number;
      container?: string;
    };
  };
  agent: {
    language?: string;
    listen?: {
      provider: {
        type: string;
        model: string;
        keyterms?: string[];
      };
    };
    think: {
      provider: {
        type: string;
        model: string;
        temperature?: number;
      };
      endpoint?: {
        url: string;
        headers?: Record<string, string>;
      };
      functions?: AgentFunction[];
      prompt?: string;
    };
    speak?: {
      provider: {
        type: string;
        model?: string;
        model_id?: string;
        voice?: string;
        language_code?: string;
        mode?: string;
        id?: string;
      };
      endpoint?: {
        url: string;
        headers?: Record<string, string>;
      };
    };
    greeting?: string;
  };
}

/**
 * UpdatePrompt message as per the spec
 */
export interface UpdatePromptMessage {
  type: AgentMessageType.UPDATE_PROMPT;
  prompt: string;
}

/**
 * UpdateSpeak message as per the spec
 */
export interface UpdateSpeakMessage {
  type: AgentMessageType.UPDATE_SPEAK;
  speak: {
    provider: {
      type: string;
      model?: string;
      model_id?: string;
      voice?: string;
      language_code?: string;
      mode?: string;
      id?: string;
    };
    endpoint?: {
      url: string;
      headers?: Record<string, string>;
    };
  };
}

/**
 * InjectAgentMessage for immediate agent response
 */
export interface InjectAgentMessage {
  type: AgentMessageType.INJECT_AGENT_MESSAGE;
  content: string;
}

/**
 * FunctionCallResponse to send back function results
 */
export interface FunctionCallResponseMessage {
  type: AgentMessageType.FUNCTION_CALL_RESPONSE;
  id: string;
  name: string;
  content: string;
}

/**
 * KeepAlive message to maintain the connection
 */
export interface KeepAliveMessage {
  type: AgentMessageType.KEEP_ALIVE;
}

/**
 * Function definition for agent
 */
export interface AgentFunction {
  name: string;
  description: string;
  parameters: Record<string, any>;
  endpoint?: {
    url: string;
    method: string;
    headers?: Record<string, string>;
  };
}

/**
 * Welcome response from the server
 */
export interface WelcomeResponse {
  type: AgentResponseType.WELCOME;
  request_id: string;
}

/**
 * Settings applied confirmation
 */
export interface SettingsAppliedResponse {
  type: AgentResponseType.SETTINGS_APPLIED;
}

/**
 * Prompt updated confirmation
 */
export interface PromptUpdatedResponse {
  type: AgentResponseType.PROMPT_UPDATED;
}

/**
 * Speak updated confirmation
 */
export interface SpeakUpdatedResponse {
  type: AgentResponseType.SPEAK_UPDATED;
}

/**
 * Conversation text from user or assistant
 */
export interface ConversationTextResponse {
  type: AgentResponseType.CONVERSATION_TEXT;
  role: ConversationRole;
  content: string;
}

/**
 * User started speaking notification
 */
export interface UserStartedSpeakingResponse {
  type: AgentResponseType.USER_STARTED_SPEAKING;
}

/**
 * Agent thinking notification
 */
export interface AgentThinkingResponse {
  type: AgentResponseType.AGENT_THINKING;
  content: string;
}

/**
 * Function call request from the agent
 */
export interface FunctionCallRequestResponse {
  type: AgentResponseType.FUNCTION_CALL_REQUEST;
  functions: Array<{
    id: string;
    name: string;
    arguments: string;
    client_side: boolean;
  }>;
}

/**
 * Function call response from the server
 */
export interface FunctionCallResponseFromServer {
  type: AgentResponseType.FUNCTION_CALL_RESPONSE;
  id: string;
  name: string;
  content: string;
}

/**
 * Agent started speaking notification
 */
export interface AgentStartedSpeakingResponse {
  type: AgentResponseType.AGENT_STARTED_SPEAKING;
}

/**
 * Agent audio done notification
 */
export interface AgentAudioDoneResponse {
  type: AgentResponseType.AGENT_AUDIO_DONE;
}

/**
 * Error response from the server
 */
export interface ErrorResponse {
  type: AgentResponseType.ERROR;
  description: string;
  code: string;
}

/**
 * Warning response from the server
 */
export interface WarningResponse {
  type: AgentResponseType.WARNING;
  description: string;
  code: string;
}

/**
 * Union type for all outgoing messages
 */
export type AgentOutgoingMessage =
  | AgentSettingsMessage
  | UpdatePromptMessage
  | UpdateSpeakMessage
  | InjectAgentMessage
  | FunctionCallResponseMessage
  | KeepAliveMessage;

/**
 * Union type for all incoming messages
 */
export type AgentIncomingMessage =
  | WelcomeResponse
  | SettingsAppliedResponse
  | PromptUpdatedResponse
  | SpeakUpdatedResponse
  | ConversationTextResponse
  | UserStartedSpeakingResponse
  | AgentThinkingResponse
  | FunctionCallRequestResponse
  | FunctionCallResponseFromServer
  | AgentStartedSpeakingResponse
  | AgentAudioDoneResponse
  | ErrorResponse
  | WarningResponse;

/**
 * Simplified agent options for component props
 */
export interface AgentOptions {
  // Core parameters
  language?: string;     // e.g., "en-US"
  
  // Listen settings
  listenModel?: string;  // e.g., "nova-2"
  
  // Think settings
  thinkProviderType?: string; // e.g., "open_ai", "anthropic", etc.
  thinkModel?: string;   // e.g., "gpt-4-turbo", "claude-3-sonnet"
  thinkTemperature?: number; // e.g., 0.7
  instructions?: string; // Base instructions for the agent
  
  // Speak settings
  speakProvider?: string; // e.g., "deepgram", "eleven_labs"
  voice?: string;        // e.g., "aura-asteria-en"
  
  // Optional greeting message
  greeting?: string;
  
  // Function definitions for agent
  functions?: AgentFunction[];
}

/**
 * Payload for updating agent instructions during an active session
 */
export interface UpdateInstructionsPayload {
  context?: string;
  instructions?: string;
  [key: string]: any;
} 