import { useCallback } from 'react';
import { VoiceWebSocketManager } from '../../../../utils/websocket/VoiceWebSocketManager';
import { AudioManager } from '../../../../utils/audio/AudioManager';
import { AUDIO_CONFIG, MODEL_CONFIG } from '../../../../utils/shared/config';
import { AgentOptions } from '../../../../types/voice';

interface ConnectionManagerConfig {
  apiKey: string;
  transcriptionUrl: string;
  agentUrl: string;
  transcriptionOptions?: Record<string, any>;
  agentOptions?: AgentOptions;
  log: (message: string, level?: 'hook' | 'manager' | 'verbose') => void;
}

export function useConnectionManager(
  config: ConnectionManagerConfig,
  managers: {
    transcription: React.RefObject<VoiceWebSocketManager>;
    agent: React.RefObject<VoiceWebSocketManager>;
    audio: React.RefObject<AudioManager>;
  }
) {
  const {
    agentOptions,
    log
  } = config;

  // Send agent settings
  const sendAgentSettings = useCallback(() => {
    if (!managers.agent.current || !agentOptions) return;

    const settings = {
      type: 'Settings',
      audio: {
        input: {
          encoding: AUDIO_CONFIG.encoding,
          sample_rate: AUDIO_CONFIG.sampleRate,
        },
        output: {
          encoding: AUDIO_CONFIG.encoding,
          sample_rate: AUDIO_CONFIG.sampleRate,
        },
      },
      agent: {
        language: agentOptions.language || 'en',
        listen: {
          provider: {
            type: 'deepgram',
            model: agentOptions.listenModel || MODEL_CONFIG.agent.listen,
          },
        },
        think: {
          provider: {
            type: agentOptions.thinkProviderType || 'open_ai',
            model: agentOptions.thinkModel || MODEL_CONFIG.agent.think,
          },
          prompt: agentOptions.instructions || 'You are a helpful voice assistant.',
          ...(agentOptions.thinkEndpointUrl && agentOptions.thinkApiKey
            ? {
                endpoint: {
                  url: agentOptions.thinkEndpointUrl,
                  headers: {
                    authorization: `bearer ${agentOptions.thinkApiKey}`,
                  },
                },
              }
            : {}),
        },
        speak: {
          provider: {
            type: 'deepgram',
            model: agentOptions.voice || MODEL_CONFIG.agent.speak,
          },
        },
        greeting: agentOptions.greeting,
      },
    };

    managers.agent.current.sendJSON(settings);
  }, [agentOptions]);

  // Start the connection
  const start = useCallback(async (): Promise<void> => {
    try {
      log('▶️ Starting voice interaction...');

      // Connect transcription WebSocket if configured
      if (managers.transcription.current) {
        log('Connecting transcription WebSocket...');
        await managers.transcription.current.connect();
        log('Transcription WebSocket connected');
      }

      // Connect agent WebSocket if configured
      if (managers.agent.current) {
        log('Connecting agent WebSocket...');
        await managers.agent.current.connect();
        log('Agent WebSocket connected');
      }

      // Start recording if audio manager is available
      if (managers.audio.current) {
        log('Starting recording...');
        await managers.audio.current.startRecording();
        log('Recording started');
      } else {
        throw new Error('Audio manager not available');
      }

      log('✅ Voice interaction started successfully');
    } catch (error) {
      log(`❌ Error starting voice interaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, [log]);

  // Stop the connection
  const stop = useCallback(async (): Promise<void> => {
    try {
      log('⏹️ Stopping voice interaction...');

      // Send CloseStream message to finalize any pending transcriptions
      if (managers.transcription.current) {
        log('Sending CloseStream message to finalize transcription');
        managers.transcription.current.sendCloseStream();
      }

      // Stop recording
      if (managers.audio.current) {
        managers.audio.current.stopRecording();
      }

      // Add a small delay to allow final transcripts to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Close WebSocket connections
      if (managers.transcription.current) {
        managers.transcription.current.close();
      }

      if (managers.agent.current) {
        managers.agent.current.close();
      }

      log('✅ Voice interaction stopped');
    } catch (error) {
      log(`❌ Error stopping voice interaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, [log]);

  return {
    sendAgentSettings,
    start,
    stop
  };
} 