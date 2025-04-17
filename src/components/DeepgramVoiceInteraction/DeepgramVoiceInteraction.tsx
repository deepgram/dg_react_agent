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
  }, [state]);

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
      agentUrl: endpointConfig.agentUrl || DEFAULT_ENDPOINTS.agentUrl,
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

    // Create agent WebSocket manager
    agentManagerRef.current = new WebSocketManager({
      url: endpoints.agentUrl,
      apiKey,
      service: 'agent',
      // No query params for agent - we'll send settings after connection
      debug,
    });

    // Create audio manager
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
  }, [apiKey]);

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
    // Check for VAD events if enabled
    if (data.type === 'VADEvent') {
      const isSpeaking = data.is_speech;
      
      // Use stateRef to check the LATEST state
      if (stateRef.current.agentState === 'sleeping') {
        sleepLog('Ignoring VAD event (isSpeaking:', isSpeaking, ') - agent is sleeping');
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

    // Log all received messages for debugging
    // log('Received transcription message:', data); // Keep general log if needed

    // Handle transcript
    if (data.type === 'Results' || data.type === 'Transcript') {
      // Use stateRef to check the LATEST state
      if (stateRef.current.agentState === 'sleeping') {
        sleepLog('Ignoring transcript - agent is sleeping');
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
    // log('Received agent message:', data); // Keep general log if needed
    
    // Handle Settings Applied confirmation
    if (data.type === 'SettingsApplied') {
      log('Agent settings applied successfully');
      return;
    }
    
    // Handle Welcome message 
    if (data.type === 'Welcome') {
      log('Connected to agent service:', data.request_id);
      return;
    }
    
    // Handle agent state messages
    if (data.type === 'UserStartedSpeaking') {
      sleepLog('UserStartedSpeaking message received');
      
      // Use stateRef to check the LATEST state
      if (stateRef.current.agentState === 'sleeping') {
        sleepLog('Agent is sleeping - ignoring UserStartedSpeaking event');
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
    
    // Use stateRef to check the LATEST state before sending to agent
    if (
      agentManagerRef.current?.getState() === 'connected' && 
      stateRef.current.agentState !== 'sleeping'
    ) {
      agentManagerRef.current.sendBinary(data);
    } else if (stateRef.current.agentState === 'sleeping') {
      sleepLog('Skipping sendAudioData to agent - agent is sleeping');
    }
  };

  // Start the connection
  const start = async (): Promise<void> => {
    try {
      log('Start method called'); // Log entry
      
      // Initialize audio manager if not already - Removed check, should be initialized by useEffect
      // if (audioManagerRef.current) { ... } - Check assumed true here
      
      log('Initializing AudioManager (start method - re-check)...');
      await audioManagerRef.current!.initialize(); // Ensure initialized if needed
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
        // This case should be caught earlier, but added for completeness
        log('AudioManager ref is null before starting recording');
        throw new Error('Audio manager not available for recording');
      }
      
      // log('Dispatching READY_STATE_CHANGE to true'); // Removed - now done in useEffect
      // dispatch({ type: 'READY_STATE_CHANGE', isReady: true }); // Removed
      log('Start method completed successfully'); // Log success
    } catch (error) {
      log('Error within start method:', error); // Log internal error
      handleError({
        service: 'transcription', // Or determine service based on error source
        code: 'start_error',
        message: 'Failed to start voice interaction',
        details: error,
      });
      // Signal not ready on start failure
      dispatch({ type: 'READY_STATE_CHANGE', isReady: false });
      throw error; // Re-throw to be caught by the caller if needed
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
      // Signal not ready on stop failure
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
      // Try multiple approaches to ensure audio is stopped
      log('🔴 Calling audioManager.clearAudioQueue()');
      audioManagerRef.current.clearAudioQueue();
      
      // Also try to create and manipulate current time
      if (audioManagerRef.current['audioContext']) {
        log('🔄 Manipulating audio context time reference');
        const ctx = audioManagerRef.current['audioContext'] as AudioContext;
        
        // Create a silent buffer and play it immediately
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
    // First, clear all audio
    clearAudio();
    log('🔴 Setting agent state to idle');
    sleepLog('Dispatching AGENT_STATE_CHANGE to idle (from interruptAgent)');
    dispatch({ type: 'AGENT_STATE_CHANGE', state: 'idle' });
    log('🔴 interruptAgent method completed');
  };

  // Put agent to sleep
  const sleep = (): void => {
    sleepLog('sleep() method called');
    isWaitingForUserVoiceAfterSleep.current = true;
    clearAudio();
    sleepLog('Dispatching AGENT_STATE_CHANGE to sleeping (from sleep())');
    dispatch({ type: 'AGENT_STATE_CHANGE', state: 'sleeping' });
  };
  
  // Wake agent from sleep
  const wake = (): void => {
    sleepLog('wake() method called');
    isWaitingForUserVoiceAfterSleep.current = false;
    sleepLog('Dispatching AGENT_STATE_CHANGE to listening (from wake())');
    dispatch({ type: 'AGENT_STATE_CHANGE', state: 'listening' });
  };
  
  // Toggle between sleep and wake states
  const toggleSleep = (): void => {
    sleepLog('toggleSleep() method called. Current state via ref:', stateRef.current.agentState);
    if (stateRef.current.agentState === 'sleeping') {
      wake();
    } else {
      sleep();
    }
    sleepLog('Sleep toggle action dispatched');
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