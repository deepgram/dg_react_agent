"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
  RefObject,
} from "react";

import {
  voiceBotReducer,
  initialVoiceBotState,
  startListening,
  startThinking,
  startSpeaking,
  startSleeping,
  incrementSleepTimer,
  addMessage,
  addBehindScenesEvent,
  setParamsOnCopyUrl,
} from "../reducers/VoiceBotReducer";

import type {
  VoiceBotState,
  VoiceBotMessage,
  BehindScenesEvent,
  ConversationMessage,
  UserMessage,
  AssistantMessage,
} from "../types/voiceBot";

import {
  isConversationMessage,
  isLatencyMessage,
  isAssistantMessage,
  isUserMessage,
} from "../types/voiceBot";

import type { AgentState } from "../types/agent";

/**
 * Extended interface for the context value
 */
export interface VoiceBotContextValue extends VoiceBotState {
  // Message management
  addVoicebotMessage: (newMessage: VoiceBotMessage) => void;
  addBehindScenesEvent: (data: BehindScenesEvent) => void;
  
  // State transitions
  startSpeaking: (wakeFromSleep?: boolean) => void;
  startListening: (wakeFromSleep?: boolean) => void;
  startThinking: () => void;
  startSleeping: () => void;
  toggleSleep: () => void;
  
  // Refs
  isWaitingForUserVoiceAfterSleep: RefObject<boolean>;
  
  // UI helpers
  displayOrder: VoiceBotMessage[];
  setAttachParamsToCopyUrl: (attachParamsToCopyUrl: boolean) => void;
}

// Create the context with undefined default value
export const VoiceBotContext = createContext<VoiceBotContextValue | undefined>(undefined);

/**
 * Hook to use the VoiceBot context
 */
export function useVoiceBot() {
  const context = useContext(VoiceBotContext);
  if (!context) {
    throw new Error("useVoiceBot must be used within a VoiceBotProvider");
  }
  return context;
}

interface VoiceBotProviderProps {
  children: ReactNode;
  sleepTimeoutSeconds?: number;
}

/**
 * Provider component for VoiceBot state
 */
export function VoiceBotProvider({
  children,
  sleepTimeoutSeconds = 30,
}: VoiceBotProviderProps) {
  const [state, dispatch] = useReducer(voiceBotReducer, initialVoiceBotState);
  
  // After waking from sleep, the bot must wait for the user to speak before playing audio
  const isWaitingForUserVoiceAfterSleep = useRef(false);

  // Set up sleep timer
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(incrementSleepTimer());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-sleep after timeout
  useEffect(() => {
    if (state.sleepTimer > sleepTimeoutSeconds) {
      startSleepingFn();
    }
  }, [state.sleepTimer, sleepTimeoutSeconds]);

  // Message management
  const addVoicebotMessage = useCallback((newMessage: VoiceBotMessage) => {
    dispatch(addMessage(newMessage));
  }, []);

  const addBehindScenesEventFn = useCallback((event: BehindScenesEvent) => {
    dispatch(addBehindScenesEvent(event));
  }, []);

  // State transitions
  const startSpeakingFn = useCallback((wakeFromSleep = false) => {
    if (wakeFromSleep || state.status !== 'sleeping') {
      dispatch(startSpeaking());
    }
  }, [state.status]);

  const startListeningFn = useCallback((wakeFromSleep = false) => {
    if (wakeFromSleep || state.status !== 'sleeping') {
      dispatch(startListening());
    }
  }, [state.status]);

  const startThinkingFn = useCallback(() => {
    dispatch(startThinking());
  }, []);

  const startSleepingFn = useCallback(() => {
    isWaitingForUserVoiceAfterSleep.current = true;
    dispatch(startSleeping());
  }, []);

  const toggleSleep = useCallback(() => {
    if (state.status === 'sleeping') {
      startListeningFn(true);
    } else {
      startSleepingFn();
    }
  }, [state.status, startListeningFn, startSleepingFn]);

  const setAttachParamsToCopyUrl = useCallback((value: boolean) => {
    dispatch(setParamsOnCopyUrl(value));
  }, []);

  // Determine display order of messages
  const displayOrder = useMemo(() => {
    const conversationMessages = state.messages.filter(isConversationMessage);
    const latencyMessages = state.messages.filter(isLatencyMessage);

    const result: Array<VoiceBotMessage> = [];

    const endOfTurn = (message: ConversationMessage, previousMessage: ConversationMessage) =>
      isAssistantMessage(previousMessage) && isUserMessage(message);

    conversationMessages.forEach((message, i, arr) => {
      const previousMessage = arr[i - 1];
      if (previousMessage && endOfTurn(message as ConversationMessage, previousMessage as ConversationMessage)) {
        const latencyMessage = latencyMessages.shift();
        if (latencyMessage) result.push(latencyMessage);
      }
      result.push(message);
      if (isAssistantMessage(message as ConversationMessage) && i === arr.length - 1) {
        const latencyMessage = latencyMessages.shift();
        if (latencyMessage) result.push(latencyMessage);
      }
    });
    return result;
  }, [state.messages]);

  // Create the context value
  const contextValue = useMemo<VoiceBotContextValue>(
    () => ({
      ...state,
      isWaitingForUserVoiceAfterSleep,
      displayOrder,
      addVoicebotMessage,
      addBehindScenesEvent: addBehindScenesEventFn,
      startSpeaking: startSpeakingFn,
      startListening: startListeningFn,
      startThinking: startThinkingFn,
      startSleeping: startSleepingFn,
      toggleSleep,
      setAttachParamsToCopyUrl,
    }),
    [
      state,
      displayOrder,
      addVoicebotMessage,
      addBehindScenesEventFn,
      startSpeakingFn,
      startListeningFn,
      startThinkingFn,
      startSleepingFn,
      toggleSleep,
      setAttachParamsToCopyUrl,
    ]
  );

  return (
    <VoiceBotContext.Provider value={contextValue}>
      {children}
    </VoiceBotContext.Provider>
  );
} 