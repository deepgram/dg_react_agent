import { useCallback } from 'react';
import { VoiceWebSocketManager } from '../../utils/websocket/VoiceWebSocketManager';
import { AudioOutputManager } from '../../utils/audio/AudioOutputManager';
import { AgentState, TranscriptResponse, LLMResponse, UserMessageResponse } from '../../types/voice';

interface UseMessageHandlingOptions {
  agentState: AgentState;
  isWaitingForUserVoiceAfterSleep: { current: boolean };
  userSpeakingRef: { current: boolean };
  onTranscriptUpdate?: (transcript: TranscriptResponse) => void;
  onAgentUtterance?: (response: LLMResponse) => void;
  onUserMessage?: (message: UserMessageResponse) => void;
  onUserStartedSpeaking?: () => void;
  onUserStoppedSpeaking?: () => void;
  setAgentState: (state: AgentState) => void;
  debug?: boolean;
}

interface UseMessageHandlingReturn {
  handleTranscriptionMessage: (message: any) => void;
  handleAgentMessage: (message: any) => void;
  handleAgentAudio: (data: ArrayBuffer) => void;
}

export function useMessageHandling(
  options: UseMessageHandlingOptions,
  managers: {
    transcription: React.RefObject<VoiceWebSocketManager>;
    agent: React.RefObject<VoiceWebSocketManager>;
    audio: React.RefObject<AudioOutputManager>;
  }
): UseMessageHandlingReturn {
  const log = useCallback((message: string) => {
    if (options.debug) {
      console.log(`[MessageHandling] ${message}`);
    }
  }, [options.debug]);

  // Handle transcription messages
  const handleTranscriptionMessage = useCallback((message: any) => {
    try {
      if (!message.channel?.alternatives?.[0]?.transcript) {
        return;
      }

      const transcript = message.channel.alternatives[0].transcript;
      const isFinal = message.is_final;

      // Track user speaking state
      if (!options.userSpeakingRef.current && transcript.trim().length > 0) {
        options.userSpeakingRef.current = true;
        options.onUserStartedSpeaking?.();
      } else if (options.userSpeakingRef.current && isFinal) {
        options.userSpeakingRef.current = false;
        options.onUserStoppedSpeaking?.();
      }

      // Handle sleep mode
      if (options.isWaitingForUserVoiceAfterSleep.current && transcript.trim().length > 0) {
        options.isWaitingForUserVoiceAfterSleep.current = false;
        options.setAgentState('sleeping');
      }

      // Notify transcript update
      options.onTranscriptUpdate?.({
        type: 'transcript',
        channel: {
          alternatives: [{
            transcript,
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

    } catch (error) {
      log(`Error handling transcription message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [options, log]);

  // Handle agent messages
  const handleAgentMessage = useCallback((message: any) => {
    try {
      switch (message.type) {
        case 'Welcome':
          log('Agent welcomed connection');
          break;

        case 'SettingsApplied':
          log('Agent settings applied successfully');
          break;

        case 'AgentResponse':
          options.onAgentUtterance?.({
            type: 'llm',
            text: message.text,
            metadata: message.metadata
          });
          break;

        case 'UserMessage':
          options.onUserMessage?.({
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
          log(`Agent error: ${message.description} (${message.code})`);
          break;

        case 'Warning':
          log(`Agent warning: ${message.description} (${message.code})`);
          break;

        default:
          log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      log(`Error handling agent message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [options, log]);

  // Handle agent audio
  const handleAgentAudio = useCallback(async (data: ArrayBuffer) => {
    try {
      if (!managers.audio.current) {
        throw new Error('Audio manager not initialized');
      }

      await managers.audio.current.queueAudio(data);
    } catch (error) {
      log(`Error handling agent audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [managers.audio, log]);

  return {
    handleTranscriptionMessage,
    handleAgentMessage,
    handleAgentAudio
  };
} 