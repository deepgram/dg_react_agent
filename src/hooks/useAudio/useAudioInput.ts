import { useCallback, useEffect, useRef, useState } from 'react';
import { MicrophoneManager } from '../../utils/audio/MicrophoneManager';
import { AudioError } from '../../types/common/error';
import { MICROPHONE_CONFIG } from '../../utils/shared/config';
import type { MicrophoneConfig } from '../../types/common/microphone';

interface UseAudioInputOptions {
  debug?: boolean;
  microphoneConfig?: Partial<MicrophoneConfig>;
  autoInitialize?: boolean; // New option to control automatic initialization
  onMicrophoneData?: (data: ArrayBuffer) => void;
  onMicrophoneStart?: () => void;
  onMicrophoneStop?: () => void;
  onError?: (error: AudioError) => void;
}

interface UseAudioInputReturn {
  initialize: () => Promise<void>; // New method for manual initialization
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  isRecording: boolean;
  isInitialized: boolean;
  error: AudioError | null;
}

/**
 * Hook for managing microphone input.
 * Handles initialization, recording, and cleanup of microphone resources.
 */
export function useAudioInput(options: UseAudioInputOptions = {}): UseAudioInputReturn {
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<AudioError | null>(null);
  const isCleaningUpRef = useRef(false);

  // Manager ref
  const microphoneRef = useRef<MicrophoneManager | null>(null);

  // Logging utility
  const log = useCallback((message: string) => {
    if (options.debug) {
      console.log(`[useAudioInput] ${message}`);
    }
  }, [options.debug]);

  // Initialize microphone
  const initialize = useCallback(async () => {
    if (isInitialized || isCleaningUpRef.current) {
      return;
    }

    try {
      // Create microphone manager with merged config
      microphoneRef.current = new MicrophoneManager(
        {
          ...MICROPHONE_CONFIG,
          ...options.microphoneConfig
        },
        {
          onAudioData: options.onMicrophoneData,
          onRecordingStart: () => {
            log('🎤 Microphone recording started');
            options.onMicrophoneStart?.();
          },
          onRecordingStop: () => {
            log('🎤 Microphone recording stopped');
            options.onMicrophoneStop?.();
          },
          onError: (error) => {
            const audioError = error instanceof AudioError ? error : new AudioError('Microphone error', {
              originalError: error
            });
            setError(audioError);
            options.onError?.(audioError);
          }
        }
      );

      // Initialize manager
      await microphoneRef.current.initialize();
      setIsInitialized(true);
      log('✅ Microphone initialized');
    } catch (error) {
      const audioError = error instanceof AudioError ? error : new AudioError('Failed to initialize microphone', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      setError(audioError);
      options.onError?.(audioError);
      throw audioError;
    }
  }, [options.debug, options.microphoneConfig, options.onMicrophoneData, options.onMicrophoneStart, options.onMicrophoneStop, options.onError, log, isInitialized]);

  // Auto-initialize if enabled
  useEffect(() => {
    if (options.autoInitialize) {
      initialize().catch(() => {}); // Errors are already handled in initialize
    }

    return () => {
      isCleaningUpRef.current = true;
      if (microphoneRef.current) {
        microphoneRef.current.cleanup();
        microphoneRef.current = null;
      }
      setIsInitialized(false);
      setError(null);
    };
  }, [options.autoInitialize, initialize]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      // Auto-initialize if not initialized
      if (!isInitialized) {
        await initialize();
      }

      if (!microphoneRef.current) {
        throw new AudioError('Microphone not initialized');
      }

      await microphoneRef.current.startRecording();
      log('✅ Recording started');
    } catch (error) {
      const audioError = error instanceof AudioError ? error : new AudioError('Failed to start recording', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      setError(audioError);
      options.onError?.(audioError);
      throw audioError;
    }
  }, [initialize, isInitialized, options.onError, log]);

  // Stop recording
  const stopRecording = useCallback(() => {
    try {
      microphoneRef.current?.stopRecording();
      log('✅ Recording stopped');
    } catch (error) {
      const audioError = error instanceof AudioError ? error : new AudioError('Failed to stop recording', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      setError(audioError);
      options.onError?.(audioError);
    }
  }, [options.onError, log]);

  return {
    initialize,
    startRecording,
    stopRecording,
    isRecording: microphoneRef.current?.isRecording() || false,
    isInitialized,
    error
  };
} 