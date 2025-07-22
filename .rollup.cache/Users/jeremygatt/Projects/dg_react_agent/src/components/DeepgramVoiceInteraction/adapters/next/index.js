'use client';
import { useVoiceInteraction } from '../../../../hooks/useVoice/useVoiceInteraction';
/**
 * Next.js adapter for DeepgramVoiceInteraction
 */
export function DeepgramVoiceInteraction(props) {
    var apiKey = props.apiKey, transcriptionOptions = props.transcriptionOptions, agentOptions = props.agentOptions, microphoneConfig = props.microphoneConfig, debug = props.debug, onReady = props.onReady, onTranscriptUpdate = props.onTranscriptUpdate, onAgentUtterance = props.onAgentUtterance, onUserMessage = props.onUserMessage, onAgentStateChange = props.onAgentStateChange, onError = props.onError;
    var _a = useVoiceInteraction({
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
    }), start = _a.start, stop = _a.stop, isReady = _a.isReady, isRecording = _a.isRecording, agentState = _a.agentState, error = _a.error;
    return null; // Headless component
}
;
//# sourceMappingURL=index.js.map