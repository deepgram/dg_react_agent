/// <reference types="react" />
import { VoiceWebSocketManager } from '../../../../utils/websocket/VoiceWebSocketManager';
import { AudioManager } from '../../../../utils/audio/AudioManager';
import { AgentState, TranscriptResponse, LLMResponse, UserMessageResponse } from '../../../../types/voice';
interface MessageHandlersConfig {
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
    log: (message: string, level?: 'hook' | 'manager' | 'verbose') => void;
}
export declare function useMessageHandlers(config: MessageHandlersConfig, managers: {
    transcription: React.RefObject<VoiceWebSocketManager>;
    agent: React.RefObject<VoiceWebSocketManager>;
    audio: React.RefObject<AudioManager>;
}): {
    handleTranscriptionMessage: (data: any) => void;
    handleAgentMessage: (data: any) => void;
    handleAgentAudio: (data: ArrayBuffer) => void;
};
export {};
