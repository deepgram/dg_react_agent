import { AgentState, AgentOptions, TranscriptResponse, LLMResponse, UserMessageResponse, UpdateInstructionsPayload } from '../../types/voice';
import { VoiceError } from '../../types/voice/error';
interface UseVoiceInteractionOptions {
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
interface UseVoiceInteractionReturn {
    initialize: () => Promise<void>;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    updateAgentInstructions: (payload: UpdateInstructionsPayload) => void;
    interruptAgent: () => void;
    sleep: () => void;
    wake: () => void;
    toggleSleep: () => void;
    injectAgentMessage: (text: string) => void;
    getMicrophoneState: () => any;
    getConnectionState: () => {
        transcription: boolean;
        agent: boolean;
    };
    getAgentState: () => AgentState;
    isReady: boolean;
    isRecording: boolean;
    agentState: AgentState;
    error: VoiceError | null;
}
export declare function useVoiceInteraction(options: UseVoiceInteractionOptions): UseVoiceInteractionReturn;
export {};
