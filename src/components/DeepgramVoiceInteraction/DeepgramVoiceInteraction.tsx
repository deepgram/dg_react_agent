import React, { forwardRef, useEffect, useImperativeHandle, useReducer, useRef } from 'react';
import {
  AgentOptions,
  AgentState,
  DeepgramError,
  DeepgramVoiceInteractionHandle,
  DeepgramVoiceInteractionProps,
  LLMResponse,
  ServiceType,
  TranscriptResponse,
  UpdateInstructionsPayload
} from '../../types';
import { WebSocketManager } from '../../utils/websocket/WebSocketManager';
import { AudioManager } from '../../utils/audio/AudioManager';
import {
  VoiceInteractionState,
  StateEvent,
  initialState,
  stateReducer,
  derivedStates
} from '../../utils/state/VoiceInteractionState';

// Default URL to load the AudioWorklet processor
const DEFAULT_WORKLET_PROCESSOR_URL = new URL('../../utils/audio/AudioWorkletProcessor.js', import.meta.url).href;

// Default endpoints
const DEFAULT_ENDPOINTS = {
  transcriptionUrl: 'wss://api.deepgram.com/v1/listen',
  agentUrl: 'wss://api.deepgram.com/v1/agent',
};

/**
 * DeepgramVoiceInteraction component
 * 
 * Provides a headless component for real-time transcription using Deepgram's WebSocket API.
 */
