/**
 * Types related to the Voice Bot state management
 */
import { AgentState } from './agent';

/**
 * Conversation message types
 */
export type UserMessage = { user: string };
export type AssistantMessage = { assistant: string };
export type ConversationMessage = UserMessage | AssistantMessage;

/**
 * Latency message for tracking response times
 */
export interface LatencyMessage {
  total_latency: number | null;
  tts_latency: number;
  ttt_latency: number;
}

/**
 * All message types that can be in the voice bot state
 */
export type VoiceBotMessage = ConversationMessage | LatencyMessage;

/**
 * Behind the scenes event types
 */
export enum BehindScenesEventType {
  SETTINGS_APPLIED = 'SettingsApplied',
  AGENT_AUDIO_DONE = 'AgentAudioDone',
  USER_STARTED_SPEAKING = 'UserStartedSpeaking',
  AGENT_STARTED_SPEAKING = 'AgentStartedSpeaking',
  CONVERSATION_TEXT = 'ConversationText',
  END_OF_THOUGHT = 'EndOfThought',
  INTERRUPTION = 'Interruption',
}

/**
 * Behind the scenes event structure
 */
export type BehindScenesEvent =
  | { type: BehindScenesEventType.SETTINGS_APPLIED }
  | { type: BehindScenesEventType.AGENT_AUDIO_DONE }
  | { type: BehindScenesEventType.USER_STARTED_SPEAKING }
  | { type: BehindScenesEventType.AGENT_STARTED_SPEAKING }
  | { type: BehindScenesEventType.CONVERSATION_TEXT; role: 'user' | 'assistant'; content: string }
  | { type: BehindScenesEventType.END_OF_THOUGHT }
  | { type: BehindScenesEventType.INTERRUPTION };

/**
 * Voice bot state
 */
export interface VoiceBotState {
  /**
   * Current status of the voice bot
   */
  status: AgentState;

  /**
   * Seconds since last activity (for auto-sleep)
   */
  sleepTimer: number;

  /**
   * Conversation and latency messages
   */
  messages: VoiceBotMessage[];

  /**
   * Behind the scenes events for debugging
   */
  behindScenesEvents: BehindScenesEvent[];

  /**
   * Whether params should be attached to copy URL
   */
  attachParamsToCopyUrl?: boolean;
}

/**
 * Action types for the reducer
 */
export enum VoiceBotActionType {
  START_LISTENING = 'start_listening',
  START_THINKING = 'start_thinking',
  START_SPEAKING = 'start_speaking',
  START_SLEEPING = 'start_sleeping',
  INCREMENT_SLEEP_TIMER = 'increment_sleep_timer',
  ADD_MESSAGE = 'add_message',
  ADD_BEHIND_SCENES_EVENT = 'add_behind_scenes_event',
  SET_PARAMS_ON_COPY_URL = 'set_attach_params_to_copy_url',
}

/**
 * Voice bot actions
 */
export type VoiceBotAction =
  | { type: VoiceBotActionType.START_LISTENING }
  | { type: VoiceBotActionType.START_THINKING }
  | { type: VoiceBotActionType.START_SPEAKING }
  | { type: VoiceBotActionType.START_SLEEPING }
  | { type: VoiceBotActionType.INCREMENT_SLEEP_TIMER }
  | { type: VoiceBotActionType.ADD_MESSAGE; payload: VoiceBotMessage }
  | { type: VoiceBotActionType.ADD_BEHIND_SCENES_EVENT; payload: BehindScenesEvent }
  | { type: VoiceBotActionType.SET_PARAMS_ON_COPY_URL; payload: boolean };

/**
 * Type guard for conversation messages
 */
export function isConversationMessage(
  voiceBotMessage: VoiceBotMessage
): voiceBotMessage is ConversationMessage {
  return (
    isUserMessage(voiceBotMessage as UserMessage) ||
    isAssistantMessage(voiceBotMessage as AssistantMessage)
  );
}

/**
 * Type guard for latency messages
 */
export function isLatencyMessage(
  voiceBotMessage: VoiceBotMessage
): voiceBotMessage is LatencyMessage {
  return (voiceBotMessage as LatencyMessage).tts_latency !== undefined;
}

/**
 * Type guard for user messages
 */
export function isUserMessage(
  conversationMessage: ConversationMessage
): conversationMessage is UserMessage {
  return (conversationMessage as UserMessage).user !== undefined;
}

/**
 * Type guard for assistant messages
 */
export function isAssistantMessage(
  conversationMessage: ConversationMessage
): conversationMessage is AssistantMessage {
  return (conversationMessage as AssistantMessage).assistant !== undefined;
}

export interface VoiceWebSocketOptions {
  type: 'transcription' | 'agent';
  apiKey: string;
  model?: string;
  encoding?: string;
  channels?: number;
  sampleRate?: number;
  debug?: boolean;
}
