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

export type StateEvent =
  | { type: 'READY_STATE_CHANGE'; isReady: boolean }
  | { type: 'RECORDING_STATE_CHANGE'; isRecording: boolean }
  | { type: 'PLAYBACK_STATE_CHANGE'; isPlaying: boolean }
  | { type: 'AGENT_STATE_CHANGE'; state: AgentState }
  | { type: 'CONNECTION_STATE_CHANGE'; service: ServiceType; state: ConnectionState }
  | { type: 'ERROR'; message: string | null };

export const initialState: VoiceInteractionState = {
  isReady: false,
  isRecording: false,
  isPlaying: false,
  agentState: 'idle',
  connectionStates: {
    transcription: 'disconnected',
    agent: 'disconnected',
  },
  error: null,
};

export function stateReducer(state: VoiceInteractionState, event: StateEvent): VoiceInteractionState {
  switch (event.type) {
    case 'READY_STATE_CHANGE':
      return { ...state, isReady: event.isReady };

    case 'RECORDING_STATE_CHANGE':
      return { ...state, isRecording: event.isRecording };

    case 'PLAYBACK_STATE_CHANGE':
      return { ...state, isPlaying: event.isPlaying };

    case 'AGENT_STATE_CHANGE':
      return { ...state, agentState: event.state };

    case 'CONNECTION_STATE_CHANGE':
      return {
        ...state,
        connectionStates: {
          ...state.connectionStates,
          [event.service]: event.state,
        },
      };

    case 'ERROR':
      return { ...state, error: event.message };

    default:
      return state;
  }
}

export const stateHelpers = {
  isFullyConnected: (state: VoiceInteractionState): boolean => {
    return Object.values(state.connectionStates).every(status => status === 'connected');
  },

  hasConnectionError: (state: VoiceInteractionState): boolean => {
    return Object.values(state.connectionStates).some(status => status === 'error');
  },

  overallConnectionStatus: (state: VoiceInteractionState): ConnectionState => {
    if (Object.values(state.connectionStates).some(status => status === 'error')) {
      return 'error';
    }

    if (Object.values(state.connectionStates).some(status => status === 'connecting')) {
      return 'connecting';
    }

    if (Object.values(state.connectionStates).every(status => status === 'connected')) {
      return 'connected';
    }

    return 'disconnected';
  },
};
