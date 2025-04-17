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
} from '../../utils/state/VoiceInteractionState';

// Default URL to load the AudioWorklet processor
const DEFAULT_WORKLET_PROCESSOR_URL = new URL('../../utils/audio/AudioWorkletProcessor.js', import.meta.url).href;

// Default endpoints
const DEFAULT_ENDPOINTS = {
  transcriptionUrl: 'wss://api.deepgram.com/v1/listen',
  agentUrl: 'wss://agent.deepgram.com/v1/agent/converse',
};

// Create a stable reference for the default empty object
// const defaultEndpointConfig = {}; // Keep this commented out or remove

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
    endpointConfig,
    onReady,
    onConnectionStateChange,
    onTranscriptUpdate,
    onAgentStateChange,
    onAgentUtterance,
    onUserStartedSpeaking,
    onUserStoppedSpeaking,
    onPlaybackStateChange,
    onError,
    debug = false,
  } = props;

  // Internal state
  const [state, dispatch] = useReducer(stateReducer, initialState);
  
  // Ref to hold the latest state value, avoiding stale closures in callbacks
  const stateRef = useRef<VoiceInteractionState>(state);

  // Managers
  const transcriptionManagerRef = useRef<WebSocketManager | null>(null);
  const agentManagerRef = useRef<WebSocketManager | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  
  // Tracking user speaking state
  const userSpeakingRef = useRef(false);
  
  // Track if we're waiting for user voice after waking from sleep
  const isWaitingForUserVoiceAfterSleep = useRef(false);
  
  // Debug logging
  const log = (...args: any[]) => {
    if (debug) {
      console.log('[DeepgramVoiceInteraction]', ...args);
    }
  };
  
  // Targeted sleep/wake logging
  const sleepLog = (...args: any[]) => {
    if (debug) {
      console.log('[SLEEP_CYCLE][CORE]', ...args);
    }
  };

  // Update stateRef whenever state changes
  useEffect(() => {
    stateRef.current = state;
    
    // If we just entered the 'entering_sleep' state, schedule the final transition
    if (state.agentState === 'entering_sleep') {
      const timerId = setTimeout(() => {
        sleepLog('Transitioning from entering_sleep to sleeping after timeout');
        // Ensure we are still in entering_sleep before finalizing
        // (Could have been woken up or stopped during the timeout)
        if (stateRef.current.agentState === 'entering_sleep') {
          dispatch({ type: 'AGENT_STATE_CHANGE', state: 'sleeping' });
        }
      }, 50); // 50ms delay - adjust if needed
      
      // Cleanup timeout if component unmounts or state changes away from entering_sleep
      return () => clearTimeout(timerId);
    }
  }, [state]); // Dependency array includes state

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

    // Prepare endpoints, using defaults ONLY if endpointConfig prop is not provided
    const currentEndpointConfig = endpointConfig || {}; // Use provided or empty object
    const endpoints = {
      transcriptionUrl: currentEndpointConfig.transcriptionUrl || DEFAULT_ENDPOINTS.transcriptionUrl,
      agentUrl: currentEndpointConfig.agentUrl || DEFAULT_ENDPOINTS.agentUrl,
    };

    // --- Transcription WebSocket Setup ---
    let transcriptionUrl = endpoints.transcriptionUrl;
    let transcriptionQueryParams: Record<string, string | boolean | number> = {};

    // Base transcription parameters (always include)
    const baseTranscriptionParams = {
      ...transcriptionOptions,
      // Set defaults for audio format if not provided
      sample_rate: transcriptionOptions.sample_rate || 16000,
      encoding: transcriptionOptions.encoding || 'linear16',
      channels: transcriptionOptions.channels || 1,
    };

    // Check for Nova-3 Keyterm Prompting conditions
    const useKeytermPrompting = 
      baseTranscriptionParams.model === 'nova-3' &&
      Array.isArray(baseTranscriptionParams.keyterm) &&
      baseTranscriptionParams.keyterm.length > 0;

    if (useKeytermPrompting) {
      log('Nova-3 and keyterms detected. Building transcription URL with keyterm parameters.');
      // Build URL manually, appending keyterms
      const url = new URL(transcriptionUrl);
      const params = new URLSearchParams();
      
      // Append all other options EXCEPT keyterm array itself
      for (const [key, value] of Object.entries(baseTranscriptionParams)) {
        if (key !== 'keyterm' && value !== undefined) {
          params.append(key, String(value));
        }
      }
      
      // Append each keyterm as a separate parameter
      baseTranscriptionParams.keyterm?.forEach(term => {
        if (term) { // Ensure term is not empty
          params.append('keyterm', term);
        }
      });

      url.search = params.toString();
      transcriptionUrl = url.toString();
      log('Constructed transcription URL with keyterms:', transcriptionUrl);
      // queryParams remain empty as they are in the URL now
    } else {
      // Standard setup: Build queryParams object, excluding array types like keyterm and keywords
      log('Not using keyterm prompting. Building queryParams object excluding array types.');
      const { keyterm, keywords, ...otherParams } = baseTranscriptionParams;
      
      // Ensure only primitive types are included in queryParams
      const filteredParams: Record<string, string | number | boolean> = {};
      for (const [key, value] of Object.entries(otherParams)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          filteredParams[key] = value;
        } else {
          log(`Skipping non-primitive param ${key} for queryParams object.`);
        }
      }
      transcriptionQueryParams = filteredParams;
    }
    
    // Create Transcription WebSocket manager
    transcriptionManagerRef.current = new WebSocketManager({
      url: transcriptionUrl, // Use the potentially modified URL
      apiKey,
      service: 'transcription',
      // Conditionally pass queryParams ONLY if not using keyterm prompting in URL
      queryParams: useKeytermPrompting ? undefined : transcriptionQueryParams, 
      debug,
    });

    // --- Agent WebSocket Setup (unchanged) ---
    agentManagerRef.current = new WebSocketManager({
      url: endpoints.agentUrl,
      apiKey,
      service: 'agent',
      debug,
    });

    // Create audio manager (unchanged)
    audioManagerRef.current = new AudioManager({
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

    // Set up event listeners for agent WebSocket
    const agentUnsubscribe = agentManagerRef.current.addEventListener((event) => {
      if (event.type === 'state') {
        log('Agent state:', event.state);
        dispatch({ type: 'CONNECTION_STATE_CHANGE', service: 'agent', state: event.state });
        onConnectionStateChange?.('agent', event.state);
        
        // Send settings message when connection is established
        if (event.state === 'connected') {
          sendAgentSettings();
        }
      } else if (event.type === 'message') {
        handleAgentMessage(event.data);
      } else if (event.type === 'binary') {
        handleAgentAudio(event.data);
      } else if (event.type === 'error') {
        handleError(event.error);
      }
    });

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
      .then(() => {
        log('AudioManager initialized successfully in useEffect');
        // Signal ready now that audio is initialized
        dispatch({ type: 'READY_STATE_CHANGE', isReady: true }); 
      })
      .catch(error => {
        handleError({
          service: 'transcription',
          code: 'audio_init_error',
          message: 'Failed to initialize audio',
          details: error,
        });
        // Signal not ready on initialization failure
        dispatch({ type: 'READY_STATE_CHANGE', isReady: false });
      });

    // Clean up
    return () => {
      transcriptionUnsubscribe();
      agentUnsubscribe();
      audioUnsubscribe();
      
      transcriptionManagerRef.current?.close();
      agentManagerRef.current?.close();
      audioManagerRef.current?.dispose();
      
      transcriptionManagerRef.current = null;
      agentManagerRef.current = null;
      audioManagerRef.current = null;
      
      // Ensure state is reset on unmount
      dispatch({ type: 'READY_STATE_CHANGE', isReady: false });
      dispatch({ type: 'CONNECTION_STATE_CHANGE', service: 'transcription', state: 'closed' });
      dispatch({ type: 'CONNECTION_STATE_CHANGE', service: 'agent', state: 'closed' });
      dispatch({ type: 'AGENT_STATE_CHANGE', state: 'idle' });
      dispatch({ type: 'RECORDING_STATE_CHANGE', isRecording: false });
      dispatch({ type: 'PLAYBACK_STATE_CHANGE', isPlaying: false });
    };
  }, [apiKey, transcriptionOptions, agentOptions, endpointConfig, debug]); // Add options to dependency array

  // Notify ready state changes
  useEffect(() => {
    onReady?.(state.isReady);
  }, [state.isReady, onReady]);

  // Notify agent state changes
  useEffect(() => {
    onAgentStateChange?.(state.agentState);
  }, [state.agentState, onAgentStateChange]);

  // Notify playback state changes
  useEffect(() => {
    onPlaybackStateChange?.(state.isPlaying);
  }, [state.isPlaying, onPlaybackStateChange]);

  // Handle transcription messages
  const handleTranscriptionMessage = (data: any) => {
    // Check if sleeping or entering sleep
    const isSleepingOrEntering = 
      stateRef.current.agentState === 'sleeping' || 
      stateRef.current.agentState === 'entering_sleep';
      
    if (data.type === 'VADEvent') {
      const isSpeaking = data.is_speech;
      if (isSleepingOrEntering) {
        sleepLog('Ignoring VAD event (state:', stateRef.current.agentState, ')');
        return;
      }
      
      if (isSpeaking && !userSpeakingRef.current) {
        userSpeakingRef.current = true;
        onUserStartedSpeaking?.();
      } else if (!isSpeaking && userSpeakingRef.current) {
        userSpeakingRef.current = false;
        onUserStoppedSpeaking?.();
      }
      return;
    }

    if (data.type === 'Results' || data.type === 'Transcript') {
      if (isSleepingOrEntering) {
        sleepLog('Ignoring transcript (state:', stateRef.current.agentState, ')');
        return;
      }
      
      const transcript = data as unknown as TranscriptResponse;
      onTranscriptUpdate?.(transcript);
      return;
    }
  };

  // Send agent settings after connection is established
  const sendAgentSettings = () => {
    if (!agentManagerRef.current) return;
    
    // Build the Settings message based on agentOptions
    const settingsMessage = {
      type: 'Settings',
      audio: {
        input: {
          encoding: 'linear16',
          sample_rate: 16000
        },
        output: {
          encoding: 'linear16',
          sample_rate: 24000
        }
      },
      agent: {
        language: agentOptions.language || 'en',
        listen: {
          provider: {
            type: 'deepgram',
            model: agentOptions.listenModel || 'nova-2'
          }
        },
        think: {
          provider: {
            type: agentOptions.thinkProviderType || 'open_ai',
            model: agentOptions.thinkModel || 'gpt-4o-mini'
          },
          prompt: agentOptions.instructions || 'You are a helpful voice assistant.'
        },
        speak: {
          provider: {
            type: 'deepgram',
            model: agentOptions.voice || 'aura-asteria-en'
          }
        },
        greeting: agentOptions.greeting
      }
    };
    
    log('Sending agent settings:', settingsMessage);
    agentManagerRef.current.sendJSON(settingsMessage);
  };

  // Handle agent messages
  const handleAgentMessage = (data: any) => {
    const isSleepingOrEntering = 
      stateRef.current.agentState === 'sleeping' || 
      stateRef.current.agentState === 'entering_sleep';

    if (data.type === 'UserStartedSpeaking') {
      sleepLog('UserStartedSpeaking message received');
      if (isSleepingOrEntering) {
        sleepLog('Ignoring UserStartedSpeaking event (state:', stateRef.current.agentState, ')');
        return;
      }
      
      // Normal speech handling when not sleeping
      log('Clearing audio queue (barge-in)');
      clearAudio();
      onUserStartedSpeaking?.();
      
      if (isWaitingForUserVoiceAfterSleep.current) {
        log('User started speaking after wake - resetting waiting flag');
        isWaitingForUserVoiceAfterSleep.current = false;
      }
      
      sleepLog('Dispatching AGENT_STATE_CHANGE to listening (from UserStartedSpeaking)');
      dispatch({ type: 'AGENT_STATE_CHANGE', state: 'listening' });
      return;
    }
    
    if (data.type === 'AgentThinking') {
      sleepLog('Dispatching AGENT_STATE_CHANGE to thinking');
      dispatch({ type: 'AGENT_STATE_CHANGE', state: 'thinking' });
      return;
    }
    
    if (data.type === 'AgentStartedSpeaking') {
      sleepLog('Dispatching AGENT_STATE_CHANGE to speaking');
      dispatch({ type: 'AGENT_STATE_CHANGE', state: 'speaking' });
      return;
    }
    
    if (data.type === 'AgentAudioDone') {
      sleepLog('Dispatching AGENT_STATE_CHANGE to idle (from AgentAudioDone)');
      dispatch({ type: 'AGENT_STATE_CHANGE', state: 'idle' });
      return;
    }
    
    // Handle conversation text
    if (data.type === 'ConversationText' && data.role === 'assistant') {
      const response: LLMResponse = {
        type: 'llm',
        text: data.content || '',
        metadata: data,
      };
      
      onAgentUtterance?.(response);
      return;
    }
    
    // Handle errors
    if (data.type === 'Error') {
      handleError({
        service: 'agent',
        code: data.code || 'agent_error',
        message: data.description || 'Unknown agent error',
        details: data,
      });
      return;
    }
    
    // Handle warnings
    if (data.type === 'Warning') {
      log('Agent warning:', data.description, 'Code:', data.code);
      return;
    }
  };

  // Handle agent audio
  const handleAgentAudio = (data: ArrayBuffer) => {
    log(`handleAgentAudio called! Received buffer of ${data.byteLength} bytes`);
    
    // Skip audio playback if we're waiting for user voice after sleep
    if (isWaitingForUserVoiceAfterSleep.current) {
      log('Skipping audio playback because waiting for user voice after sleep');
      return;
    }
    
    if (audioManagerRef.current) {
      log('Passing buffer to AudioManager.queueAudio()');
      audioManagerRef.current.queueAudio(data)
        .then(() => {
          log('Successfully queued audio buffer for playback');
        })
        .catch(error => {
          log('Error queueing audio:', error);
        });
    } else {
      log('Cannot queue audio: audioManagerRef.current is null');
    }
  };

  // Send audio data to WebSockets
  const sendAudioData = (data: ArrayBuffer) => {
    // Always send to transcription service (if connected)
    if (transcriptionManagerRef.current?.getState() === 'connected') {
      transcriptionManagerRef.current.sendBinary(data);
    }
    
    // Check if sleeping or entering sleep before sending to agent
    const isSleepingOrEntering = 
      stateRef.current.agentState === 'sleeping' || 
      stateRef.current.agentState === 'entering_sleep';
      
    if (
      agentManagerRef.current?.getState() === 'connected' && 
      !isSleepingOrEntering // Block if sleeping or entering sleep
    ) {
      agentManagerRef.current.sendBinary(data);
    } else if (isSleepingOrEntering) {
      sleepLog('Skipping sendAudioData to agent (state:', stateRef.current.agentState, ')');
    }
  };

  // Start the connection
  const start = async (): Promise<void> => {
    try {
      log('Start method called');
      
      log('Initializing AudioManager (start method - re-check)...');
      await audioManagerRef.current!.initialize(); 
      log('AudioManager initialized (start method - re-check)');

      // Connect WebSockets
      if (transcriptionManagerRef.current) {
        log('Connecting Transcription WebSocket...');
        await transcriptionManagerRef.current.connect();
        log('Transcription WebSocket connected');
      } else {
        log('Transcription manager ref is null');
        throw new Error('Transcription manager not available');
      }
      
      if (agentManagerRef.current) {
        log('Connecting Agent WebSocket...');
        await agentManagerRef.current.connect();
        log('Agent WebSocket connected');
      } else {
        log('Agent manager ref is null');
        throw new Error('Agent manager not available');
      }
      
      // Start recording
      if (audioManagerRef.current) {
        log('Starting recording...');
        await audioManagerRef.current.startRecording();
        log('Recording started');
      } else {
        log('AudioManager ref is null before starting recording');
        throw new Error('Audio manager not available for recording');
      }
      
      log('Start method completed successfully');
    } catch (error) {
      log('Error within start method:', error);
      handleError({
        service: 'transcription',
        code: 'start_error',
        message: 'Failed to start voice interaction',
        details: error,
      });
      dispatch({ type: 'READY_STATE_CHANGE', isReady: false });
      throw error;
    }
  };

  // Stop the connection
  const stop = async (): Promise<void> => {
    log('Stopping voice interaction');
    
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
      
      if (agentManagerRef.current) {
        agentManagerRef.current.close();
      }
      
      // Signal not ready after stopping
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
      dispatch({ type: 'READY_STATE_CHANGE', isReady: false });
      return Promise.reject(error);
    }
  };

  // Update agent instructions
  const updateAgentInstructions = (payload: UpdateInstructionsPayload): void => {
    if (!agentManagerRef.current) {
      log('Cannot update instructions, agent manager not initialized');
      return;
    }
    
    log('Updating agent instructions:', payload);
    
    // Use UpdatePrompt message for the new agent API
    agentManagerRef.current.sendJSON({
      type: 'UpdatePrompt',
      prompt: payload.instructions || payload.context || '',
    });
  };

  // Clear all audio playback
  const clearAudio = (): void => {
    log('📢 clearAudio helper called');
    
    if (!audioManagerRef.current) {
      log('❌ Cannot clear audio: audioManagerRef.current is null');
      return;
    }
    
    try {
      log('🔴 Calling audioManager.clearAudioQueue()');
      audioManagerRef.current.clearAudioQueue();
      
      if (audioManagerRef.current['audioContext']) {
        log('🔄 Manipulating audio context time reference');
        const ctx = audioManagerRef.current['audioContext'] as AudioContext;
        try {
          const silentBuffer = ctx.createBuffer(1, 1024, ctx.sampleRate);
          const silentSource = ctx.createBufferSource();
          silentSource.buffer = silentBuffer;
          silentSource.connect(ctx.destination);
          silentSource.start();
        } catch (e) {
          log('⚠️ Error creating silent buffer:', e);
        }
      }
    } catch (err) {
      log('❌ Error in clearAudio:', err);
    }
    
    log('📢 clearAudio helper completed');
  };

  // Interrupt the agent
  const interruptAgent = (): void => {
    log('🔴 interruptAgent method called');
    clearAudio();
    log('🔴 Setting agent state to idle');
    sleepLog('Dispatching AGENT_STATE_CHANGE to idle (from interruptAgent)');
    dispatch({ type: 'AGENT_STATE_CHANGE', state: 'idle' });
    log('🔴 interruptAgent method completed');
  };

  // Put agent to sleep - Start the transition
  const sleep = (): void => {
    sleepLog('sleep() method called - initiating transition');
    isWaitingForUserVoiceAfterSleep.current = true;
    clearAudio();
    sleepLog('Dispatching AGENT_STATE_CHANGE to entering_sleep (from sleep())');
    dispatch({ type: 'AGENT_STATE_CHANGE', state: 'entering_sleep' });
  };
  
  // Wake agent from sleep
  const wake = (): void => {
    if (stateRef.current.agentState !== 'sleeping') {
        sleepLog(`wake() called but state is ${stateRef.current.agentState}, not \'sleeping\'. Aborting wake.`);
        return;
    }
    sleepLog('wake() method called from sleeping state');
    isWaitingForUserVoiceAfterSleep.current = false;
    sleepLog('Dispatching AGENT_STATE_CHANGE to listening (from wake())');
    dispatch({ type: 'AGENT_STATE_CHANGE', state: 'listening' });
  };
  
  // Toggle between sleep and wake states
  const toggleSleep = (): void => {
    sleepLog('toggleSleep() method called. Current state via ref:', stateRef.current.agentState);
    if (stateRef.current.agentState === 'sleeping') {
      wake();
    } else if (stateRef.current.agentState !== 'entering_sleep') { 
      sleep();
    } else {
      sleepLog('toggleSleep() called while already entering_sleep. No action.');
    }
    sleepLog('Sleep toggle action dispatched or ignored');
  };

  // Expose methods via ref - keep only start/stop, comment out agent methods
  useImperativeHandle(ref, () => ({
    start,
    stop,
    updateAgentInstructions,
    interruptAgent,
    sleep,
    wake,
    toggleSleep,
  }));

  // Render nothing (headless component)
  return null;
}

export default forwardRef(DeepgramVoiceInteraction); 