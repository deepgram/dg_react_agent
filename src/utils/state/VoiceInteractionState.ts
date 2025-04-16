import { AgentState, ConnectionState, ServiceType } from '../../types';

/**
 * State of the voice interaction component
 */
export interface VoiceInteractionState {
  /**
   * Connection states for each service
   */
  connections: Record<ServiceType, ConnectionState>;
  
  /**
   * Current state of the agent
   */
  agentState: AgentState;
  
  /**
   * Microphone permission status
   */
  microphonePermission: 'granted' | 'denied' | 'prompt';
  
  /**
   * Whether audio recording is active
   */
  isRecording: boolean;
  
  /**
   * Whether audio playback is active
   */
  isPlaying: boolean;
  
  /**
   * Overall ready state of the component
   */
  isReady: boolean;
  
  /**
   * Error state
   */
  error: string | null;
}

/**
 * Events that can change the state
 */
export type StateEvent =
  | { type: 'CONNECTION_STATE_CHANGE'; service: ServiceType; state: ConnectionState }
  | { type: 'AGENT_STATE_CHANGE'; state: AgentState }
  | { type: 'MICROPHONE_PERMISSION_CHANGE'; status: 'granted' | 'denied' | 'prompt' }
  | { type: 'RECORDING_STATE_CHANGE'; isRecording: boolean }
  | { type: 'PLAYBACK_STATE_CHANGE'; isPlaying: boolean }
  | { type: 'READY_STATE_CHANGE'; isReady: boolean }
  | { type: 'ERROR'; message: string | null };

/**
 * Initial state
 */
export const initialState: VoiceInteractionState = {
  connections: {
    transcription: 'closed',
    agent: 'closed',
  },
  agentState: 'idle',
  microphonePermission: 'prompt',
  isRecording: false,
  isPlaying: false,
  isReady: false,
  error: null,
};

/**
 * Reducer function to update state based on events
 */
export function stateReducer(state: VoiceInteractionState, event: StateEvent): VoiceInteractionState {
  switch (event.type) {
    case 'CONNECTION_STATE_CHANGE':
      return {
        ...state,
        connections: {
          ...state.connections,
          [event.service]: event.state,
        },
        // Auto-clear error if connection becomes successful
        error: event.state === 'connected' ? null : state.error,
      };
      
    case 'AGENT_STATE_CHANGE':
      return {
        ...state,
        agentState: event.state,
      };
      
    case 'MICROPHONE_PERMISSION_CHANGE':
      return {
        ...state,
        microphonePermission: event.status,
      };
      
    case 'RECORDING_STATE_CHANGE':
      return {
        ...state,
        isRecording: event.isRecording,
      };
      
    case 'PLAYBACK_STATE_CHANGE':
      return {
        ...state,
        isPlaying: event.isPlaying,
      };
      
    case 'READY_STATE_CHANGE':
      return {
        ...state,
        isReady: event.isReady,
      };
      
    case 'ERROR':
      return {
        ...state,
        error: event.message,
      };
      
    default:
      return state;
  }
}

/**
 * Derived state properties
 */
export const derivedStates = {
  /**
   * Checks if all services are connected
   */
  isFullyConnected: (state: VoiceInteractionState): boolean => {
    return Object.values(state.connections).every(status => status === 'connected');
  },
  
  /**
   * Checks if any service has an error
   */
  hasConnectionError: (state: VoiceInteractionState): boolean => {
    return Object.values(state.connections).some(status => status === 'error');
  },
  
  /**
   * Gets overall connection status
   */
  overallConnectionStatus: (state: VoiceInteractionState): ConnectionState => {
    if (Object.values(state.connections).some(status => status === 'error')) {
      return 'error';
    }
    
    if (Object.values(state.connections).some(status => status === 'connecting')) {
      return 'connecting';
    }
    
    if (Object.values(state.connections).every(status => status === 'connected')) {
      return 'connected';
    }
    
    return 'closed';
  },
}; 