function DeepgramVoiceInteraction(
  props: DeepgramVoiceInteractionProps,
  ref: React.Ref<DeepgramVoiceInteractionHandle>
) {
  const {
    apiKey,
    transcriptionOptions = {},
    agentOptions = {},
    endpointConfig = {},
    processorUrl,
    onReady,
    onConnectionStateChange,
    onTranscriptUpdate,
    onAgentStateChange,
    onAgentUtterance,
    onUserStartedSpeaking,
    onUserStoppedSpeaking,
    onError,
    debug = false,
  } = props;

  // Use the provided processor URL or fall back to the default
  const workletProcessorUrl = processorUrl || DEFAULT_WORKLET_PROCESSOR_URL;

  // Internal state
  const [state, dispatch] = useReducer(stateReducer, initialState);

  // Managers
  const transcriptionManagerRef = useRef<WebSocketManager | null>(null);
  // const agentManagerRef = useRef<WebSocketManager | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  
  // Tracking user speaking state
  const userSpeakingRef = useRef(false);
  
  // Debug logging
  const log = (...args: any[]) => {
    if (debug) {
      console.log('[DeepgramVoiceInteraction]', ...args);
    }
  };

  // Handle errors
  const handleError = (error: DeepgramError) => {
    log('Error:', error);
    dispatch({ type: 'ERROR', message: error.message });
    onError?.(error);
  };

  // Initialize the component
  useEffect(() => {
    // Validate API key
    if (!apiKey) {
      handleError({
        service: 'transcription',
        code: 'invalid_api_key',
        message: 'API key is required',
      });
      return;
    }

    // Prepare endpoints
    const endpoints = {
      transcriptionUrl: endpointConfig.transcriptionUrl || DEFAULT_ENDPOINTS.transcriptionUrl,
      // agentUrl: endpointConfig.agentUrl || DEFAULT_ENDPOINTS.agentUrl,
    };

    // Ensure audio format parameters are set for transcription
    const transcriptionParams = {
      ...transcriptionOptions,
      // Set defaults for audio format if not provided
      sample_rate: transcriptionOptions.sample_rate || 16000,
      encoding: transcriptionOptions.encoding || 'linear16',
      channels: transcriptionOptions.channels || 1,
    };

    // Create WebSocket managers
    transcriptionManagerRef.current = new WebSocketManager({
      url: endpoints.transcriptionUrl,
      apiKey,
      service: 'transcription',
      queryParams: transcriptionParams as Record<string, string | boolean | number>,
      debug,
    });

    /* Comment out agent manager
    agentManagerRef.current = new WebSocketManager({
      url: endpoints.agentUrl,
      apiKey,
      service: 'agent',
      queryParams: agentOptions as Record<string, string | boolean | number>,
      debug,
    });
    */

    // Create audio manager
    audioManagerRef.current = new AudioManager({
      processorUrl: workletProcessorUrl,
      debug,
    });

    // Set up event listeners for transcription WebSocket
    const transcriptionUnsubscribe = transcriptionManagerRef.current.addEventListener((event) => {
      if (event.type === 'state') {
        log('Transcription state:', event.state);
        dispatch({ type: 'CONNECTION_STATE_CHANGE', service: 'transcription', state: event.state });
        onConnectionStateChange?.('transcription', event.state);
      } else if (event.type === 'message') {
        handleTranscriptionMessage(event.data);
      } else if (event.type === 'error') {
        handleError(event.error);
      }
    });

    /* Comment out agent WebSocket event listeners
    // Set up event listeners for agent WebSocket
    const agentUnsubscribe = agentManagerRef.current.addEventListener((event) => {
      if (event.type === 'state') {
        log('Agent state:', event.state);
        dispatch({ type: 'CONNECTION_STATE_CHANGE', service: 'agent', state: event.state });
        onConnectionStateChange?.('agent', event.state);
      } else if (event.type === 'message') {
        handleAgentMessage(event.data);
      } else if (event.type === 'binary') {
        handleAgentAudio(event.data);
      } else if (event.type === 'error') {
        handleError(event.error);
      }
    });
    */

    // Set up event listeners for audio manager
    const audioUnsubscribe = audioManagerRef.current.addEventListener((event) => {
      if (event.type === 'ready') {
        log('Audio manager ready');
      } else if (event.type === 'recording') {
        log('Recording state:', event.isRecording);
        dispatch({ type: 'RECORDING_STATE_CHANGE', isRecording: event.isRecording });
      } else if (event.type === 'playing') {
        log('Playing state:', event.isPlaying);
        dispatch({ type: 'PLAYBACK_STATE_CHANGE', isPlaying: event.isPlaying });
      } else if (event.type === 'error') {
        handleError(event.error);
      } else if (event.type === 'data') {
        sendAudioData(event.data);
      }
    });

    // Initialize audio manager
    audioManagerRef.current.initialize()
      .catch(error => {
        handleError({
          service: 'transcription',
          code: 'audio_init_error',
          message: 'Failed to initialize audio',
          details: error,
        });
      });

    // Clean up
    return () => {
      transcriptionUnsubscribe();
      // agentUnsubscribe(); // Comment out agent cleanup
      audioUnsubscribe();
      
      transcriptionManagerRef.current?.close();
      // agentManagerRef.current?.close(); // Comment out agent cleanup
      audioManagerRef.current?.dispose();
      
      transcriptionManagerRef.current = null;
      // agentManagerRef.current = null; // Comment out agent cleanup
      audioManagerRef.current = null;
    };
  }, [apiKey, workletProcessorUrl]);

  // Notify ready state changes
  useEffect(() => {
    onReady?.(state.isReady);
  }, [state.isReady, onReady]);

  // Notify agent state changes - comment out
  /*
  useEffect(() => {
    onAgentStateChange?.(state.agentState);
  }, [state.agentState, onAgentStateChange]);
  */

  // Handle transcription messages
  const handleTranscriptionMessage = (data: any) => {
    // Check for VAD events if enabled
    if (data.type === 'VADEvent') {
      const isSpeaking = data.is_speech;
      if (isSpeaking && !userSpeakingRef.current) {
        userSpeakingRef.current = true;
        onUserStartedSpeaking?.();
      } else if (!isSpeaking && userSpeakingRef.current) {
        userSpeakingRef.current = false;
        onUserStoppedSpeaking?.();
      }
      return;
    }

    // Log all received messages for debugging
    log('Received transcription message:', data);

    // Handle transcript
    if (data.type === 'Results' || data.type === 'Transcript') {
      const transcript = data as unknown as TranscriptResponse;
      onTranscriptUpdate?.(transcript);
      return;
    }
  };

  /* Comment out agent message handler
  // Handle agent messages
  const handleAgentMessage = (data: any) => {
    // Handle state changes
    if (data.type === 'Status') {
      let newState: AgentState = 'idle';
      
      if (data.status === 'listening') {
        newState = 'listening';
      } else if (data.status === 'thinking') {
        newState = 'thinking';
      } else if (data.status === 'responding') {
        newState = 'speaking';
      }
      
      dispatch({ type: 'AGENT_STATE_CHANGE', state: newState });
      return;
    }
    
    // Handle LLM responses
    if (data.type === 'AgentResponse' || data.type === 'llm') {
      const response: LLMResponse = {
        type: 'llm',
        text: data.text || data.content || '',
        metadata: data,
      };
      
      onAgentUtterance?.(response);
      return;
    }
    
    // Handle errors
    if (data.type === 'Error') {
      handleError({
        service: 'agent',
        code: data.error_type || 'agent_error',
        message: data.message || 'Unknown agent error',
        details: data,
      });
      return;
    }
  };
  */

  /* Comment out agent audio handler
  // Handle agent audio
  const handleAgentAudio = (data: ArrayBuffer) => {
    if (audioManagerRef.current) {
      audioManagerRef.current.queueAudio(data).catch(error => {
        log('Error queueing audio:', error);
      });
    }
  };
  */

  // Send audio data to only the transcription WebSocket
  const sendAudioData = (data: ArrayBuffer) => {
    if (transcriptionManagerRef.current) {
      transcriptionManagerRef.current.sendBinary(data);
    }
    
    /* Comment out sending to agent
    if (agentManagerRef.current) {
      agentManagerRef.current.sendBinary(data);
    }
    */
  };

  // Start the connection
  const start = async (): Promise<void> => {
    try {
      log('Starting transcription');
      
      // Initialize audio manager if not already
      if (audioManagerRef.current) {
        await audioManagerRef.current.initialize();
      }
      
      // Connect WebSockets
      if (transcriptionManagerRef.current) {
        await transcriptionManagerRef.current.connect();
      }
      
      /* Comment out agent connection
      if (agentManagerRef.current) {
        await agentManagerRef.current.connect();
      }
      */
      
      // Start recording
      if (audioManagerRef.current) {
        await audioManagerRef.current.startRecording();
      }
      
      dispatch({ type: 'READY_STATE_CHANGE', isReady: true });
    } catch (error) {
      log('Error starting:', error);
      handleError({
        service: 'transcription',
        code: 'start_error',
        message: 'Failed to start voice interaction',
        details: error,
      });
      throw error;
    }
  };

  // Stop the connection
  const stop = async (): Promise<void> => {
    log('Stopping transcription');
    
    try {
      // Send CloseStream message to finalize any pending transcriptions
      if (transcriptionManagerRef.current) {
        log('Sending CloseStream message to finalize transcription');
        transcriptionManagerRef.current.sendCloseStream();
      }
      
      // Stop recording
      if (audioManagerRef.current) {
        audioManagerRef.current.stopRecording();
      }
      
      // Add a small delay to allow final transcripts to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close WebSockets
      if (transcriptionManagerRef.current) {
        transcriptionManagerRef.current.close();
      }
      
      /* Comment out agent closing
      if (agentManagerRef.current) {
        agentManagerRef.current.close();
      }
      */
      
      dispatch({ type: 'READY_STATE_CHANGE', isReady: false });
      return Promise.resolve();
    } catch (error) {
      log('Error stopping:', error);
      handleError({
        service: 'transcription',
        code: 'stop_error',
        message: 'Error while stopping transcription',
        details: error,
      });
      return Promise.reject(error);
    }
  };

  /* Comment out agent methods
  // Update agent instructions
  const updateAgentInstructions = (payload: UpdateInstructionsPayload): void => {
    if (!agentManagerRef.current) {
      log('Cannot update instructions, agent manager not initialized');
      return;
    }
    
    log('Updating agent instructions:', payload);
    
    agentManagerRef.current.sendJSON({
      type: 'Update',
      ...payload,
    });
  };

  // Interrupt the agent
  const interruptAgent = (): void => {
    log('Interrupting agent');
    
    // Clear audio queue to stop current playback
    if (audioManagerRef.current) {
      audioManagerRef.current.clearAudioQueue();
    }
    
    // Send interrupt command to agent
    if (agentManagerRef.current) {
      agentManagerRef.current.sendJSON({
        type: 'Interrupt',
      });
    }
  };
  */

  // Expose methods via ref - keep only start/stop, comment out agent methods
  useImperativeHandle(ref, () => ({
    start,
    stop,
    updateAgentInstructions: () => {
      log('Agent functionality is disabled');
    },
    interruptAgent: () => {
      log('Agent functionality is disabled');
    },
  }));

  // Render nothing (headless component)
  return null;
}

export default forwardRef(DeepgramVoiceInteraction); 