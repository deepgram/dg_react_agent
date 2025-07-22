import { AgentState, AgentOptions, TranscriptResponse, LLMResponse, UserMessageResponse, UpdateInstructionsPayload } from '../../../types/voice';
import { VoiceError } from '../../../types/voice/error';
interface UseDeepgramVoiceInteractionOptions {
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
    onError?: (error: VoiceError) => void;
}
interface UseDeepgramVoiceInteractionReturn {
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
    error: VoiceError | null;
}
/**
 * Hook for Deepgram voice interaction functionality.
 * Composes base hooks for audio and WebSocket management.
 */
export declare function useDeepgramVoiceInteraction(options: UseDeepgramVoiceInteractionOptions): UseDeepgramVoiceInteractionReturn;
export {};
