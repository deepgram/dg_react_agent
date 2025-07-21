/**
 * Types related to the Deepgram Voice Agent API
 * Based on the VA-API Spec README.md
 */
/**
 * Agent message types for outgoing messages to the API
 */
export var AgentMessageType;
(function (AgentMessageType) {
    AgentMessageType["SETTINGS"] = "Settings";
    AgentMessageType["UPDATE_PROMPT"] = "UpdatePrompt";
    AgentMessageType["UPDATE_SPEAK"] = "UpdateSpeak";
    AgentMessageType["INJECT_AGENT_MESSAGE"] = "InjectAgentMessage";
    AgentMessageType["FUNCTION_CALL_RESPONSE"] = "FunctionCallResponse";
    AgentMessageType["KEEP_ALIVE"] = "KeepAlive";
})(AgentMessageType || (AgentMessageType = {}));
/**
 * Agent message types for incoming messages from the API
 */
export var AgentResponseType;
(function (AgentResponseType) {
    AgentResponseType["WELCOME"] = "Welcome";
    AgentResponseType["SETTINGS_APPLIED"] = "SettingsApplied";
    AgentResponseType["PROMPT_UPDATED"] = "PromptUpdated";
    AgentResponseType["SPEAK_UPDATED"] = "SpeakUpdated";
    AgentResponseType["CONVERSATION_TEXT"] = "ConversationText";
    AgentResponseType["USER_STARTED_SPEAKING"] = "UserStartedSpeaking";
    AgentResponseType["AGENT_THINKING"] = "AgentThinking";
    AgentResponseType["FUNCTION_CALL_REQUEST"] = "FunctionCallRequest";
    AgentResponseType["FUNCTION_CALL_RESPONSE"] = "FunctionCallResponse";
    AgentResponseType["AGENT_STARTED_SPEAKING"] = "AgentStartedSpeaking";
    AgentResponseType["AGENT_AUDIO_DONE"] = "AgentAudioDone";
    AgentResponseType["ERROR"] = "Error";
    AgentResponseType["WARNING"] = "Warning";
})(AgentResponseType || (AgentResponseType = {}));
//# sourceMappingURL=agent.js.map