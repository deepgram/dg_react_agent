import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioInput } from '../../../hooks/useAudio/useAudioInput';
import { useWebSocketConnection } from '../../../hooks/useWebSocket/useWebSocketConnection';
import { VoiceWebSocketManager } from '../../../utils/websocket/VoiceWebSocketManager';
import { AgentState, AgentOptions, TranscriptResponse, LLMResponse, UserMessageResponse, UpdateInstructionsPayload } from '../../../types/voice';
import { VoiceError } from '../../../types/voice/error';
import { AUDIO_CONFIG, MICROPHONE_CONFIG } from '../../../utils/shared/config';

interface UseDeepgramAgentOptions {
  apiKey: string;
  transcriptionOptions?: Record<string, any>;
  agentOptions?: AgentOptions;
  microphoneConfig?: Partial<typeof MICROPHONE_CONFIG>;
  autoInitialize?: boolean; // New option to control automatic initialization
  debug?: boolean;
  onReady?: (isReady: boolean) => void;
  onTranscriptUpdate?: (transcript: TranscriptResponse) => void;
  onAgentUtterance?: (response: LLMResponse) => void;
  onUserMessage?: (message: UserMessageResponse) => void;
  onAgentStateChange?: (state: AgentState) => void;
  onError?: (error: VoiceError) => void;
}

interface UseDeepgramAgentReturn {
  initialize: () => Promise<void>; // New method for manual initialization
  start: () => Promise<void>;
  stop: () => Promise<void>;
  updateAgentInstructions: (payload: UpdateInstructionsPayload) => void;
  interruptAgent: () => void;
  sleep: () => void;
  wake: () => void;
  toggleSleep: () => void;
  injectAgentMessage: (text: string) => void;
  isReady: boolean;
  isRecording: boolean;
  agentState: AgentState;
  error: VoiceError | null;
}

/**
 * Hook for Deepgram agent functionality.
 * Composes base hooks for audio and WebSocket management.
 */
