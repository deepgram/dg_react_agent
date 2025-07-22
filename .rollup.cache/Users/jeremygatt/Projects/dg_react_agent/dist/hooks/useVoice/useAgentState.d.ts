/// <reference types="react" />
import { AgentState, UpdateInstructionsPayload } from '../../types/voice';
import { VoiceWebSocketManager } from '../../utils/websocket/VoiceWebSocketManager';
import { AudioOutputManager } from '../../utils/audio/AudioOutputManager';
interface UseAgentStateOptions {
    onAgentStateChange?: (state: AgentState) => void;
    debug?: boolean;
}
interface UseAgentStateReturn {
    agentState: AgentState;
    isWaitingForUserVoiceAfterSleep: boolean;
    clearAudio: () => void;
    interruptAgent: () => void;
    sleep: () => void;
    wake: () => void;
    toggleSleep: () => void;
    updateAgentInstructions: (payload: UpdateInstructionsPayload) => void;
    injectAgentMessage: (text: string) => void;
}
export declare function useAgentState(managers: {
    agent: React.RefObject<VoiceWebSocketManager>;
    audio: React.RefObject<AudioOutputManager>;
}, options?: UseAgentStateOptions): UseAgentStateReturn;
export {};
