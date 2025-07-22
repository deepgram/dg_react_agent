import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  AUDIO_CONFIG,
  WEBSOCKET_CONFIG,
  MODEL_CONFIG,
  DEBUG_CONFIG,
  METRICS_CONFIG,
  DebugLevel
} from '../../../utils/shared/config';
import { VoiceWebSocketManager } from '../../../utils/websocket/VoiceWebSocketManager';
import { AudioManager } from '../../../utils/audio/AudioManager';
import { ConnectionState, EndpointConfig } from '../../../types/common/connection';
import { DeepgramError } from '../../../types/common/error';
import { MicrophoneConfig } from '../../../types/common/microphone';
import {
  AgentState,
  AgentOptions,
  ServiceType,
  TranscriptResponse,
  LLMResponse,
  UserMessageResponse,
  VoiceError,
  UpdateInstructionsPayload
} from '../../../types/voice';
import { useMessageHandlers } from './handlers/useMessageHandlers';
import { useAgentControl } from './handlers/useAgentControl';
import { useConnectionManager } from './handlers/useConnectionManager';

// Configuration interfaces
interface VoiceInteractionConfig {
  transcriptionOptions?: Record<string, any>;
  agentOptions?: AgentOptions;
  debug?: boolean | DebugLevel;
  enableMetrics?: boolean;
  microphoneConfig?: Partial<MicrophoneConfig>;
  endpointOverrides?: EndpointConfig;
  onReady?: (isReady: boolean) => void;
  onConnectionStateChange?: (service: ServiceType, state: ConnectionState) => void;
  onTranscriptUpdate?: (transcript: TranscriptResponse) => void;
  onAgentStateChange?: (state: AgentState) => void;
  onAgentUtterance?: (response: LLMResponse) => void;
  onUserMessage?: (message: UserMessageResponse) => void;
  onUserStartedSpeaking?: () => void;
  onUserStoppedSpeaking?: () => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onMicrophoneData?: (data: ArrayBuffer) => void;
  onError?: (error: DeepgramError) => void;
}

// Return type for the hook
interface UseDeepgramVoiceInteractionReturn {
  // Core functionality
  initialize: () => Promise<void>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  
  // Recording control
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  
  // Agent control
  updateAgentInstructions: (payload: UpdateInstructionsPayload) => void;
  interruptAgent: () => void;
  sleep: () => void;
  wake: () => void;
  toggleSleep: () => void;
  injectAgentMessage: (text: string) => void;
  
  // State queries
  getMicrophoneState: () => { enabled: boolean; permissions: boolean } | null;
  getConnectionState: () => { transcription: ConnectionState; agent: ConnectionState };
  getAgentState: () => AgentState;
  
  // State
  isReady: boolean;
  isConnected: boolean;
  isRecording: boolean;
  isPlaying: boolean;
  agentState: AgentState;
  error: VoiceError | null;
}

const DEFAULT_VOICE_CONFIG: VoiceInteractionConfig = {
  
  debug: DEBUG_CONFIG.defaultLevel,
  enableMetrics: METRICS_CONFIG.enableByDefault,
  transcriptionOptions: {
    model: MODEL_CONFIG.transcription.default,
    encoding: AUDIO_CONFIG.encoding,
    channels: AUDIO_CONFIG.channels,
    sampleRate: AUDIO_CONFIG.sampleRate,
    punctuate: true,
    endpointing: 250
  },
  agentOptions: {
    listenModel: MODEL_CONFIG.agent.listen,
    thinkModel: MODEL_CONFIG.agent.think,
    voice: MODEL_CONFIG.agent.speak
  }
};

