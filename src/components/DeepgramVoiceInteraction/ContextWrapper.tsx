"use client";

import React, { 
  forwardRef,
  useMemo
} from "react";

import {
  DeepgramConnectionProvider,
  AudioProvider,
  VoiceBotProvider
} from "../../contexts";

import DeepgramVoiceInteractionInner from "./DeepgramVoiceInteractionInner";

import type {
  DeepgramVoiceInteractionProps,
  DeepgramVoiceInteractionHandle
} from "../../types";

const DEFAULT_SLEEP_TIMEOUT = 30; // seconds

/**
 * Main DeepgramVoiceInteraction component that uses the context-based architecture
 * This is a wrapper component that sets up all the necessary contexts and providers
 */
const DeepgramVoiceInteractionContextWrapped = forwardRef<
  DeepgramVoiceInteractionHandle,
  DeepgramVoiceInteractionProps
>((props, ref) => {
  const {
    apiKey,
    transcriptionOptions,
    agentOptions,
    endpointConfig,
    onReady,
    onConnectionStateChange,
    onTranscriptUpdate,
    onAgentStateChange,
    onAgentUtterance,
    onPlaybackStateChange,
    onUserStartedSpeaking,
    onUserStoppedSpeaking,
    onError,
    debug = false,
    sleepOptions
  } = props;
  
  // Determine sleep timeout
  const sleepTimeoutSeconds = useMemo(() => {
    if (sleepOptions?.timeout !== undefined) {
      return sleepOptions.timeout;
    }
    return DEFAULT_SLEEP_TIMEOUT;
  }, [sleepOptions?.timeout]);
  
  return (
    <DeepgramConnectionProvider
      apiKey={apiKey}
      endpointConfig={endpointConfig}
      onConnectionStateChange={onConnectionStateChange}
      onError={onError}
      debug={debug}
    >
      <AudioProvider
        options={{
          debug,
          sampleRate: 16000, // Deepgram's preferred sample rate
          outputSampleRate: 24000 // Default for most TTS systems
        }}
        onPlaybackStateChange={onPlaybackStateChange}
        onError={onError}
        debug={debug}
      >
        <VoiceBotProvider sleepTimeoutSeconds={sleepTimeoutSeconds}>
          <DeepgramVoiceInteractionInner
            ref={ref}
            {...props}
          />
        </VoiceBotProvider>
      </AudioProvider>
    </DeepgramConnectionProvider>
  );
});

// Display name for debugging
DeepgramVoiceInteractionContextWrapped.displayName = "DeepgramVoiceInteraction";

export default DeepgramVoiceInteractionContextWrapped; 