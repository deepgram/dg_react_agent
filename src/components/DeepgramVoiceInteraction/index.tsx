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

// Default endpoints
const DEFAULT_ENDPOINTS = {
  transcriptionUrl: 'wss://api.deepgram.com/v1/listen',
  agentUrl: 'wss://agent.deepgram.com/v1/agent/converse',
};

/**
 * DeepgramVoiceInteraction component
 * 
 * A headless React component for real-time transcription and/or agent interaction using Deepgram's WebSocket APIs.
 * 
 * @component
 * 
 * IMPORTANT: The component can operate in three distinct modes depending on the options provided:
 * 
 * 1. Dual Mode (Transcription + Agent):
 *    - Provide both `transcriptionOptions` and `agentOptions` props
 *    - Uses separate WebSocket connections for transcription and agent
 *    - Enables independent transcription with full customization options
 *    - Can display live transcripts while also having agent conversations
 * 
 * 2. Transcription-Only Mode:
 *    - Provide `transcriptionOptions` prop, completely OMIT `agentOptions` prop
 *    - Only connects to transcription service
 *    - Ideal for applications that only need speech-to-text capabilities
 *    - Lighter weight without agent or audio playback functionality
 * 
 * 3. Agent-Only Mode:
 *    - Provide `agentOptions` prop, completely OMIT `transcriptionOptions` prop
 *    - Only connects to agent service (agent handles its own transcription internally)
 *    - Ideal for voice assistant applications that don't need separate transcription results
 *    - Agent uses its own internal transcription via the `listenModel` option
 * 
 * IMPORTANT: To use a specific mode, you must completely OMIT (not pass) the options prop
 * for any service you don't want to use. Passing an empty object ({}) will still initialize
 * that service.
 */
