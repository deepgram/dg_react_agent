import { useDeepgramAgent } from '../../hooks/useDeepgramAgent';
/**
 * Next.js adapter for DeepgramAgent
 */
export function DeepgramAgent(props) {
    var apiKey = props.apiKey, transcriptionOptions = props.transcriptionOptions, agentOptions = props.agentOptions, microphoneConfig = props.microphoneConfig, debug = props.debug, onReady = props.onReady, onTranscriptUpdate = props.onTranscriptUpdate, onAgentUtterance = props.onAgentUtterance, onUserMessage = props.onUserMessage, onAgentStateChange = props.onAgentStateChange, onError = props.onError, children = props.children;
    var _a = useDeepgramAgent({
        apiKey: apiKey,
        transcriptionOptions: transcriptionOptions,
        agentOptions: agentOptions,
        microphoneConfig: microphoneConfig,
        debug: debug,
        onReady: onReady,
        onTranscriptUpdate: onTranscriptUpdate,
        onAgentUtterance: onAgentUtterance,
        onUserMessage: onUserMessage,
        onAgentStateChange: onAgentStateChange,
        onError: onError
    }), initialize = _a.initialize, start = _a.start, stop = _a.stop, updateAgentInstructions = _a.updateAgentInstructions, interruptAgent = _a.interruptAgent, sleep = _a.sleep, wake = _a.wake, toggleSleep = _a.toggleSleep, injectAgentMessage = _a.injectAgentMessage, isReady = _a.isReady, isRecording = _a.isRecording, agentState = _a.agentState, error = _a.error;
    if (typeof children === 'function') {
        return children({
            initialize: initialize,
            start: start,
            stop: stop,
            updateAgentInstructions: updateAgentInstructions,
            interruptAgent: interruptAgent,
            sleep: sleep,
            wake: wake,
            toggleSleep: toggleSleep,
            injectAgentMessage: injectAgentMessage,
            isReady: isReady,
            isRecording: isRecording,
            agentState: agentState,
            error: error
        });
    }
    return children || null;
}
//# sourceMappingURL=index.js.map