import { AgentState as AgentStateType, AgentOptions } from '../../types/voice';
import { ConnectionState } from '../../types/common/connection';
export interface AgentSystemState {
    transcriptionConnection: ConnectionState;
    agentConnection: ConnectionState;
    agentState: AgentStateType;
    isRecording: boolean;
    isPlaying: boolean;
    agentOptions?: AgentOptions;
    lastError?: Error;
    isInitialized: boolean;
    isReady: boolean;
}
export declare const initialState: AgentSystemState;
export type StateEvent = {
    type: 'INITIALIZE';
} | {
    type: 'SET_READY';
    isReady: boolean;
} | {
    type: 'SET_TRANSCRIPTION_CONNECTION';
    state: ConnectionState;
} | {
    type: 'SET_AGENT_CONNECTION';
    state: ConnectionState;
} | {
    type: 'SET_AGENT_STATE';
    state: AgentStateType;
} | {
    type: 'SET_RECORDING';
    isRecording: boolean;
} | {
    type: 'SET_PLAYING';
    isPlaying: boolean;
} | {
    type: 'SET_ERROR';
    error: Error;
} | {
    type: 'RESET';
};
export declare function stateReducer(state: AgentSystemState, event: StateEvent): AgentSystemState;
export declare const selectors: {
    isFullyConnected: (state: AgentSystemState) => boolean;
    hasConnectionError: (state: AgentSystemState) => boolean;
    overallConnectionStatus: (state: AgentSystemState) => ConnectionState;
};
