import { __assign } from "tslib";
export var initialState = {
    transcriptionConnection: 'disconnected',
    agentConnection: 'disconnected',
    agentState: 'idle',
    isRecording: false,
    isPlaying: false,
    isInitialized: false,
    isReady: false
};
export function stateReducer(state, event) {
    switch (event.type) {
        case 'INITIALIZE':
            return __assign(__assign({}, state), { isInitialized: true });
        case 'SET_READY':
            return __assign(__assign({}, state), { isReady: event.isReady });
        case 'SET_TRANSCRIPTION_CONNECTION':
            return __assign(__assign({}, state), { transcriptionConnection: event.state });
        case 'SET_AGENT_CONNECTION':
            return __assign(__assign({}, state), { agentConnection: event.state });
        case 'SET_AGENT_STATE':
            return __assign(__assign({}, state), { agentState: event.state });
        case 'SET_RECORDING':
            return __assign(__assign({}, state), { isRecording: event.isRecording });
        case 'SET_PLAYING':
            return __assign(__assign({}, state), { isPlaying: event.isPlaying });
        case 'SET_ERROR':
            return __assign(__assign({}, state), { lastError: event.error });
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}
// State selectors
export var selectors = {
    isFullyConnected: function (state) {
        return state.transcriptionConnection === 'connected' && state.agentConnection === 'connected';
    },
    hasConnectionError: function (state) {
        return state.transcriptionConnection === 'error' || state.agentConnection === 'error';
    },
    overallConnectionStatus: function (state) {
        if (selectors.hasConnectionError(state))
            return 'error';
        if (selectors.isFullyConnected(state))
            return 'connected';
        if (state.transcriptionConnection === 'connecting' || state.agentConnection === 'connecting') {
            return 'connecting';
        }
        return 'disconnected';
    }
};
//# sourceMappingURL=AgentState.js.map