export function useDeepgramVoiceInteraction(
  apiKey: string,
  options: Partial<VoiceInteractionConfig> = {}
): UseDeepgramVoiceInteractionReturn {
  // Merge configuration with defaults
  const config = useMemo(() => ({
    ...DEFAULT_VOICE_CONFIG,
    ...options,
    microphoneConfig: options.microphoneConfig
      ? { ...options.microphoneConfig }
      : undefined,
    endpointOverrides: options.endpointOverrides
      ? { ...WEBSOCKET_CONFIG.endpoints, ...options.endpointOverrides }
      : WEBSOCKET_CONFIG.endpoints
  }), [options]);

  // State management
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [error, setError] = useState<VoiceError | null>(null);

  // Refs for managers
  const transcriptionManagerRef = useRef<VoiceWebSocketManager | null>(null);
  const agentManagerRef = useRef<VoiceWebSocketManager | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);

  // Refs for state tracking
  const isCleaningUpRef = useRef(false);
  const userSpeakingRef = useRef(false);
  const isWaitingForUserVoiceAfterSleep = useRef(false);

  // Debug configuration
  const debugConfig = useMemo(() => {
    const config = {
      level: 'off' as const,
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

  // Logging utility
  const log = useCallback((message: string, level: 'hook' | 'manager' | 'verbose' = 'hook') => {
    if (debugConfig.level === 'off') return;
    
    if (level === 'hook' && debugConfig.hookDebug) {
      console.log(`[DeepgramVoice] ${message}`);
    } else if (level === 'manager' && debugConfig.level === 'manager') {
      console.log(`[DeepgramVoice:Manager] ${message}`);
    } else if (level === 'verbose' && debugConfig.level === 'verbose') {
      console.log(`[DeepgramVoice:Verbose] ${message}`);
    }
  }, [debugConfig]);

  // Error handling utility
  const handleError = useCallback((error: unknown, operation: string) => {
    let voiceError: VoiceError;
    
    if (error instanceof VoiceError) {
      voiceError = error;
    } else if (error instanceof Error) {
      voiceError = new VoiceError('unknown', error.message, { originalError: error });
    } else {
      voiceError = new VoiceError('unknown', 'Unknown error occurred', { originalError: error });
    }
    
    log(`❌ ${operation} failed: ${voiceError.message}`);
    setError(voiceError);
    options.onError?.(voiceError);
    throw voiceError;
  }, [log, options.onError]);

  // Use specialized hooks
  useMessageHandlers({
    agentState,
    isWaitingForUserVoiceAfterSleep,
    userSpeakingRef,
    onTranscriptUpdate: options.onTranscriptUpdate,
    onAgentUtterance: options.onAgentUtterance,
    onUserMessage: options.onUserMessage,
    onUserStartedSpeaking: options.onUserStartedSpeaking,
    onUserStoppedSpeaking: options.onUserStoppedSpeaking,
    setAgentState,
    log
  }, {
    transcription: transcriptionManagerRef,
    agent: agentManagerRef,
    audio: audioManagerRef
  });

  const {
    interruptAgent,
    sleep,
    wake,
    toggleSleep,
    updateAgentInstructions,
    injectAgentMessage
  } = useAgentControl({
    agentState,
    isWaitingForUserVoiceAfterSleep,
    setAgentState,
    log
  }, {
    agent: agentManagerRef,
    audio: audioManagerRef
  });

  const { start, stop } = useConnectionManager({
    apiKey,
    transcriptionUrl: config.endpointOverrides.transcription,
    agentUrl: config.endpointOverrides.agent,
    transcriptionOptions: config.transcriptionOptions,
    agentOptions: config.agentOptions,
    log
  }, {
    transcription: transcriptionManagerRef,
    agent: agentManagerRef,
    audio: audioManagerRef
  });

  // Initialize the system
  const initialize = useCallback(async (): Promise<void> => {
    try {
      log('🚀 Initializing voice interaction system...');

      if (!apiKey) {
        throw new VoiceError('invalid_configuration', 'API key is required');
      }

      // Initialize audio manager
      if (audioManagerRef.current) {
        await audioManagerRef.current.initialize();
        log('Audio system initialized');
      }

      setIsReady(true);
      options.onReady?.(true);
      log('✅ Voice interaction system ready!');
    } catch (error) {
      handleError(error, 'System initialization');
    }
  }, [apiKey, handleError, log, options.onReady]);

  // Cleanup on unmount or when API key changes
  useEffect(() => {
    // Skip initialization if no API key
    if (!apiKey) {
      log('No API key provided, skipping initialization');
      return;
    }

    initialize();

    return () => {
      if (!isCleaningUpRef.current) {
        // Cleanup resources
        if (audioManagerRef.current) {
          audioManagerRef.current.cleanup();
          audioManagerRef.current = null;
        }
        
        if (transcriptionManagerRef.current) {
          transcriptionManagerRef.current.close();
          transcriptionManagerRef.current = null;
        }

        if (agentManagerRef.current) {
          agentManagerRef.current.close();
          agentManagerRef.current = null;
        }
        
        // Reset state
        setIsConnected(false);
        setIsReady(false);
        setError(null);
        setIsPlaying(false);
        setIsRecording(false);
        setAgentState('idle');
      }
    };
  }, [apiKey, initialize, log]);

  // Get microphone state
  const getMicrophoneState = useCallback((): { enabled: boolean; permissions: boolean } | null => {
    if (!audioManagerRef.current) return null;

    const state = audioManagerRef.current.getMicrophoneState();
    if (!state) return null;

    return {
      enabled: audioManagerRef.current.hasMicrophone(),
      permissions: state.hasPermission
    };
  }, []);

  // Get connection state
  const getConnectionState = useCallback(() => ({
    transcription: transcriptionManagerRef.current?.getState() || 'disconnected',
    agent: agentManagerRef.current?.getState() || 'disconnected'
  }), []);

  // Get agent state
  const getAgentState = useCallback(() => agentState, [agentState]);

  return {
    initialize,
    start,
    stop,
    startRecording: async () => audioManagerRef.current?.startRecording(),
    stopRecording: () => audioManagerRef.current?.stopRecording(),
    updateAgentInstructions,
    interruptAgent,
    sleep,
    wake,
    toggleSleep,
    injectAgentMessage,
    getMicrophoneState,
    getConnectionState,
    getAgentState,
    isReady,
    isConnected,
    isRecording,
    isPlaying,
    agentState,
    error
  };
} 