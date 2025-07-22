import { useCallback } from 'react';
import { VoiceWebSocketManager } from '../../../../utils/websocket/VoiceWebSocketManager';
import { AudioManager } from '../../../../utils/audio/AudioManager';
import { AgentState, TranscriptResponse, LLMResponse, UserMessageResponse } from '../../../../types/voice';

interface MessageHandlersConfig {
  agentState: AgentState;
  isWaitingForUserVoiceAfterSleep: { current: boolean };
  userSpeakingRef: { current: boolean };
  onTranscriptUpdate?: (transcript: TranscriptResponse) => void;
  onAgentUtterance?: (response: LLMResponse) => void;
  onUserMessage?: (message: UserMessageResponse) => void;
  onUserStartedSpeaking?: () => void;
  onUserStoppedSpeaking?: () => void;
  setAgentState: (state: AgentState) => void;
  log: (message: string, level?: 'hook' | 'manager' | 'verbose') => void;
}

export function useMessageHandlers(
  config: MessageHandlersConfig,
  managers: {
    transcription: React.RefObject<VoiceWebSocketManager>;
    agent: React.RefObject<VoiceWebSocketManager>;
    audio: React.RefObject<AudioManager>;
  }
) {
  const {
    agentState,
    isWaitingForUserVoiceAfterSleep,
    userSpeakingRef,
    onTranscriptUpdate,
    onAgentUtterance,
    onUserMessage,
    onUserStartedSpeaking,
    onUserStoppedSpeaking,
    setAgentState,
    log
  } = config;

  // Handle transcription messages
  const handleTranscriptionMessage = useCallback((data: any) => {
    // Skip processing if transcription service isn't configured
    if (!managers.transcription.current) {
      log('Received unexpected transcription message but service is not configured:', data);
      return;
    }

    // Check if agent is in sleep mode
    const isSleepingOrEntering = agentState === 'sleeping' || agentState === 'entering_sleep';

    if (data.type === 'VADEvent') {
      const isSpeaking = data.is_speech;
      if (isSleepingOrEntering) {
        log('Ignoring VAD event (agent sleeping)', 'verbose');
        return;
      }

      if (isSpeaking && !userSpeakingRef.current) {
        userSpeakingRef.current = true;
        onUserStartedSpeaking?.();
      } else if (!isSpeaking && userSpeakingRef.current) {
        userSpeakingRef.current = false;
        onUserStoppedSpeaking?.();
      }
      return;
    }

    if (data.type === 'Results' || data.type === 'Transcript') {
      if (isSleepingOrEntering) {
        log('Ignoring transcript (agent sleeping)', 'verbose');
        return;
      }

      const transcript = data as TranscriptResponse;
      onTranscriptUpdate?.(transcript);
      return;
    }
  }, [agentState, userSpeakingRef, onTranscriptUpdate, onUserStartedSpeaking, onUserStoppedSpeaking, log]);

  // Handle agent messages
  const handleAgentMessage = useCallback((data: any) => {
    // Skip processing if agent service isn't configured
    if (!managers.agent.current) {
      log('Received unexpected agent message but service is not configured:', data);
      return;
    }

    const isSleepingOrEntering = agentState === 'sleeping' || agentState === 'entering_sleep';

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
      onUserStartedSpeaking?.();

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
        const response: LLMResponse = {
          type: 'llm',
          text: data.content || '',
          metadata: data,
        };

        onAgentUtterance?.(response);
        return;
      } else if (data.role === 'user') {
        const response = {
          type: 'user' as const,
          text: data.content || '',
          metadata: data,
        };

        onUserMessage?.(response);
        return;
      }
    }

    // Handle warnings
    if (data.type === 'Warning') {
      log(`Agent warning: ${data.description}, Code: ${data.code}`, 'verbose');
      return;
    }
  }, [agentState, isWaitingForUserVoiceAfterSleep, onAgentUtterance, onUserMessage, onUserStartedSpeaking, setAgentState, log]);

  // Handle agent audio
  const handleAgentAudio = useCallback((data: ArrayBuffer) => {
    // Skip processing if agent service isn't configured
    if (!managers.agent.current) {
      log('Received unexpected agent audio but service is not configured');
      return;
    }

    log(`Received agent audio buffer of ${data.byteLength} bytes`, 'verbose');

    // Skip audio playback if we're waiting for user voice after sleep
    if (isWaitingForUserVoiceAfterSleep.current) {
      log('Skipping audio playback (waiting for user voice after sleep)', 'verbose');
      return;
    }

    if (managers.audio.current) {
      managers.audio.current.queueAudio(data)
        .then(() => {
          log('Successfully queued audio buffer for playback', 'verbose');
        })
        .catch(error => {
          log(`Error queueing audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
        });
    } else {
      log('Cannot queue audio: audioManagerRef.current is null');
    }
  }, [isWaitingForUserVoiceAfterSleep, log]);

  return {
    handleTranscriptionMessage,
    handleAgentMessage,
    handleAgentAudio
  };
} 