import { useCallback, useEffect, useRef, useState } from 'react';
import { BaseAudioManager } from '../../utils/shared/BaseAudioManager';
import { AudioError } from '../../types/common/error';

export interface UseAudioManagerOptions {
  debug?: boolean;
  onError?: (error: AudioError) => void;
}

export interface UseAudioManagerReturn {
  initialize: () => Promise<void>;
  cleanup: () => void;
  isInitialized: boolean;
  error: AudioError | null;
}

export function useAudioManager(
  manager: BaseAudioManager | null,
  options: UseAudioManagerOptions = {}
): UseAudioManagerReturn {
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<AudioError | null>(null);

  // Cleanup tracking
  const isCleaningUpRef = useRef(false);

  // Error handler
  const handleError = useCallback((error: AudioError) => {
    setError(error);
    options.onError?.(error);
  }, [options.onError]);

  // Initialize method
  const initialize = useCallback(async () => {
    if (!manager) {
      handleError({
        name: 'AudioError',
        message: 'Audio manager not provided',
        type: 'audio',
        code: 'MANAGER_NOT_INITIALIZED'
      });
      return;
    }

    try {
      await manager.initialize();
      setIsInitialized(true);
    } catch (error) {
      handleError(error as AudioError);
    }
  }, [manager, handleError]);

  // Cleanup method
  const cleanup = useCallback(() => {
    if (!manager) return;

    try {
      manager.cleanup();
      setIsInitialized(false);
    } catch (error) {
      handleError(error as AudioError);
    }
  }, [manager, handleError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!isCleaningUpRef.current && manager) {
        isCleaningUpRef.current = true;
        cleanup();
      }
    };
  }, [manager, cleanup]);

  return {
    initialize,
    cleanup,
    isInitialized,
    error
  };
} 