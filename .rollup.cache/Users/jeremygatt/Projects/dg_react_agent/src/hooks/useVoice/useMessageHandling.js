import { __awaiter, __generator } from "tslib";
import { useCallback } from 'react';
export function useMessageHandling(options, managers) {
    var _this = this;
    var log = useCallback(function (message) {
        if (options.debug) {
            console.log("[MessageHandling] ".concat(message));
        }
    }, [options.debug]);
    // Handle transcription messages
    var handleTranscriptionMessage = useCallback(function (message) {
        var _a, _b, _c, _d, _e, _f;
        try {
            if (!((_c = (_b = (_a = message.channel) === null || _a === void 0 ? void 0 : _a.alternatives) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.transcript)) {
                return;
            }
            var transcript = message.channel.alternatives[0].transcript;
            var isFinal = message.is_final;
            // Track user speaking state
            if (!options.userSpeakingRef.current && transcript.trim().length > 0) {
                options.userSpeakingRef.current = true;
                (_d = options.onUserStartedSpeaking) === null || _d === void 0 ? void 0 : _d.call(options);
            }
            else if (options.userSpeakingRef.current && isFinal) {
                options.userSpeakingRef.current = false;
                (_e = options.onUserStoppedSpeaking) === null || _e === void 0 ? void 0 : _e.call(options);
            }
            // Handle sleep mode
            if (options.isWaitingForUserVoiceAfterSleep.current && transcript.trim().length > 0) {
                options.isWaitingForUserVoiceAfterSleep.current = false;
                options.setAgentState('sleeping');
            }
            // Notify transcript update
            (_f = options.onTranscriptUpdate) === null || _f === void 0 ? void 0 : _f.call(options, {
                type: 'transcript',
                channel: {
                    alternatives: [{
                            transcript: transcript,
                            confidence: message.channel.alternatives[0].confidence,
                            words: []
                        }]
                },
                is_final: isFinal,
                speech_final: isFinal,
                channel_index: [0],
                start: 0,
                duration: 0
            });
        }
        catch (error) {
            log("Error handling transcription message: ".concat(error instanceof Error ? error.message : 'Unknown error'));
        }
    }, [options, log]);
    // Handle agent messages
    var handleAgentMessage = useCallback(function (message) {
        var _a, _b;
        try {
            switch (message.type) {
                case 'Welcome':
                    log('Agent welcomed connection');
                    break;
                case 'SettingsApplied':
                    log('Agent settings applied successfully');
                    break;
                case 'AgentResponse':
                    (_a = options.onAgentUtterance) === null || _a === void 0 ? void 0 : _a.call(options, {
                        type: 'llm',
                        text: message.text,
                        metadata: message.metadata
                    });
                    break;
                case 'UserMessage':
                    (_b = options.onUserMessage) === null || _b === void 0 ? void 0 : _b.call(options, {
                        type: 'user',
                        text: message.text,
                        metadata: message.metadata
                    });
                    break;
                case 'AgentState':
                    if (message.state && message.state !== options.agentState) {
                        options.setAgentState(message.state);
                    }
                    break;
                case 'Error':
                    log("Agent error: ".concat(message.description, " (").concat(message.code, ")"));
                    break;
                case 'Warning':
                    log("Agent warning: ".concat(message.description, " (").concat(message.code, ")"));
                    break;
                default:
                    log("Unknown message type: ".concat(message.type));
            }
        }
        catch (error) {
            log("Error handling agent message: ".concat(error instanceof Error ? error.message : 'Unknown error'));
        }
    }, [options, log]);
    // Handle agent audio
    var handleAgentAudio = useCallback(function (data) { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (!managers.audio.current) {
                        throw new Error('Audio manager not initialized');
                    }
                    return [4 /*yield*/, managers.audio.current.queueAudio(data)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    log("Error handling agent audio: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); }, [managers.audio, log]);
    return {
        handleTranscriptionMessage: handleTranscriptionMessage,
        handleAgentMessage: handleAgentMessage,
        handleAgentAudio: handleAgentAudio
    };
}
//# sourceMappingURL=useMessageHandling.js.map