function DeepgramVoiceInteraction(
  props: DeepgramVoiceInteractionProps,
  ref: React.Ref<DeepgramVoiceInteractionHandle>
) {
  const {
    apiKey,
    // Change defaults from {} to undefined for stability
    transcriptionOptions, // = {}, - remove default
    agentOptions, // = {}, - remove default
    endpointConfig,
    onReady,
    onConnectionStateChange,
    onTranscriptUpdate,
    onAgentStateChange,
    onAgentUtterance,
    onUserMessage,
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

  // Managers - these may be null if the service is not required
  const transcriptionManagerRef = useRef<WebSocketManager | null>(null);
  const agentManagerRef = useRef<WebSocketManager | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  
  // Tracking user speaking state
  const userSpeakingRef = useRef(false);
  
  // Track if we're waiting for user voice after waking from sleep
  const isWaitingForUserVoiceAfterSleep = useRef(false);
  
  // Refs to track previous state values to prevent redundant callback calls
  const prevIsReadyRef = useRef<boolean | undefined>(undefined);
  const prevAgentStateRef = useRef<AgentState | undefined>(undefined);
  const prevIsPlayingRef = useRef<boolean | undefined>(undefined);
  
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
  }, [state]);

  // Handle errors
  const handleError = (error: DeepgramError) => {
    log('Error:', error);
    dispatch({ type: 'ERROR', message: error.message });
    onError?.(error);
  };

  // Initialize the component based on provided options
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

    // Determine which services are being configured
    const isTranscriptionConfigured = !!transcriptionOptions;
    const isAgentConfigured = !!agentOptions;
    
    if (!isTranscriptionConfigured && !isAgentConfigured) {
      log('No services configured! Either transcriptionOptions or agentOptions must be provided.');
      handleError({
        service: 'transcription',
        code: 'invalid_configuration',
        message: 'Either transcriptionOptions or agentOptions must be provided',
      });
      return;
    }
    
    // Log which services are being configured
    log(`Initializing in ${isTranscriptionConfigured && isAgentConfigured ? 'DUAL MODE' : 
      isTranscriptionConfigured ? 'TRANSCRIPTION-ONLY MODE' : 'AGENT-ONLY MODE'}`);

    // Prepare endpoints, using defaults ONLY if endpointConfig prop is not provided
    const currentEndpointConfig = endpointConfig || {};
    const endpoints = {
      transcriptionUrl: currentEndpointConfig.transcriptionUrl || DEFAULT_ENDPOINTS.transcriptionUrl,
      agentUrl: currentEndpointConfig.agentUrl || DEFAULT_ENDPOINTS.agentUrl,
    };

    // --- Event listener cleanup functions ---
    let transcriptionUnsubscribe: () => void = () => {};
    let agentUnsubscribe: () => void = () => {};
    let audioUnsubscribe: () => void = () => {};

    // --- TRANSCRIPTION SETUP (CONDITIONAL) ---
    if (isTranscriptionConfigured) {
      let transcriptionUrl = endpoints.transcriptionUrl;
      let transcriptionQueryParams: Record<string, string | boolean | number> = {};

      // Base transcription parameters
      const baseTranscriptionParams = {
      ...transcriptionOptions,
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
        url: transcriptionUrl,
      apiKey,
      service: 'transcription',
        queryParams: useKeytermPrompting ? undefined : transcriptionQueryParams, 
      debug,
    });

    // Set up event listeners for transcription WebSocket
      transcriptionUnsubscribe = transcriptionManagerRef.current.addEventListener((event) => {
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
    } else {
      log('Transcription service not configured, skipping setup');
    }

    // --- AGENT SETUP (CONDITIONAL) ---
    if (isAgentConfigured) {
      // Create Agent WebSocket manager
      agentManagerRef.current = new WebSocketManager({
        url: endpoints.agentUrl,
        apiKey,
        service: 'agent',
        debug,
      });

    // Set up event listeners for agent WebSocket
      agentUnsubscribe = agentManagerRef.current.addEventListener((event) => {
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
    } else {
      log('Agent service not configured, skipping setup');
    }

    // --- AUDIO SETUP (NEEDED FOR EITHER SERVICE) ---
    // We need audio for recording (transcription) or playback (agent)
    if (isTranscriptionConfigured || isAgentConfigured) {
      // Create audio manager
      audioManagerRef.current = new AudioManager({
        debug,
      });

    // Set up event listeners for audio manager
      audioUnsubscribe = audioManagerRef.current.addEventListener((event) => {
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
          
          // Determine if the component is ready based on configured services
          // For now, we consider it ready as soon as the audio manager is ready
          // The actual WebSocket connections will be made in the start() method
        dispatch({ type: 'READY_STATE_CHANGE', isReady: true }); 
      })
      .catch(error => {
        handleError({
          service: 'transcription',
          code: 'audio_init_error',
          message: 'Failed to initialize audio',
          details: error,
        });
        dispatch({ type: 'READY_STATE_CHANGE', isReady: false });
      });
    } else {
      log('Neither transcription nor agent configured, skipping audio setup');
      // This should never happen due to the check at the beginning of the effect
    }

    // Clean up
    return () => {
      transcriptionUnsubscribe();
      agentUnsubscribe();
      audioUnsubscribe();
      
      if (transcriptionManagerRef.current) {
        transcriptionManagerRef.current.close();
      transcriptionManagerRef.current = null;
      }
      
      if (agentManagerRef.current) {
        agentManagerRef.current.close();
      agentManagerRef.current = null;
      }
      
      if (audioManagerRef.current) {
        audioManagerRef.current.dispose();
      audioManagerRef.current = null;
      }
      
      // Ensure state is reset on unmount
      dispatch({ type: 'READY_STATE_CHANGE', isReady: false });
      dispatch({ type: 'CONNECTION_STATE_CHANGE', service: 'transcription', state: 'closed' });
      dispatch({ type: 'CONNECTION_STATE_CHANGE', service: 'agent', state: 'closed' });
      dispatch({ type: 'AGENT_STATE_CHANGE', state: 'idle' });
      dispatch({ type: 'RECORDING_STATE_CHANGE', isRecording: false });
      dispatch({ type: 'PLAYBACK_STATE_CHANGE', isPlaying: false });
    };
  }, [apiKey, transcriptionOptions, agentOptions, endpointConfig, debug]); 

  // Notify ready state changes ONLY when the value actually changes
  useEffect(() => {
    if (onReady && state.isReady !== prevIsReadyRef.current) {
      log('Notifying parent: isReady changed to', state.isReady);
      onReady(state.isReady);
      prevIsReadyRef.current = state.isReady;
    }
  }, [state.isReady, onReady]);

  // Notify agent state changes ONLY when the value actually changes
  useEffect(() => {
    if (onAgentStateChange && state.agentState !== prevAgentStateRef.current) {
      log('Notifying parent: agentState changed to', state.agentState);
      onAgentStateChange(state.agentState);
      prevAgentStateRef.current = state.agentState;
    }
  }, [state.agentState, onAgentStateChange]);

  // Notify playback state changes ONLY when the value actually changes
  useEffect(() => {
    if (onPlaybackStateChange && state.isPlaying !== prevIsPlayingRef.current) {
      log('Notifying parent: isPlaying changed to', state.isPlaying);
      onPlaybackStateChange(state.isPlaying);
      prevIsPlayingRef.current = state.isPlaying;
    }
  }, [state.isPlaying, onPlaybackStateChange]);

  // Handle transcription messages - only relevant if transcription is configured
  const handleTranscriptionMessage = (data: any) => {
    // Skip processing if transcription service isn't configured
    if (!transcriptionManagerRef.current) {
      log('Received unexpected transcription message but service is not configured:', data);
      return;
    }
    
    // Check if agent is in sleep mode
    const isSleepingOrEntering = 
      agentManagerRef.current && (
      stateRef.current.agentState === 'sleeping' || 
        stateRef.current.agentState === 'entering_sleep'
      );
      
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

  // Send agent settings after connection is established - only if agent is configured
  const sendAgentSettings = () => {
    if (!agentManagerRef.current || !agentOptions) {
      log('Cannot send agent settings: agent manager not initialized or agentOptions not provided');
      return;
    }
    
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

  // Handle agent messages - only relevant if agent is configured
  const handleAgentMessage = (data: any) => {
    // Skip processing if agent service isn't configured
    if (!agentManagerRef.current) {
      log('Received unexpected agent message but service is not configured:', data);
      return;
    }
    
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
    if (data.type === 'ConversationText') {
      if (data.role === 'assistant') {
        const response: LLMResponse = {
          type: 'llm',
          text: data.content || '',
          metadata: data,
        };
        
        onAgentUtterance?.(response);
        return;
      } 
      else if (data.role === 'user') {
        const response = {
          type: 'user' as const,
          text: data.content || '',
          metadata: data,
        };
        
        onUserMessage?.(response);
        return;
      }
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

  // Handle agent audio - only relevant if agent is configured
  const handleAgentAudio = (data: ArrayBuffer) => {
    // Skip processing if agent service isn't configured
    if (!agentManagerRef.current) {
      log('Received unexpected agent audio but service is not configured');
      return;
    }
    
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

  // Send audio data to WebSockets - conditionally route based on configuration
  const sendAudioData = (data: ArrayBuffer) => {
    // Send to transcription service if configured and connected
    if (transcriptionManagerRef.current?.getState() === 'connected') {
      transcriptionManagerRef.current.sendBinary(data);
    }
    
    // Send to agent service if configured, connected, and not in sleep mode
    if (agentManagerRef.current) {
    // Check if sleeping or entering sleep before sending to agent
    const isSleepingOrEntering = 
      stateRef.current.agentState === 'sleeping' || 
      stateRef.current.agentState === 'entering_sleep';
      
      if (agentManagerRef.current.getState() === 'connected' && !isSleepingOrEntering) {
      agentManagerRef.current.sendBinary(data);
    } else if (isSleepingOrEntering) {
      sleepLog('Skipping sendAudioData to agent (state:', stateRef.current.agentState, ')');
      }
    }
  };

  // Start the connection
  const start = async (): Promise<void> => {
    try {
      log('Start method called');
      
      // Initialize audio if available (should already be initialized from the main useEffect)
      if (audioManagerRef.current) {
        try {
          log('Ensuring AudioManager is initialized...');
          await audioManagerRef.current.initialize();
          log('AudioManager initialized');
        } catch (error) {
          // The initialize method is idempotent and returns early if already initialized
          // If we get here, there was an actual error initializing
          log('Error initializing AudioManager:', error);
          throw error;
        }
      }

      // Connect transcription WebSocket if configured
      if (transcriptionManagerRef.current) {
        log('Connecting Transcription WebSocket...');
        await transcriptionManagerRef.current.connect();
        log('Transcription WebSocket connected');
      } else {
        log('Transcription manager not configured, skipping connection');
      }
      
      // Connect agent WebSocket if configured
      if (agentManagerRef.current) {
        log('Connecting Agent WebSocket...');
        await agentManagerRef.current.connect();
        log('Agent WebSocket connected');
      } else {
        log('Agent manager not configured, skipping connection');
      }
      
      // Start recording if audio manager is available (needed for either service)
      if (audioManagerRef.current) {
        log('Starting recording...');
        await audioManagerRef.current.startRecording();
        log('Recording started');
      } else {
        log('AudioManager not initialized, cannot start recording');
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
      // Send CloseStream message to finalize any pending transcriptions (if configured)
      if (transcriptionManagerRef.current) {
        log('Sending CloseStream message to finalize transcription');
        transcriptionManagerRef.current.sendCloseStream();
      }
      
      // Stop recording if audio manager is available
      if (audioManagerRef.current) {
        audioManagerRef.current.stopRecording();
      }
      
      // Add a small delay to allow final transcripts to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close WebSockets if configured
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

  // Update agent instructions - only if agent is configured
  const updateAgentInstructions = (payload: UpdateInstructionsPayload): void => {
    if (!agentManagerRef.current) {
      log('Cannot update instructions: agent manager not initialized or not configured');
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
      
      // Additional audio cleanup
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

  // Interrupt the agent - only if agent is configured
  const interruptAgent = (): void => {
    log('🔴 interruptAgent method called');
    
    if (!agentManagerRef.current) {
      log('Cannot interrupt agent: agent manager not initialized or not configured');
      return;
    }
    
    clearAudio();
    log('🔴 Setting agent state to idle');
    sleepLog('Dispatching AGENT_STATE_CHANGE to idle (from interruptAgent)');
    dispatch({ type: 'AGENT_STATE_CHANGE', state: 'idle' });
    log('🔴 interruptAgent method completed');
  };

  // Put agent to sleep - only if agent is configured
  const sleep = (): void => {
    if (!agentManagerRef.current) {
      log('Cannot put agent to sleep: agent manager not initialized or not configured');
      return;
    }
    
    sleepLog('sleep() method called - initiating transition');
    isWaitingForUserVoiceAfterSleep.current = true;
    clearAudio();
    sleepLog('Dispatching AGENT_STATE_CHANGE to entering_sleep (from sleep())');
    dispatch({ type: 'AGENT_STATE_CHANGE', state: 'entering_sleep' });
  };
  
  // Wake agent from sleep - only if agent is configured
  const wake = (): void => {
    if (!agentManagerRef.current) {
      log('Cannot wake agent: agent manager not initialized or not configured');
      return;
    }
    
    if (stateRef.current.agentState !== 'sleeping') {
        sleepLog(`wake() called but state is ${stateRef.current.agentState}, not 'sleeping'. Aborting wake.`);
        return;
    }
    
    sleepLog('wake() method called from sleeping state');
    isWaitingForUserVoiceAfterSleep.current = false;
    sleepLog('Dispatching AGENT_STATE_CHANGE to listening (from wake())');
    dispatch({ type: 'AGENT_STATE_CHANGE', state: 'listening' });
  };
  
  // Toggle between sleep and wake states - only if agent is configured
  const toggleSleep = (): void => {
    if (!agentManagerRef.current) {
      log('Cannot toggle agent sleep state: agent manager not initialized or not configured');
      return;
    }
    
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

  // Inject a message directly to the agent
  const injectAgentMessage = (message: string): void => {
    if (!agentManagerRef.current) {
      log('Cannot inject message: agent manager not initialized or not configured');
      return;
    }
    
    log('Injecting agent message:', message);
    
    agentManagerRef.current.sendJSON({
      type: 'InjectAgentMessage',
      content: message
    });
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    start,
    stop,
    updateAgentInstructions,
    interruptAgent,
    sleep,
    wake,
    toggleSleep,
    injectAgentMessage,
  }));

  // Render nothing (headless component)
  return null;
}

export default forwardRef(DeepgramVoiceInteraction); 