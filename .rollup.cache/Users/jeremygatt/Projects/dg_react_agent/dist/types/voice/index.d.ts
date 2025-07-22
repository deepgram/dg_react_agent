/// <reference types="react" />
export * from './agent';
export * from './transcription';
export * from './voiceBot';
export * from './error';
import { DeepgramError } from '../common/error';
export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'sleeping' | 'entering_sleep';
export interface AgentOptions {
    language?: string;
    listenModel?: string;
    thinkModel?: string;
    thinkProviderType?: 'open_ai' | 'anthropic' | 'custom';
    thinkEndpointUrl?: string;
    thinkApiKey?: string;
    voice?: string;
    instructions?: string;
    greeting?: string;
}
export interface TranscriptResponse {
    type: 'transcript';
    channel: {
        alternatives: Array<{
            transcript: string;
            confidence: number;
            words: Array<any>;
        }>;
    };
    is_final: boolean;
    speech_final: boolean;
    channel_index: number[];
    start: number;
    duration: number;
}
export interface LLMResponse {
    type: 'llm';
    text: string;
    metadata?: Record<string, any>;
}
export interface UserMessageResponse {
    type: 'user';
    text: string;
    metadata?: Record<string, any>;
}
export interface DeepgramAgentProps {
    apiKey: string;
    transcriptionOptions?: Record<string, any>;
    agentOptions?: AgentOptions;
    microphoneConfig?: Record<string, any>;
    debug?: boolean;
    onReady?: (isReady: boolean) => void;
    onTranscriptUpdate?: (transcript: TranscriptResponse) => void;
    onAgentUtterance?: (response: LLMResponse) => void;
    onUserMessage?: (message: UserMessageResponse) => void;
    onAgentStateChange?: (state: AgentState) => void;
    onError?: (error: DeepgramError) => void;
    children?: React.ReactNode | ((props: any) => React.ReactNode);
}
export interface DeepgramAgentHandle {
    start: () => Promise<void>;
    stop: () => Promise<void>;
    updateAgentInstructions: (payload: UpdateInstructionsPayload) => void;
    interruptAgent: () => void;
    sleep: () => void;
    wake: () => void;
    toggleSleep: () => void;
    injectAgentMessage: (text: string) => void;
    isReady: boolean;
    isRecording: boolean;
    agentState: AgentState;
    error: DeepgramError | null;
}
export interface UpdateInstructionsPayload {
    instructions: string;
    context?: Record<string, any>;
}