export function useDeepgramAgent(options: UseDeepgramAgentOptions): UseDeepgramAgentReturn {
  // State
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<VoiceError | null>(null);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const isCleaningUpRef = useRef(false);
  const optionsRef = useRef(options);

  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Logging utility
  const log = useCallback((message: string) => {
    if (optionsRef.current.debug) {
      console.log(`[useDeepgramAgent] ${message}`);
    }
  }, []);

  // Create WebSocket managers
  const transcriptionManager = useRef<VoiceWebSocketManager | null>(null);
  const agentManager = useRef<VoiceWebSocketManager | null>(null);

  // Initialize managers
  const createManagers = useCallback(() => {
    if (!optionsRef.current.apiKey || isCleaningUpRef.current) return;

    // Only create managers if they don't exist
    if (!transcriptionManager.current) {
      transcriptionManager.current = new VoiceWebSocketManager({
        type: 'transcription',
        apiKey: optionsRef.current.apiKey,
        model: optionsRef.current.transcriptionOptions?.model || 'nova-2',
        encoding: AUDIO_CONFIG.encoding,
        sampleRate: AUDIO_CONFIG.sampleRate,
        debug: optionsRef.current.debug
      });
    }

    if (!agentManager.current) {
      agentManager.current = new VoiceWebSocketManager({
        type: 'agent',
        apiKey: optionsRef.current.apiKey,
        debug: optionsRef.current.debug
      });
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (isCleaningUpRef.current) {
      if (transcriptionManager.current) {
        transcriptionManager.current.cleanup();
        transcriptionManager.current = null;
      }
      if (agentManager.current) {
        agentManager.current.cleanup();
        agentManager.current = null;
      }
      setIsReady(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isCleaningUpRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  // Use base hooks
  const {
    initialize: initializeMicrophone,
    startRecording,
    stopRecording,
    isRecording,
    error: audioError
  } = useAudioInput({
    debug: optionsRef.current.debug,
    microphoneConfig: optionsRef.current.microphoneConfig,
    autoInitialize: false, // We'll handle initialization ourselves
    onMicrophoneData: (data) => {
      if (transcriptionManager.current?.isConnected()) {
        transcriptionManager.current.sendBinary(data);
      }
    },
    onError: (error) => {
      setError(new VoiceError('audio_error', { originalError: error }));
      optionsRef.current.onError?.(new VoiceError('audio_error', { originalError: error }));
    }
  });

  const {
    connect: connectTranscription,
    disconnect: disconnectTranscription,
    error: transcriptionError
  } = useWebSocketConnection(transcriptionManager.current, {
    debug: optionsRef.current.debug,
    onError: (error) => {
      setError(new VoiceError('transcription_error', { originalError: error }));
      optionsRef.current.onError?.(new VoiceError('transcription_error', { originalError: error }));
    }
  });

  const {
    connect: connectAgent,
    disconnect: disconnectAgent,
    sendMessage: sendAgentMessage,
    error: agentError
  } = useWebSocketConnection(agentManager.current, {
    debug: optionsRef.current.debug,
    onError: (error) => {
      setError(new VoiceError('agent_error', { originalError: error }));
      optionsRef.current.onError?.(new VoiceError('agent_error', { originalError: error }));
    }
  });

  // Handle errors from base hooks
  useEffect(() => {
    if (audioError) {
      setError(new VoiceError('audio_error', { originalError: audioError }));
      optionsRef.current.onError?.(new VoiceError('audio_error', { originalError: audioError }));
    } else if (transcriptionError) {
      setError(new VoiceError('transcription_error', { originalError: transcriptionError }));
      optionsRef.current.onError?.(new VoiceError('transcription_error', { originalError: transcriptionError }));
    } else if (agentError) {
      setError(new VoiceError('agent_error', { originalError: agentError }));
      optionsRef.current.onError?.(new VoiceError('agent_error', { originalError: agentError }));
    }
  }, [audioError, transcriptionError, agentError]);

  // Initialize function that sets up everything
  const initialize = useCallback(async () => {
    try {
      if (!optionsRef.current.apiKey) {
        throw new VoiceError('invalid_configuration', { 
          originalError: new Error('API key is required') 
        });
      }

      // Create WebSocket managers
      createManagers();

      // Initialize microphone
      await initializeMicrophone();

      setIsReady(true);
      log('✅ Agent system ready');
    } catch (error) {
      const voiceError = error instanceof VoiceError ? error : new VoiceError('initialization_failed', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      setError(voiceError);
      optionsRef.current.onError?.(voiceError);
      throw voiceError;
    }
  }, [createManagers, initializeMicrophone, log]);

  // Auto-initialize if enabled
  useEffect(() => {
    if (optionsRef.current.autoInitialize && !isCleaningUpRef.current) {
      initialize().catch(() => {}); // Errors are already handled in initialize
    }
  }, [initialize]);

  // Start interaction
  const start = useCallback(async () => {
    try {
      // Initialize if not ready
      if (!isReady) {
        await initialize();
      }

      // Connect WebSocket managers
      connectTranscription();
      connectAgent();

      // Start recording
      await startRecording();

      log('✅ Agent started');
    } catch (error) {
      const voiceError = error instanceof VoiceError ? error : new VoiceError('start_failed', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      setError(voiceError);
      optionsRef.current.onError?.(voiceError);
      throw voiceError;
    }
  }, [initialize, isReady, connectTranscription, connectAgent, startRecording, log]);

  // Stop interaction
  const stop = useCallback(async () => {
    try {
      // Stop recording first
      stopRecording();

      // Then disconnect WebSockets
      disconnectTranscription();
      disconnectAgent();

      log('✅ Agent stopped');
    } catch (error) {
      const voiceError = error instanceof VoiceError ? error : new VoiceError('stop_failed', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      setError(voiceError);
      optionsRef.current.onError?.(voiceError);
      throw voiceError;
    }
  }, [stopRecording, disconnectTranscription, disconnectAgent, log]);

  // Agent control methods
  const updateAgentInstructions = useCallback((payload: UpdateInstructionsPayload) => {
    try {
      if (!agentManager.current) {
        throw new VoiceError('agent_not_initialized');
      }
      sendAgentMessage({
        type: 'UpdateInstructions',
        instructions: payload.instructions,
        context: payload.context
      });
    } catch (error) {
      const voiceError = error instanceof VoiceError ? error : new VoiceError('update_failed', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      setError(voiceError);
      optionsRef.current.onError?.(voiceError);
    }
  }, [sendAgentMessage]);

  const interruptAgent = useCallback(() => {
    try {
      if (!agentManager.current) {
        throw new VoiceError('agent_not_initialized');
      }
      sendAgentMessage({ type: 'Interrupt' });
      setAgentState('idle');
    } catch (error) {
      const voiceError = error instanceof VoiceError ? error : new VoiceError('interrupt_failed', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      setError(voiceError);
      optionsRef.current.onError?.(voiceError);
    }
  }, [sendAgentMessage]);

  const sleep = useCallback(() => {
    try {
      if (!agentManager.current) {
        throw new VoiceError('agent_not_initialized');
      }
      sendAgentMessage({ type: 'Sleep' });
      setAgentState('sleeping');
    } catch (error) {
      const voiceError = error instanceof VoiceError ? error : new VoiceError('sleep_failed', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      setError(voiceError);
      optionsRef.current.onError?.(voiceError);
    }
  }, [sendAgentMessage]);

  const wake = useCallback(() => {
    try {
      if (!agentManager.current) {
        throw new VoiceError('agent_not_initialized');
      }
      if (agentState !== 'sleeping') {
        throw new VoiceError('agent_not_sleeping');
      }
      sendAgentMessage({ type: 'Wake' });
      setAgentState('listening');
    } catch (error) {
      const voiceError = error instanceof VoiceError ? error : new VoiceError('wake_failed', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      setError(voiceError);
      optionsRef.current.onError?.(voiceError);
    }
  }, [sendAgentMessage, agentState]);

  const toggleSleep = useCallback(() => {
    if (agentState === 'sleeping') {
      wake();
    } else {
      sleep();
    }
  }, [agentState, wake, sleep]);

  const injectAgentMessage = useCallback((text: string) => {
    try {
      if (!agentManager.current) {
        throw new VoiceError('agent_not_initialized');
      }
      sendAgentMessage({
        type: 'InjectMessage',
        text
      });
    } catch (error) {
      const voiceError = error instanceof VoiceError ? error : new VoiceError('inject_failed', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      setError(voiceError);
      optionsRef.current.onError?.(voiceError);
    }
  }, [sendAgentMessage]);

  return {
    initialize,
    start,
    stop,
    updateAgentInstructions,
    interruptAgent,
    sleep,
    wake,
    toggleSleep,
    injectAgentMessage,
    isReady,
    isRecording,
    agentState,
    error
  };
} 