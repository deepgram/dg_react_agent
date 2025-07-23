import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { TTSMetrics, TTSError, DebugLevel } from '../../../types/tts';
import { ConnectionState } from '../../../types/common/connection';
import { BaseWebSocketManager } from '../../../utils/shared/BaseWebSocketManager';
import { MessageHandler } from '../../../utils/tts/messageHandler';
import { ProtocolHandler } from '../../../utils/tts/protocolHandler';
import { AudioOutputManager } from '../../../utils/audio/AudioOutputManager';
import { MetricsCollector } from '../../../utils/tts/metricsCollector';
import { TTSWebSocketManager } from '../../../utils/websocket/TTSWebSocketManager';
import { AudioError } from '../../../types/common/error';
import { splitIntoChunks } from '../../../utils/tts/TextChunker';
import {
  AUDIO_CONFIG,
  WEBSOCKET_CONFIG,
  MODEL_CONFIG,
  METRICS_CONFIG,
  mergeConfig,
  BaseComponentConfig
} from '../../../utils/shared/config';

interface TTSConfig extends BaseComponentConfig {
  enableTextChunking?: boolean;
  maxChunkSize?: number;
  model?: string;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (error: TTSError) => void;
  onMetrics?: (metrics: TTSMetrics) => void;
}

const DEFAULT_TTS_CONFIG: TTSConfig = {
  debug: 'hook',
  enableMetrics: METRICS_CONFIG.enableByDefault,
  enableTextChunking: false,
  maxChunkSize: METRICS_CONFIG.chunkSizeLimit,
  model: MODEL_CONFIG.tts.default
};

interface UseDeepgramTTSReturn {
  speak: (text: string) => Promise<void>;
  streamText: (text: string) => Promise<void>;
  flushStream: () => Promise<void>;
  stop: () => void;
  clear: () => Promise<void>;
  disconnect: () => void;
  isPlaying: boolean;
  isConnected: boolean;
  isReady: boolean;
  isLoading: boolean;
  error: TTSError | null;
  metrics: TTSMetrics | null;
}

// Message Types
type DeepgramMessage = {
  type: string;
  [key: string]: any;
};

