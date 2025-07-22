/// <reference types="react" />
import { VoiceWebSocketManager } from '../../utils/websocket/VoiceWebSocketManager';
import { AudioOutputManager } from '../../utils/audio/AudioOutputManager';
import { AgentState, TranscriptResponse, LLMResponse, UserMessageResponse } from '../../types/voice';
interface UseMessageHandlingOptions {
    agentState: AgentState;
    isWaitingForUserVoiceAfterSleep: {
        current: boolean;
    };
    userSpeakingRef: {
        current: boolean;
    };
    onTranscriptUpdate?: (transcript: TranscriptResponse) => void;
    onAgentUtterance?: (response: LLMResponse) => void;
    onUserMessage?: (message: UserMessageResponse) => void;
    onUserStartedSpeaking?: () => void;
    onUserStoppedSpeaking?: () => void;
    setAgentState: (state: AgentState) => void;
    debug?: boolean;
}
interface UseMessageHandlingReturn {
    handleTranscriptionMessage: (message: any) => void;
    handleAgentMessage: (message: any) => void;
    handleAgentAudio: (data: ArrayBuffer) => void;
}
export declare function useMessageHandling(options: UseMessageHandlingOptions, managers: {
    transcription: React.RefObject<VoiceWebSocketManager>;
    agent: React.RefObject<VoiceWebSocketManager>;
    audio: React.RefObject<AudioOutputManager>;
}): UseMessageHandlingReturn;
export {};
