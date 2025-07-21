import { AgentState, ServiceType } from '../../types/voice';
import { ConnectionState } from '../../types/common/connection';
export interface VoiceInteractionState {
    isReady: boolean;
    isRecording: boolean;
    isPlaying: boolean;
    agentState: AgentState;
    connectionStates: {
        transcription: ConnectionState;
        agent: ConnectionState;
    };
    error: string | null;
}
export type StateEvent = {
    type: 'READY_STATE_CHANGE';
    isReady: boolean;
} | {
    type: 'RECORDING_STATE_CHANGE';
    isRecording: boolean;
} | {
    type: 'PLAYBACK_STATE_CHANGE';
    isPlaying: boolean;
} | {
    type: 'AGENT_STATE_CHANGE';
    state: AgentState;
} | {
    type: 'CONNECTION_STATE_CHANGE';
    service: ServiceType;
    state: ConnectionState;
} | {
    type: 'ERROR';
    message: string | null;
};
export declare const initialState: VoiceInteractionState;
export declare function stateReducer(state: VoiceInteractionState, event: StateEvent): VoiceInteractionState;
export declare const stateHelpers: {
    isFullyConnected: (state: VoiceInteractionState) => boolean;
    hasConnectionError: (state: VoiceInteractionState) => boolean;
    overallConnectionStatus: (state: VoiceInteractionState) => ConnectionState;
};
