import { useCallback, useMemo } from 'react';
import { useAudioManager, UseAudioManagerOptions } from './useAudioManager';
import { AudioOutputManager, AudioOutputEventHandlers } from '../../utils/audio/AudioOutputManager';
import { AudioError } from '../../types/common/error';

export interface UseAudioOutputOptions extends UseAudioManagerOptions {
  enableVolumeControl?: boolean;
  initialVolume?: number;
  onAudioStart?: AudioOutputEventHandlers['onAudioStart'];
  onAudioEnd?: AudioOutputEventHandlers['onAudioEnd'];
}

export interface UseAudioOutputReturn {
  queueAudio: (data: ArrayBuffer) => Promise<void>;
  stop: () => void;
  clearAudioQueue: () => void;
  isPlaying: boolean;
  isInitialized: boolean;
  error: AudioError | null;
}

export function useAudioOutput(options: UseAudioOutputOptions = {}): UseAudioOutputReturn {
  // Create audio manager instance
  const manager = useMemo(() => new AudioOutputManager(
    {
      debug: options.debug,
      enableVolumeControl: options.enableVolumeControl,
      initialVolume: options.initialVolume
    },
    {
      onError: options.onError,
      onAudioStart: options.onAudioStart,
      onAudioEnd: options.onAudioEnd
    }
  ), [
    options.debug,
    options.enableVolumeControl,
    options.initialVolume,
    options.onError,
    options.onAudioStart,
    options.onAudioEnd
  ]);

  // Use base audio manager hook
  const {
    isInitialized,
    error,
    initialize
  } = useAudioManager(manager, {
    debug: options.debug,
    onError: options.onError
  });

  // Audio playback methods
  const queueAudio = useCallback(async (data: ArrayBuffer) => {
    if (!isInitialized) {
      await initialize();
    }
    await manager.queueAudio(data);
  }, [isInitialized, initialize, manager]);

  const stop = useCallback(() => {
    manager.stop();
  }, [manager]);

  const clearAudioQueue = useCallback(() => {
    manager.clearAudioQueue();
  }, [manager]);

  return {
    queueAudio,
    stop,
    clearAudioQueue,
    isPlaying: manager.getIsPlaying(),
    isInitialized,
    error
  };
} 