export function useDeepgramTTS(
  apiKey: string,
  options: TTSConfig = { debug: 'verbose' }
): UseDeepgramTTSReturn {
  // Merge configuration with defaults
  const config = useMemo(() => mergeConfig(DEFAULT_TTS_CONFIG, options), [options]);

  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<TTSError | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metrics, setMetrics] = useState<TTSMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Cleanup state tracking
  const isCleaningUpRef = useRef(false);

  // Refs for managers (prevent recreating on every render)
  const websocketManagerRef = useRef<BaseWebSocketManager | null>(null);
  const messageHandlerRef = useRef<MessageHandler | null>(null);
  const protocolHandlerRef = useRef<ProtocolHandler | null>(null);
  const audioManagerRef = useRef<AudioOutputManager | null>(null);
  const metricsCollectorRef = useRef<MetricsCollector | null>(null);

  // Smart debug level processing
  const debugConfig = useMemo(() => {
    const config = {
      level: 'off' as DebugLevel,
      hookDebug: false,
      managerDebug: false
    };
    
    const debugOption = options.debug;
    switch (debugOption) {
      case true:
      case 'hook':
        return { ...config, level: 'hook', hookDebug: true };
      case 'manager':
        return { ...config, level: 'manager', hookDebug: true, managerDebug: true };
      case 'verbose':
        return { ...config, level: 'verbose', hookDebug: true, managerDebug: true };
      default:
        return config;
    }
  }, [options.debug]);

  // Centralized logging function
  const log = useCallback((message: string, level: 'hook' | 'manager' | 'verbose' = 'hook') => {
    if (debugConfig.level === 'off') return;
    
    if (level === 'hook' && debugConfig.hookDebug) {
      console.log(`[DeepgramTTS] ${message}`);
    } else if (level === 'manager' && debugConfig.level === 'manager') {
      console.log(`[DeepgramTTS:Manager] ${message}`);
    } else if (level === 'verbose' && debugConfig.level === 'verbose') {
      console.log(`[DeepgramTTS:Verbose] ${message}`);
    }
  }, [debugConfig]);

  // Memoized options to prevent unnecessary re-initializations
  const memoizedOptions = useMemo(() => ({
    enableMetrics: config.enableMetrics,
    enableTextChunking: config.enableTextChunking,
    maxChunkSize: config.maxChunkSize,
    debugConfig,
    onConnectionChange: config.onConnectionChange,
    onError: config.onError,
    onMetrics: config.onMetrics
  }), [
    config.enableMetrics,
    config.enableTextChunking,
    config.maxChunkSize,
    config.onConnectionChange,
    config.onError,
    config.onMetrics,
    debugConfig
  ]);

  // Utility function to handle operation errors
  const handleOperationError = useCallback((error: unknown, operation: string) => {
    const ttsError = error as TTSError;
    log(`❌ ${operation} failed: ${ttsError.message}`);
    setError(ttsError);
    memoizedOptions.onError?.(ttsError);
    throw ttsError;
  }, [log, memoizedOptions.onError]);

  // Initialize protocol handler
  const initializeProtocolHandler = useCallback(() => {
    protocolHandlerRef.current = new ProtocolHandler({
      debug: memoizedOptions.debugConfig.managerDebug,
      enableTextChunking: config.enableTextChunking,
      maxChunkSize: config.maxChunkSize
    });
  }, [memoizedOptions.debugConfig.managerDebug, config.enableTextChunking, config.maxChunkSize]);

  // Utility function to send WebSocket messages
  const sendWebSocketMessage = useCallback((createMessage: () => DeepgramMessage | undefined | null) => {
    try {
      const message = createMessage();
      
      if (!message) {
        log('❌ Failed to create message - createMessage returned null/undefined');
        return false;
      }

      if (!websocketManagerRef.current) {
        log('❌ Failed to send message - WebSocket manager is not initialized');
        return false;
      }

      if (websocketManagerRef.current.getState() !== 'connected') {
        log(`❌ Failed to send message - WebSocket is not connected (state: ${websocketManagerRef.current.getState()})`);
        return false;
      }

      websocketManagerRef.current.sendMessage(message);
      return true;
    } catch (error) {
      log(`❌ Error in sendWebSocketMessage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [log]);

  // Utility function to ensure the system is ready
  const ensureReady = useCallback(() => {
    if (!isReady) {
      throw new Error('TTS is not ready');
    }
  }, [isReady]);

  // Utility function to clean up resources
  const cleanupResources = useCallback(() => {
    // Prevent duplicate cleanups
    if (isCleaningUpRef.current) {
      log('🔄 Cleanup already in progress, skipping', 'verbose');
      return;
    }

    isCleaningUpRef.current = true;
    log('🧹 Cleaning up TTS resources', 'verbose');
    
    // Stop and clean audio
    if (audioManagerRef.current) {
      audioManagerRef.current.stop();
      audioManagerRef.current.clearAudioQueue();
      audioManagerRef.current.cleanup();
      audioManagerRef.current = null;
    }
    
    // Clean up WebSocket
    if (websocketManagerRef.current) {
      websocketManagerRef.current.cleanup();
      websocketManagerRef.current = null;
    }

    // Clean up other managers
    if (metricsCollectorRef.current) {
      metricsCollectorRef.current.reset();
      metricsCollectorRef.current = null;
    }

    messageHandlerRef.current = null;
    protocolHandlerRef.current = null;
    
    // Reset state
    setIsConnected(false);
    setIsReady(false);
    setError(null);
    setIsPlaying(false);
    setMetrics(null);
    
    log('✅ TTS system cleaned up');
    
    // Reset cleanup state after a short delay to allow for any pending cleanup operations
    setTimeout(() => {
      isCleaningUpRef.current = false;
    }, 100);
  }, [log]);

  // Initialize metrics collector
  const initializeMetrics = useCallback(() => {
    metricsCollectorRef.current = new MetricsCollector({
      debug: memoizedOptions.debugConfig.managerDebug
    });
  }, [memoizedOptions.debugConfig.managerDebug]);

  // Initialize message handler
  const initializeMessageHandler = useCallback(() => {
    messageHandlerRef.current = new MessageHandler({
      debug: true,
      onAudioChunk: (chunk) => {
        if (metricsCollectorRef.current) {
          metricsCollectorRef.current.markFirstByte();
          metricsCollectorRef.current.addChunk(chunk.data.byteLength);
        }

        audioManagerRef.current?.queueAudio(chunk.data);
      },
      onComplete: () => {
        log('✅ Audio stream complete');
      },
      onError: (error) => {
        handleOperationError(error, 'Message handler');
      }
    });
  }, [log, handleOperationError]);

  // Initialize WebSocket manager
  const initializeWebSocket = useCallback(() => {
    websocketManagerRef.current = new TTSWebSocketManager({
      apiKey,
      debug: memoizedOptions.debugConfig.managerDebug,
      maxReconnectAttempts: WEBSOCKET_CONFIG.maxReconnectAttempts,
      reconnectDelay: WEBSOCKET_CONFIG.reconnectDelay,
      model: config.model || MODEL_CONFIG.tts.default,
      encoding: AUDIO_CONFIG.encoding,
      sampleRate: AUDIO_CONFIG.sampleRate
    }, {
      onOpen: () => {
        log('🔗 Connected to Deepgram TTS');
      },
      onMessage: (data) => {
        messageHandlerRef.current?.handleMessage(data);
      },
      onClose: () => {
        log('🔌 Disconnected from Deepgram TTS');
        setIsConnected(false);
      },
      onError: (error) => {
        handleOperationError(error, 'WebSocket connection');
      },
      onConnectionStateChange: (state) => {
        const stateEmojis: Record<ConnectionState, string> = {
          'disconnected': '⚫',
          'connecting': '🟡', 
          'connected': '🟢',
          'error': '🔴',
          'closed': '⚪'
        };
        log(`${stateEmojis[state]} Connection: ${state}`);
        
        setIsConnected(state === 'connected');
        memoizedOptions.onConnectionChange?.(state === 'connected');
      }
    });
  }, [apiKey, memoizedOptions.debugConfig.managerDebug, config.model]);

  // Initialize audio manager
  const initializeAudio = useCallback(async () => {
    const audioOptions = {
      debug: false,
      enableVolumeControl: true,
      initialVolume: 1.0
    };

    const audioHandlers = {
      onAudioStart: () => {
        setIsPlaying(true);
        if (metricsCollectorRef.current) {
          metricsCollectorRef.current.markFirstAudio();
        }
      },
      onAudioEnd: () => {
        setIsPlaying(false);
      },
      onError: (error: AudioError) => handleOperationError(error, 'Audio system')
    };

    audioManagerRef.current = new AudioOutputManager(audioOptions, audioHandlers);
    await audioManagerRef.current.initialize();
  }, [handleOperationError]);

  // Initialize TTS system
  useEffect(() => {
    isCleaningUpRef.current = false;

    if (!apiKey || apiKey.trim() === '') {
      log('No API key provided, skipping initialization');
      return;
    }

    const initialize = async () => {
      try {
        log('🚀 Initializing Deepgram TTS...');

        initializeMetrics();
        initializeMessageHandler();
        initializeProtocolHandler();
        initializeWebSocket();
        await initializeAudio();

        // Connect WebSocket
        websocketManagerRef.current?.connect();

        // Start metrics collection
        if (memoizedOptions.enableMetrics) {
          metricsCollectorRef.current?.start();
        }

        setIsReady(true);
        log('✅ Deepgram TTS ready!');
      } catch (error) {
        handleOperationError(error, 'Initialization');
      }
    };

    initialize();

    return () => {
      if (!isCleaningUpRef.current) {
        cleanupResources();
      }
    };
  }, [
    apiKey,
    log,
    memoizedOptions.enableMetrics,
    initializeMetrics,
    initializeMessageHandler,
    initializeProtocolHandler,
    initializeWebSocket,
    initializeAudio,
    cleanupResources,
    handleOperationError
  ]);

  // Speak text
  const speak = useCallback(async (text: string): Promise<void> => {
    ensureReady();

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    if (text.length > 100000) {
      throw new Error('Text is too long. Maximum length is 100,000 characters.');
    }

    try {
      setIsLoading(true);
      const chunks = splitIntoChunks(text);
      log(`🗣️ Speaking text in ${chunks.length} chunks (${text.length} total characters)`);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        if (metricsCollectorRef.current) {
          metricsCollectorRef.current.start();
        }

        // Send speak message
        const speakSuccess = sendWebSocketMessage(() => protocolHandlerRef.current?.createSpeakMessage(chunk));
        if (!speakSuccess) {
          throw new Error('Failed to send speak message');
        }

        // Send flush message
        const flushSuccess = sendWebSocketMessage(() => protocolHandlerRef.current?.createFlushMessage());
        if (!flushSuccess) {
          throw new Error('Failed to send flush message');
        }

        // Wait for this chunk to complete before sending the next
        await new Promise<void>((resolve) => {
          messageHandlerRef.current?.setOnComplete(() => {
            resolve();
          });
        });

        // If there are more chunks, wait 2 seconds before processing the next one
        // With 250-char chunks at 30 chars/second target rate:
        // - Each chunk takes ~8.33 seconds to "use up"
        // - Queue next chunk after 2 seconds to ensure overlap
        if (i < chunks.length - 1) {
          log(`⏳ Queueing next chunk in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      handleOperationError(error, 'Speak');
    } finally {
      setIsLoading(false);
    }
  }, [ensureReady, log, metricsCollectorRef, sendWebSocketMessage, handleOperationError]);

  // Stream text (for LLM streaming)
  const streamText = useCallback(async (text: string): Promise<void> => {
    ensureReady();

    if (!text || text.trim().length === 0) {
      return;
    }

    try {
      log(`📝 Streaming text: "${text.substring(0, 30)}..."`, 'verbose');
      sendWebSocketMessage(() => protocolHandlerRef.current?.createSpeakMessage(text));
    } catch (error) {
      handleOperationError(error, 'Stream');
    }
  }, [ensureReady, log, sendWebSocketMessage, handleOperationError]);

  // Flush stream
  const flushStream = useCallback(async (): Promise<void> => {
    ensureReady();

    try {
      log('🚿 Flushing stream', 'verbose');
      sendWebSocketMessage(() => protocolHandlerRef.current?.createFlushMessage());
    } catch (error) {
      handleOperationError(error, 'Flush');
    }
  }, [ensureReady, log, sendWebSocketMessage, handleOperationError]);

  // Clear audio
  const clear = useCallback(async (): Promise<void> => {
    ensureReady();

    try {
      log('🧹 Clearing audio queue');
      sendWebSocketMessage(() => protocolHandlerRef.current?.createClearMessage());
      audioManagerRef.current?.clearAudioQueue();
    } catch (error) {
      handleOperationError(error, 'Clear');
    }
  }, [ensureReady, log, sendWebSocketMessage, handleOperationError]);

  // Stop playback
  const stop = useCallback((): void => {
    log('⏹️ Stopping playback', 'verbose');
    audioManagerRef.current?.stop();
    metricsCollectorRef.current?.reset();
    setIsPlaying(false);
  }, [log]);

  // Disconnect and cleanup
  const disconnect = useCallback((): void => {
    log('🔌 Disconnecting TTS system');
    if (!isCleaningUpRef.current) {
      cleanupResources();
    }
  }, [log, cleanupResources]);

  return {
    speak,
    streamText,
    flushStream,
    stop,
    clear,
    disconnect,
    isPlaying,
    isConnected,
    isReady,
    isLoading,
    error,
    metrics
  };
} 