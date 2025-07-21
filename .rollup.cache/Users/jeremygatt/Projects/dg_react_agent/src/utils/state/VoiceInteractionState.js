import { __assign } from "tslib";
export var initialState = {
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
export function stateReducer(state, event) {
    var _a;
    switch (event.type) {
        case 'READY_STATE_CHANGE':
            return __assign(__assign({}, state), { isReady: event.isReady });
        case 'RECORDING_STATE_CHANGE':
            return __assign(__assign({}, state), { isRecording: event.isRecording });
        case 'PLAYBACK_STATE_CHANGE':
            return __assign(__assign({}, state), { isPlaying: event.isPlaying });
        case 'AGENT_STATE_CHANGE':
            return __assign(__assign({}, state), { agentState: event.state });
        case 'CONNECTION_STATE_CHANGE':
            return __assign(__assign({}, state), { connectionStates: __assign(__assign({}, state.connectionStates), (_a = {}, _a[event.service] = event.state, _a)) });
        case 'ERROR':
            return __assign(__assign({}, state), { error: event.message });
        default:
            return state;
    }
}
export var stateHelpers = {
    isFullyConnected: function (state) {
        return Object.values(state.connectionStates).every(function (status) { return status === 'connected'; });
    },
    hasConnectionError: function (state) {
        return Object.values(state.connectionStates).some(function (status) { return status === 'error'; });
    },
    overallConnectionStatus: function (state) {
        if (Object.values(state.connectionStates).some(function (status) { return status === 'error'; })) {
            return 'error';
        }
        if (Object.values(state.connectionStates).some(function (status) { return status === 'connecting'; })) {
            return 'connecting';
        }
        if (Object.values(state.connectionStates).every(function (status) { return status === 'connected'; })) {
            return 'connected';
        }
        return 'disconnected';
    },
};
//# sourceMappingURL=VoiceInteractionState.js.map