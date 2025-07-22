import { useDeepgramAgent } from '../../hooks/useDeepgramAgent';
import type { DeepgramAgentProps } from './types';

/**
 * Next.js adapter for DeepgramAgent
 */
export function DeepgramAgent(props: DeepgramAgentProps) {
  const {
    apiKey,
    transcriptionOptions,
    agentOptions,
    microphoneConfig,
    debug,
    onReady,
    onTranscriptUpdate,
    onAgentUtterance,
    onUserMessage,
    onAgentStateChange,
    onError,
    children
  } = props;

  const {
    initialize,
    start,
    stop,
    updateAgentInstructions,
    interruptAgent,
    sleep,
    wake,
    toggleSleep,
    injectAgentMessage,
    isReady,
    isRecording,
    agentState,
    error
  } = useDeepgramAgent({
    apiKey,
    transcriptionOptions,
    agentOptions,
    microphoneConfig,
    debug,
    onReady,
    onTranscriptUpdate,
    onAgentUtterance,
    onUserMessage,
    onAgentStateChange,
    onError
  });

  if (typeof children === 'function') {
    return children({
      initialize,
      start,
      stop,
      updateAgentInstructions,
      interruptAgent,
      sleep,
      wake,
      toggleSleep,
      injectAgentMessage,
      isReady,
      isRecording,
      agentState,
      error
    });
  }

  return children || null;
}
