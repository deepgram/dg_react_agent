/// <reference types="react" />
import { VoiceWebSocketManager } from '../../../../utils/websocket/VoiceWebSocketManager';
import { AudioManager } from '../../../../utils/audio/AudioManager';
import { AgentState, UpdateInstructionsPayload } from '../../../../types/voice';
interface AgentControlConfig {
    agentState: AgentState;
    isWaitingForUserVoiceAfterSleep: {
        current: boolean;
    };
    setAgentState: (state: AgentState) => void;
    log: (message: string, level?: 'hook' | 'manager' | 'verbose') => void;
}
export declare function useAgentControl(config: AgentControlConfig, managers: {
    agent: React.RefObject<VoiceWebSocketManager>;
    audio: React.RefObject<AudioManager>;
}): {
    clearAudio: () => void;
    interruptAgent: () => void;
    sleep: () => void;
    wake: () => void;
    toggleSleep: () => void;
    updateAgentInstructions: (payload: UpdateInstructionsPayload) => void;
    injectAgentMessage: (text: string) => void;
};
export {};
