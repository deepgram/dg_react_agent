/**
 * VoiceBotReducer - Handles state transitions for the voice bot
 */
import { AgentState } from '../types/agent';
import { 
  VoiceBotState,
  VoiceBotAction,
  VoiceBotActionType,
  BehindScenesEvent, 
  VoiceBotMessage
} from '../types/voiceBot';

/**
 * Initial state for the voice bot reducer
 */
export const initialVoiceBotState: VoiceBotState = {
  status: 'idle' as AgentState,
  sleepTimer: 0,
  messages: [],
  behindScenesEvents: [],
  attachParamsToCopyUrl: true
};

/**
 * Reducer function for voice bot state management
 */
export function voiceBotReducer(
  state: VoiceBotState,
  action: VoiceBotAction
): VoiceBotState {
  switch (action.type) {
    case VoiceBotActionType.START_LISTENING:
      return { 
        ...state, 
        status: 'listening' as AgentState, 
        sleepTimer: 0 
      };
      
    case VoiceBotActionType.START_THINKING:
      return { 
        ...state, 
        status: 'thinking' as AgentState 
      };
      
    case VoiceBotActionType.START_SPEAKING:
      return { 
        ...state, 
        status: 'speaking' as AgentState, 
        sleepTimer: 0 
      };
      
    case VoiceBotActionType.START_SLEEPING:
      return { 
        ...state, 
        status: 'sleeping' as AgentState 
      };
      
    case VoiceBotActionType.INCREMENT_SLEEP_TIMER:
      return { 
        ...state, 
        sleepTimer: state.sleepTimer + 1 
      };
      
    case VoiceBotActionType.ADD_MESSAGE:
      return { 
        ...state, 
        messages: [...state.messages, action.payload] 
      };
      
    case VoiceBotActionType.ADD_BEHIND_SCENES_EVENT:
      return { 
        ...state, 
        behindScenesEvents: [...state.behindScenesEvents, action.payload] 
      };
      
    case VoiceBotActionType.SET_PARAMS_ON_COPY_URL:
      return { 
        ...state, 
        attachParamsToCopyUrl: action.payload 
      };
      
    default:
      return state;
  }
}

/**
 * Action creator for starting listening state
 */
export function startListening(): VoiceBotAction {
  return { type: VoiceBotActionType.START_LISTENING };
}

/**
 * Action creator for starting thinking state
 */
export function startThinking(): VoiceBotAction {
  return { type: VoiceBotActionType.START_THINKING };
}

/**
 * Action creator for starting speaking state
 */
export function startSpeaking(): VoiceBotAction {
  return { type: VoiceBotActionType.START_SPEAKING };
}

/**
 * Action creator for starting sleeping state
 */
export function startSleeping(): VoiceBotAction {
  return { type: VoiceBotActionType.START_SLEEPING };
}

/**
 * Action creator for incrementing sleep timer
 */
export function incrementSleepTimer(): VoiceBotAction {
  return { type: VoiceBotActionType.INCREMENT_SLEEP_TIMER };
}

/**
 * Action creator for adding a message
 */
export function addMessage(message: VoiceBotMessage): VoiceBotAction {
  return { 
    type: VoiceBotActionType.ADD_MESSAGE, 
    payload: message 
  };
}

/**
 * Action creator for adding a behind-the-scenes event
 */
export function addBehindScenesEvent(event: BehindScenesEvent): VoiceBotAction {
  return { 
    type: VoiceBotActionType.ADD_BEHIND_SCENES_EVENT, 
    payload: event 
  };
}

/**
 * Action creator for setting copy URL params
 */
export function setParamsOnCopyUrl(enabled: boolean): VoiceBotAction {
  return { 
    type: VoiceBotActionType.SET_PARAMS_ON_COPY_URL, 
    payload: enabled 
  };
} 