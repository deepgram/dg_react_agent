import { AgentState as AgentStateType, AgentOptions } from '../../types/voice';
import { ConnectionState } from '../../types/common/connection';

export interface AgentSystemState {
  // Connection states
  transcriptionConnection: ConnectionState;
  agentConnection: ConnectionState;
  
  // Agent state
  agentState: AgentStateType;
  
  // Audio states
  isRecording: boolean;
  isPlaying: boolean;
  
  // Configuration
  agentOptions?: AgentOptions;
  
  // Error states
  lastError?: Error;
  
  // Metadata
  isInitialized: boolean;
  isReady: boolean;
}

export const initialState: AgentSystemState = {
  transcriptionConnection: 'disconnected',
  agentConnection: 'disconnected',
  agentState: 'idle',
  isRecording: false,
  isPlaying: false,
  isInitialized: false,
  isReady: false
};

export type StateEvent = 
  | { type: 'INITIALIZE' }
  | { type: 'SET_READY'; isReady: boolean }
  | { type: 'SET_TRANSCRIPTION_CONNECTION'; state: ConnectionState }
  | { type: 'SET_AGENT_CONNECTION'; state: ConnectionState }
  | { type: 'SET_AGENT_STATE'; state: AgentStateType }
  | { type: 'SET_RECORDING'; isRecording: boolean }
  | { type: 'SET_PLAYING'; isPlaying: boolean }
  | { type: 'SET_ERROR'; error: Error }
  | { type: 'RESET' };

export function stateReducer(state: AgentSystemState, event: StateEvent): AgentSystemState {
  switch (event.type) {
    case 'INITIALIZE':
      return { ...state, isInitialized: true };
    
    case 'SET_READY':
      return { ...state, isReady: event.isReady };
    
    case 'SET_TRANSCRIPTION_CONNECTION':
      return { ...state, transcriptionConnection: event.state };
    
    case 'SET_AGENT_CONNECTION':
      return { ...state, agentConnection: event.state };
    
    case 'SET_AGENT_STATE':
      return { ...state, agentState: event.state };
    
    case 'SET_RECORDING':
      return { ...state, isRecording: event.isRecording };
    
    case 'SET_PLAYING':
      return { ...state, isPlaying: event.isPlaying };
    
    case 'SET_ERROR':
      return { ...state, lastError: event.error };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

// State selectors
export const selectors = {
  isFullyConnected: (state: AgentSystemState): boolean => {
    return state.transcriptionConnection === 'connected' && state.agentConnection === 'connected';
  },
  
  hasConnectionError: (state: AgentSystemState): boolean => {
    return state.transcriptionConnection === 'error' || state.agentConnection === 'error';
  },
  
  overallConnectionStatus: (state: AgentSystemState): ConnectionState => {
    if (selectors.hasConnectionError(state)) return 'error';
    if (selectors.isFullyConnected(state)) return 'connected';
    if (state.transcriptionConnection === 'connecting' || state.agentConnection === 'connecting') {
      return 'connecting';
    }
    return 'disconnected';
  }
};
