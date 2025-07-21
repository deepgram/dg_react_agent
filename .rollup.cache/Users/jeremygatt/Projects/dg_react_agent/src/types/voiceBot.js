/**
 * Behind the scenes event types
 */
export var BehindScenesEventType;
(function (BehindScenesEventType) {
    BehindScenesEventType["SETTINGS_APPLIED"] = "SettingsApplied";
    BehindScenesEventType["AGENT_AUDIO_DONE"] = "AgentAudioDone";
    BehindScenesEventType["USER_STARTED_SPEAKING"] = "UserStartedSpeaking";
    BehindScenesEventType["AGENT_STARTED_SPEAKING"] = "AgentStartedSpeaking";
    BehindScenesEventType["CONVERSATION_TEXT"] = "ConversationText";
    BehindScenesEventType["END_OF_THOUGHT"] = "EndOfThought";
    BehindScenesEventType["INTERRUPTION"] = "Interruption";
})(BehindScenesEventType || (BehindScenesEventType = {}));
/**
 * Action types for the reducer
 */
export var VoiceBotActionType;
(function (VoiceBotActionType) {
    VoiceBotActionType["START_LISTENING"] = "start_listening";
    VoiceBotActionType["START_THINKING"] = "start_thinking";
    VoiceBotActionType["START_SPEAKING"] = "start_speaking";
    VoiceBotActionType["START_SLEEPING"] = "start_sleeping";
    VoiceBotActionType["INCREMENT_SLEEP_TIMER"] = "increment_sleep_timer";
    VoiceBotActionType["ADD_MESSAGE"] = "add_message";
    VoiceBotActionType["ADD_BEHIND_SCENES_EVENT"] = "add_behind_scenes_event";
    VoiceBotActionType["SET_PARAMS_ON_COPY_URL"] = "set_attach_params_to_copy_url";
})(VoiceBotActionType || (VoiceBotActionType = {}));
/**
 * Type guard for conversation messages
 */
export function isConversationMessage(voiceBotMessage) {
    return (isUserMessage(voiceBotMessage) ||
        isAssistantMessage(voiceBotMessage));
}
/**
 * Type guard for latency messages
 */
export function isLatencyMessage(voiceBotMessage) {
    return voiceBotMessage.tts_latency !== undefined;
}
/**
 * Type guard for user messages
 */
export function isUserMessage(conversationMessage) {
    return conversationMessage.user !== undefined;
}
/**
 * Type guard for assistant messages
 */
export function isAssistantMessage(conversationMessage) {
    return conversationMessage.assistant !== undefined;
}
//# sourceMappingURL=voiceBot.js.map