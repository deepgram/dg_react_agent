"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
} from "react";

import { AudioManager, AudioEvent, AudioManagerOptions } from "../utils/audio/AudioManager";
import type { DeepgramError } from "../types/connection";

/**
 * Context value for AudioContext
 */
interface AudioContextValue {
  // Core audio objects
  audioManager: AudioManager | null;
  
  // State
  isInitialized: boolean;
  isRecording: boolean;
  isPlaying: boolean;
  
  // Methods
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  queueAudio: (data: ArrayBuffer) => Promise<void>;
  clearAudioQueue: () => void;

  // Event handler registration
  addEventListener: (callback: (event: AudioEvent) => void) => () => void;
}

// Create the context with undefined default
const AudioProviderContext = createContext<AudioContextValue | undefined>(undefined);

/**
 * Properties for the AudioProvider
 */
interface AudioProviderProps {
  children: ReactNode;
  options?: Partial<AudioManagerOptions>;
  onError?: (error: DeepgramError) => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  debug?: boolean;
}

/**
 * Provider component for audio management
 */
export function AudioProvider({
  children,
  options,
  onError,
  onPlaybackStateChange,
  debug = false,
}: AudioProviderProps) {
  // Audio manager reference
  const [audioManager, setAudioManager] = useState<AudioManager | null>(null);
  
  // State tracking
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Event listeners
  const eventListeners = useRef<Array<(event: AudioEvent) => void>>([]);
  
  // Create the audio manager on mount
  useEffect(() => {
    const manager = new AudioManager({
      debug,
      ...options,
    });
    
    // Set up event handling
    const removeListener = manager.addEventListener((event) => {
      // Handle state changes
      if (event.type === "ready") {
        setIsInitialized(true);
      } else if (event.type === "recording") {
        setIsRecording(event.isRecording);
      } else if (event.type === "playing") {
        setIsPlaying(event.isPlaying);
        
        if (onPlaybackStateChange) {
          onPlaybackStateChange(event.isPlaying);
        }
      } else if (event.type === "error" && onError) {
        onError(event.error);
      }
      
      // Dispatch event to all registered listeners
      eventListeners.current.forEach(listener => {
        try {
          listener(event);
        } catch (err) {
          console.error("Error in audio event listener:", err);
        }
      });
    });
    
    setAudioManager(manager);
    
    // Clean up
    return () => {
      removeListener();
      manager.dispose();
      setAudioManager(null);
      setIsInitialized(false);
    };
  }, [debug, options, onPlaybackStateChange, onError]);
  
  // Initialize manager when needed
  const ensureInitialized = useCallback(async () => {
    if (!audioManager) {
      throw new Error("AudioManager not available");
    }
    
    if (!isInitialized) {
      await audioManager.initialize();
      setIsInitialized(true);
    }
  }, [audioManager, isInitialized]);
  
  // Start recording
  const startRecording = useCallback(async () => {
    if (!audioManager) return;
    
    try {
      await ensureInitialized();
      await audioManager.startRecording();
    } catch (error) {
      console.error("Failed to start recording:", error);
      
      if (onError) {
        onError({
          service: "transcription",
          code: "recording_error",
          message: "Failed to start recording",
          details: error,
        });
      }
    }
  }, [audioManager, ensureInitialized, onError]);
  
  // Stop recording
  const stopRecording = useCallback(() => {
    if (audioManager && isRecording) {
      audioManager.stopRecording();
    }
  }, [audioManager, isRecording]);
  
  // Queue audio for playback
  const queueAudio = useCallback(async (data: ArrayBuffer) => {
    if (!audioManager) return;
    
    try {
      await ensureInitialized();
      await audioManager.queueAudio(data);
    } catch (error) {
      console.error("Failed to queue audio:", error);
      
      if (onError) {
        onError({
          service: "agent",
          code: "audio_playback_error",
          message: "Failed to queue audio for playback",
          details: error,
        });
      }
    }
  }, [audioManager, ensureInitialized, onError]);
  
  // Clear audio queue
  const clearAudioQueue = useCallback(() => {
    if (audioManager) {
      audioManager.clearAudioQueue();
    }
  }, [audioManager]);
  
  // Register event listener
  const addEventListener = useCallback((callback: (event: AudioEvent) => void) => {
    eventListeners.current.push(callback);
    
    // Return cleanup function
    return () => {
      eventListeners.current = eventListeners.current.filter(cb => cb !== callback);
    };
  }, []);
  
  // Create the context value
  const contextValue = useMemo<AudioContextValue>(
    () => ({
      audioManager,
      isInitialized,
      isRecording,
      isPlaying,
      startRecording,
      stopRecording,
      queueAudio,
      clearAudioQueue,
      addEventListener,
    }),
    [
      audioManager,
      isInitialized,
      isRecording,
      isPlaying,
      startRecording,
      stopRecording,
      queueAudio,
      clearAudioQueue,
      addEventListener,
    ]
  );
  
  return (
    <AudioProviderContext.Provider value={contextValue}>
      {children}
    </AudioProviderContext.Provider>
  );
}

/**
 * Hook to use the audio context
 */
export function useAudio() {
  const context = useContext(AudioProviderContext);
  
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  
  return context;
} 