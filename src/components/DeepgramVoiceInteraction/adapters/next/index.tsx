'use client';

import React from 'react';
import type { DeepgramVoiceInteractionProps } from './types';
import { useDeepgramVoiceInteraction } from '../../hooks/useDeepgramVoiceInteraction';

/**
 * Next.js wrapper for useDeepgramVoiceInteraction hook
 * This component handles SSR compatibility and provides a safe loading state
 */
export const DeepgramWrapper: React.FC<DeepgramVoiceInteractionProps> = (props: DeepgramVoiceInteractionProps) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle SSR
  if (!isMounted) {
    return null; // Or return a loading placeholder
  }

  // Use the hook
  useDeepgramVoiceInteraction(props.apiKey, {
    transcriptionOptions: props.transcriptionOptions,
    agentOptions: props.agentOptions,
    endpointOverrides: props.endpointConfig,
    microphoneConfig: props.microphoneConfig,
    debug: props.debug,
    onReady: props.onReady,
    onConnectionStateChange: props.onConnectionStateChange,
    onTranscriptUpdate: props.onTranscriptUpdate,
    onAgentStateChange: props.onAgentStateChange,
    onAgentUtterance: props.onAgentUtterance,
    onUserMessage: props.onUserMessage,
    onUserStartedSpeaking: props.onUserStartedSpeaking,
    onUserStoppedSpeaking: props.onUserStoppedSpeaking,
    onPlaybackStateChange: props.onPlaybackStateChange,
    onMicrophoneData: props.onMicrophoneData,
    onError: props.onError
  });

  return null; // Headless component
};
