import { useCallback } from 'react';
export function useMessageHandlers(config, managers) {
    var agentState = config.agentState, isWaitingForUserVoiceAfterSleep = config.isWaitingForUserVoiceAfterSleep, userSpeakingRef = config.userSpeakingRef, onTranscriptUpdate = config.onTranscriptUpdate, onAgentUtterance = config.onAgentUtterance, onUserMessage = config.onUserMessage, onUserStartedSpeaking = config.onUserStartedSpeaking, onUserStoppedSpeaking = config.onUserStoppedSpeaking, setAgentState = config.setAgentState, log = config.log;
    // Handle transcription messages
    var handleTranscriptionMessage = useCallback(function (data) {
        // Skip processing if transcription service isn't configured
        if (!managers.transcription.current) {
            log('Received unexpected transcription message but service is not configured:', data);
            return;
        }
        // Check if agent is in sleep mode
        var isSleepingOrEntering = agentState === 'sleeping' || agentState === 'entering_sleep';
        if (data.type === 'VADEvent') {
            var isSpeaking = data.is_speech;
            if (isSleepingOrEntering) {
                log('Ignoring VAD event (agent sleeping)', 'verbose');
                return;
            }
            if (isSpeaking && !userSpeakingRef.current) {
                userSpeakingRef.current = true;
                onUserStartedSpeaking === null || onUserStartedSpeaking === void 0 ? void 0 : onUserStartedSpeaking();
            }
            else if (!isSpeaking && userSpeakingRef.current) {
                userSpeakingRef.current = false;
                onUserStoppedSpeaking === null || onUserStoppedSpeaking === void 0 ? void 0 : onUserStoppedSpeaking();
            }
            return;
        }
        if (data.type === 'Results' || data.type === 'Transcript') {
            if (isSleepingOrEntering) {
                log('Ignoring transcript (agent sleeping)', 'verbose');
                return;
            }
            var transcript = data;
            onTranscriptUpdate === null || onTranscriptUpdate === void 0 ? void 0 : onTranscriptUpdate(transcript);
            return;
        }
    }, [agentState, userSpeakingRef, onTranscriptUpdate, onUserStartedSpeaking, onUserStoppedSpeaking, log]);
    // Handle agent messages
    var handleAgentMessage = useCallback(function (data) {
        // Skip processing if agent service isn't configured
        if (!managers.agent.current) {
            log('Received unexpected agent message but service is not configured:', data);
            return;
        }
        var isSleepingOrEntering = agentState === 'sleeping' || agentState === 'entering_sleep';
        if (data.type === 'UserStartedSpeaking') {
            log('UserStartedSpeaking message received');
            if (isSleepingOrEntering) {
                log('Ignoring UserStartedSpeaking event (agent sleeping)', 'verbose');
                return;
            }
            // Normal speech handling when not sleeping
            log('Clearing audio queue (barge-in)');
            if (managers.audio.current) {
                managers.audio.current.clearAudioQueue();
            }
            onUserStartedSpeaking === null || onUserStartedSpeaking === void 0 ? void 0 : onUserStartedSpeaking();
            if (isWaitingForUserVoiceAfterSleep.current) {
                log('User started speaking after wake - resetting waiting flag');
                isWaitingForUserVoiceAfterSleep.current = false;
            }
            setAgentState('listening');
            return;
        }
        if (data.type === 'AgentThinking') {
            setAgentState('thinking');
            return;
        }
        if (data.type === 'AgentStartedSpeaking') {
            setAgentState('speaking');
            return;
        }
        if (data.type === 'AgentAudioDone') {
            setAgentState('idle');
            return;
        }
        // Handle conversation text
        if (data.type === 'ConversationText') {
            if (data.role === 'assistant') {
                var response = {
                    type: 'llm',
                    text: data.content || '',
                    metadata: data,
                };
                onAgentUtterance === null || onAgentUtterance === void 0 ? void 0 : onAgentUtterance(response);
                return;
            }
            else if (data.role === 'user') {
                var response = {
                    type: 'user',
                    text: data.content || '',
                    metadata: data,
                };
                onUserMessage === null || onUserMessage === void 0 ? void 0 : onUserMessage(response);
                return;
            }
        }
        // Handle warnings
        if (data.type === 'Warning') {
            log("Agent warning: ".concat(data.description, ", Code: ").concat(data.code), 'verbose');
            return;
        }
    }, [agentState, isWaitingForUserVoiceAfterSleep, onAgentUtterance, onUserMessage, onUserStartedSpeaking, setAgentState, log]);
    // Handle agent audio
    var handleAgentAudio = useCallback(function (data) {
        // Skip processing if agent service isn't configured
        if (!managers.agent.current) {
            log('Received unexpected agent audio but service is not configured');
            return;
        }
        log("Received agent audio buffer of ".concat(data.byteLength, " bytes"), 'verbose');
        // Skip audio playback if we're waiting for user voice after sleep
        if (isWaitingForUserVoiceAfterSleep.current) {
            log('Skipping audio playback (waiting for user voice after sleep)', 'verbose');
            return;
        }
        if (managers.audio.current) {
            managers.audio.current.queueAudio(data)
                .then(function () {
                log('Successfully queued audio buffer for playback', 'verbose');
            })
                .catch(function (error) {
                log("Error queueing audio: ".concat(error instanceof Error ? error.message : 'Unknown error'));
            });
        }
        else {
            log('Cannot queue audio: audioManagerRef.current is null');
        }
    }, [isWaitingForUserVoiceAfterSleep, log]);
    return {
        handleTranscriptionMessage: handleTranscriptionMessage,
        handleAgentMessage: handleAgentMessage,
        handleAgentAudio: handleAgentAudio
    };
}
//# sourceMappingURL=useMessageHandlers.js.map