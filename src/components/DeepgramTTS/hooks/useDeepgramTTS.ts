import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { DeepgramTTSOptions, TTSMetrics, TTSError, DebugLevel } from '../../../types/tts';
import { ConnectionState } from '../../../types/common/connection';
import { WebSocketManager } from '../../../utils/websocket/WebSocketManager';
import { MessageHandler } from '../../../utils/tts/messageHandler';
import { ProtocolHandler } from '../../../utils/tts/protocolHandler';
import { AudioManager } from '../../../utils/audio/AudioManager';
import { MetricsCollector } from '../../../utils/tts/metricsCollector';
import { TTSWebSocketManager } from '../../../utils/websocket/TTSWebSocketManager';

interface UseDeepgramTTSReturn {
  speak: (text: string) => Promise<void>;
  streamText: (text: string) => Promise<void>;
  flushStream: () => Promise<void>;
  stop: () => void;
  clear: () => Promise<void>;
  isPlaying: boolean;
  isConnected: boolean;
  isReady: boolean;
  error: TTSError | null;
  metrics: TTSMetrics | null;
}

export function useDeepgramTTS(
  apiKey: string,
  options: DeepgramTTSOptions = {}
): UseDeepgramTTSReturn {
  // State management
  const [isPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<TTSError | null>(null);
  const [metrics] = useState<TTSMetrics | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Refs for managers (prevent recreating on every render)
  const websocketManagerRef = useRef<WebSocketManager | null>(null);
  const messageHandlerRef = useRef<MessageHandler | null>(null);
  const protocolHandlerRef = useRef<ProtocolHandler | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const metricsCollectorRef = useRef<MetricsCollector | null>(null);

  // Smart debug level processing
  const debugConfig = useMemo(() => {
    const debugOption = options.debug;
    
    if (debugOption === false || debugOption === 'off') {
      return { level: 'off' as DebugLevel, hookDebug: false, managerDebug: false };
    }
    
    if (debugOption === true || debugOption === 'hook') {
      return { level: 'hook' as DebugLevel, hookDebug: true, managerDebug: false };
    }
    
    if (debugOption === 'manager') {
      return { level: 'manager' as DebugLevel, hookDebug: true, managerDebug: true };
    }
    
    if (debugOption === 'verbose') {
      return { level: 'verbose' as DebugLevel, hookDebug: true, managerDebug: true };
    }
    
    return { level: 'off' as DebugLevel, hookDebug: false, managerDebug: false };
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
    enableMetrics: options.enableMetrics,
    enableTextChunking: options.enableTextChunking,
    maxChunkSize: options.maxChunkSize,
    debugConfig,
    onConnectionChange: options.onConnectionChange,
    onError: options.onError,
    onMetrics: options.onMetrics
  }), [
    options.enableMetrics,
    options.enableTextChunking,
    options.maxChunkSize,
    debugConfig,
    options.onConnectionChange,
    options.onError,
    options.onMetrics
  ]);

  // Initialize TTS system
  useEffect(() => {
    // Safety check: Don't initialize if no API key
    if (!apiKey || apiKey.trim() === '') {
      log('No API key provided, skipping initialization');
      return;
    }

    let cleanup: (() => void) | undefined;

    const initialize = async () => {
      try {
        log('🚀 Initializing Deepgram TTS...');

        // Initialize metrics collector
        metricsCollectorRef.current = new MetricsCollector({
          debug: memoizedOptions.debugConfig.managerDebug
        });

        // Initialize message handler
        messageHandlerRef.current = new MessageHandler({
          debug: memoizedOptions.debugConfig.managerDebug
        }, {
          onAudioData: (chunk) => {
            log(`📦 Audio chunk received: ${chunk.data.byteLength} bytes`, 'verbose');

            // Record metrics
            if (metricsCollectorRef.current) {
              metricsCollectorRef.current.markFirstByte();
              metricsCollectorRef.current.addChunk(chunk.data.byteLength);
            }

            // Queue audio for playback
            audioManagerRef.current?.queueAudio(chunk.data);
          },
          onMetadata: (metadata) => {
            log('📋 Metadata received', 'hook');
            log(`📋 Metadata details: ${JSON.stringify(metadata)}`, 'verbose');
          },
          onFlushed: () => {
            log('✅ Audio stream flushed', 'verbose');
          },
          onCleared: () => {
            log('🧹 Audio queue cleared', 'verbose');
          },
          onError: (error) => {
            log(`❌ Message handler error: ${error.message}`);
            setError(error);
            memoizedOptions.onError?.(error);
          }
        });

        // Initialize protocol handler
        protocolHandlerRef.current = new ProtocolHandler({
          debug: memoizedOptions.debugConfig.managerDebug,
          enableTextChunking: memoizedOptions.enableTextChunking,
          maxChunkSize: memoizedOptions.maxChunkSize
        });

        // Initialize WebSocket manager
        websocketManagerRef.current = new TTSWebSocketManager({
          apiKey,
          debug: memoizedOptions.debugConfig.managerDebug,
          maxReconnectAttempts: 0,
          reconnectDelay: 1000,
          model: 'aura-2-thalia-en',
          encoding: 'linear16',
          sampleRate: 48000
        }, {
          onOpen: () => {
            log('🔗 Connected to Deepgram TTS');
          },
          onMessage: (data) => {
            messageHandlerRef.current?.handleMessage(data);
          },
          onClose: () => {
            log('🔌 Disconnected from Deepgram TTS');
          },
          onError: (error) => {
            log(`❌ Connection error: ${error.message}`);
            setError(error);
            memoizedOptions.onError?.(error);
          },
          onConnectionStateChange: (state) => {
            // Only update state if it actually changed
            setConnectionState(prevState => {
              if (prevState !== state) {
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
                return state;
              }
              return prevState;
            });
          }
        });

        // Initialize audio manager
        audioManagerRef.current = new AudioManager({
          debug: memoizedOptions.debugConfig.managerDebug
        });

        // Set up audio event handlers
        const unsubscribe = audioManagerRef.current.addEventListener(event => {
          if (event.type === 'ready') {
            log('🔊 Audio system ready');
          } else if (event.type === 'playing') {
            log('▶️ Audio playback started', 'verbose');
            if (metricsCollectorRef.current) {
              metricsCollectorRef.current.markFirstAudio();
            }
          } else if (event.type === 'error' && event.error) {
            log(`❌ Audio error: ${event.error.message}`);
            setError(event.error);
            memoizedOptions.onError?.(event.error);
          }
        });

        cleanup = () => {
          log('🧹 Cleaning up TTS resources', 'verbose');
          unsubscribe();
          audioManagerRef.current?.cleanup();
          websocketManagerRef.current?.cleanup();
        };

        // Initialize audio manager
        await audioManagerRef.current.initialize();

        // Connect WebSocket
        websocketManagerRef.current.connect();

        // Start metrics collection
        if (memoizedOptions.enableMetrics) {
          metricsCollectorRef.current?.start();
        }

        // Set ready state
        setIsReady(true);
        log('✅ Deepgram TTS ready!');
      } catch (error) {
        const ttsError = error as TTSError;
        log(`❌ Initialization failed: ${ttsError.message}`);
        setError(ttsError);
        memoizedOptions.onError?.(ttsError);
      }
    };

    initialize();

    return () => {
      cleanup?.();
    };
  }, [apiKey, memoizedOptions.debugConfig.level, memoizedOptions.enableMetrics, log, memoizedOptions]);

  // Speak text
  const speak = useCallback(async (text: string): Promise<void> => {
    if (!isReady) {
      throw new Error('TTS is not ready');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    try {
      log(`🗣️ Speaking: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

      // Start metrics collection
      if (memoizedOptions.enableMetrics) {
        metricsCollectorRef.current?.start();
      }

      // Create speak message
      const message = protocolHandlerRef.current?.createSpeakMessage(text);
      if (message && websocketManagerRef.current) {
        websocketManagerRef.current.sendMessage(message);
      }

      // Create flush message
      const flushMessage = protocolHandlerRef.current?.createFlushMessage();
      if (flushMessage && websocketManagerRef.current) {
        websocketManagerRef.current.sendMessage(flushMessage);
      }
    } catch (error) {
      const ttsError = error as TTSError;
      log(`❌ Speak failed: ${ttsError.message}`);
      setError(ttsError);
      memoizedOptions.onError?.(ttsError);
      throw ttsError;
    }
  }, [isReady, memoizedOptions.enableMetrics, memoizedOptions.onError, log]);

  // Stream text (for LLM streaming)
  const streamText = useCallback(async (text: string): Promise<void> => {
    if (!isReady) {
      throw new Error('TTS is not ready');
    }

    if (!text || text.trim().length === 0) {
      return;
    }

    try {
      log(`📝 Streaming text: "${text.substring(0, 30)}..."`, 'verbose');

      // Create speak message
      const message = protocolHandlerRef.current?.createSpeakMessage(text);
      if (message && websocketManagerRef.current) {
        websocketManagerRef.current.sendMessage(message);
      }
    } catch (error) {
      const ttsError = error as TTSError;
      log(`❌ Stream failed: ${ttsError.message}`);
      setError(ttsError);
      memoizedOptions.onError?.(ttsError);
      throw ttsError;
    }
  }, [isReady, memoizedOptions.onError, log]);

  // Flush stream
  const flushStream = useCallback(async (): Promise<void> => {
    if (!isReady) {
      throw new Error('TTS is not ready');
    }

    try {
      log('🚿 Flushing stream', 'verbose');

      // Create flush message
      const flushMessage = protocolHandlerRef.current?.createFlushMessage();
      if (flushMessage && websocketManagerRef.current) {
        websocketManagerRef.current.sendMessage(flushMessage);
      }
    } catch (error) {
      const ttsError = error as TTSError;
      log(`❌ Flush failed: ${ttsError.message}`);
      setError(ttsError);
      memoizedOptions.onError?.(ttsError);
      throw ttsError;
    }
  }, [isReady, memoizedOptions.onError, log]);

  // Clear audio
  const clear = useCallback(async (): Promise<void> => {
    if (!isReady) {
      throw new Error('TTS is not ready');
    }

    try {
      log('🧹 Clearing audio queue');

      // Create clear message
      const clearMessage = protocolHandlerRef.current?.createClearMessage();
      if (clearMessage && websocketManagerRef.current) {
        websocketManagerRef.current.sendMessage(clearMessage);
      }

      // Clear audio queue
      audioManagerRef.current?.clearAudioQueue();
    } catch (error) {
      const ttsError = error as TTSError;
      log(`❌ Clear failed: ${ttsError.message}`);
      setError(ttsError);
      memoizedOptions.onError?.(ttsError);
      throw ttsError;
    }
  }, [isReady, memoizedOptions.onError, log]);

  // Stop playback
  const stop = useCallback((): void => {
    log('⏹️ Stopping playback', 'verbose');
    audioManagerRef.current?.stop();
    metricsCollectorRef.current?.reset();
  }, [log]);

  // Return hook interface
  return {
    speak,
    streamText,
    flushStream,
    stop,
    clear,
    isPlaying,
    isConnected,
    isReady,
    error,
    metrics
  };
} 