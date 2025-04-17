console.log('[TOP-LEVEL] DeepgramVoiceInteractionInner.tsx loaded')
"use client";

import React, { 
  forwardRef, 
  useImperativeHandle, 
  useRef, 
  useEffect,
  useCallback
} from "react";

import {
  useDeepgramConnection,
  useAudio,
  useVoiceBot
} from "../../contexts";

import {
  AgentResponseType,
  AgentMessageType,
  AgentSettingsMessage,
  UpdatePromptMessage,
  LLMResponse,
  ConversationRole,
  DeepgramVoiceInteractionProps,
  DeepgramVoiceInteractionHandle,
  UpdateInstructionsPayload,
  BehindScenesEventType
} from "../../types";

/**
 * Inner component with access to all contexts
 */
function DeepgramVoiceInteractionInner(
  props: DeepgramVoiceInteractionProps, 
  ref: React.Ref<DeepgramVoiceInteractionHandle>
) {
  const {
    transcriptionOptions,
    agentOptions,
    onReady,
    onTranscriptUpdate,
    onAgentStateChange,
    onAgentUtterance,
    onUserStartedSpeaking,
    onUserStoppedSpeaking,
    onError,
    debug = false
  } = props;
  
  // Get access to all contexts
  const {
    agentSocket,
    transcriptionSocket,
    connectToAgent,
    connectToTranscription,
    disconnectAgent,
    disconnectTranscription
  } = useDeepgramConnection();
  
  const {
    audioManager,
    startRecording,
    stopRecording,
    clearAudioQueue,
    queueAudio
  } = useAudio();
  
  const {
    status,
    startSpeaking,
    startListening,
    startThinking,
    startSleeping,
    toggleSleep,
    addVoicebotMessage,
    addBehindScenesEvent,
    isWaitingForUserVoiceAfterSleep
  } = useVoiceBot();
  
  // Track ready state
  const isReadyRef = useRef(false);
  
  // Settings have been applied
  const settingsAppliedRef = useRef(false);
  
  // Log helper
  const log = useCallback(
    (...args: any[]) => {
      if (debug) {
        console.log("[DeepgramVoiceInteraction]", ...args);
      }
    },
    [debug]
  );
  
  // Handle agent WebSocket messages
  useEffect(() => {
    log("[EFFECT] Attaching agentSocket message handler", agentSocket)
    if (!agentSocket) return;
    
    const handleAgentMessage = async (event: MessageEvent) => {
      // Handle text messages (JSON)
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          log("Agent message:", data);
          
          // Process different message types
          log("Switching on data.type:", data.type)
          switch (data.type) {
            case AgentResponseType.WELCOME:
              log("Agent connection established");
              // Send settings on welcome
              if (agentOptions && !settingsAppliedRef.current) {
                sendAgentSettings();
              }
              break;
              
            case AgentResponseType.SETTINGS_APPLIED:
              log("Agent settings applied");
              settingsAppliedRef.current = true;
              
              addBehindScenesEvent({
                type: BehindScenesEventType.SETTINGS_APPLIED
              });
              
              // Initialize ready state if needed
              if (!isReadyRef.current) {
                isReadyRef.current = true;
                if (onReady) {
                  onReady(true);
                }
              }
              break;
              
            case AgentResponseType.PROMPT_UPDATED:
              log("Agent prompt updated");
              break;
              
            case AgentResponseType.CONVERSATION_TEXT:
              // New text from user or assistant
              log("Conversation text:", data.role, data.content);
              
              // Track conversation
              if (data.role === "assistant") {
                addVoicebotMessage({ assistant: data.content });
                
                if (onAgentUtterance) {
                  onAgentUtterance({
                    type: 'llm',
                    text: data.content
                  });
                }
              } else if (data.role === "user") {
                addVoicebotMessage({ user: data.content });
              }
              
              addBehindScenesEvent({
                type: BehindScenesEventType.CONVERSATION_TEXT,
                role: data.role as ConversationRole,
                content: data.content
              });
              break;
              
            case AgentResponseType.USER_STARTED_SPEAKING:
              log("User started speaking - Clearing agent audio queue (barge-in)");
              log("About to call clearAudioQueue", { clearAudioQueueType: typeof clearAudioQueue, clearAudioQueue });
              clearAudioQueue(); // Barge-in: Stop agent playback
              
              // If we were waiting for user voice after sleep, we can now receive audio
              if (isWaitingForUserVoiceAfterSleep.current) {
                // Use the setter function from useVoiceBot context instead
                // This assumes the isWaitingForUserVoiceAfterSleep.current is actually controlled by the context
                startListening(true); // This will indirectly reset the waiting state
              }
              
              addBehindScenesEvent({
                type: BehindScenesEventType.USER_STARTED_SPEAKING
              });
              
              if (onUserStartedSpeaking) {
                onUserStartedSpeaking();
              }
              break;
              
            case AgentResponseType.AGENT_THINKING:
              log("Agent thinking:", data.content);
              startThinking();
              
              if (onAgentStateChange) {
                onAgentStateChange('thinking');
              }
              break;
              
            case AgentResponseType.AGENT_STARTED_SPEAKING:
              log("Agent started speaking");
              startSpeaking();
              
              addBehindScenesEvent({
                type: BehindScenesEventType.AGENT_STARTED_SPEAKING
              });
              
              if (onAgentStateChange) {
                onAgentStateChange('speaking');
              }
              break;
              
            case AgentResponseType.AGENT_AUDIO_DONE:
              log("Agent audio done");
              
              addBehindScenesEvent({
                type: BehindScenesEventType.AGENT_AUDIO_DONE
              });
              
              // We go back to listening mode after audio is done
              startListening();
              
              if (onAgentStateChange) {
                onAgentStateChange('listening');
              }
              break;
              
            case AgentResponseType.FUNCTION_CALL_REQUEST:
              log("Function call request:", data.functions);
              // Would handle function calls here in the future
              break;
              
            case AgentResponseType.ERROR:
              log("Agent error:", data.code, data.description);
              
              if (onError) {
                onError({
                  service: 'agent',
                  code: data.code || 'unknown_error',
                  message: data.description || 'Unknown error',
                });
              }
              break;
              
            case AgentResponseType.WARNING:
              log("Agent warning:", data.code, data.description);
              break;
              
            default:
              log("[SWITCH DEFAULT] Unknown or unhandled agent message type:", data.type, "(expected:", AgentResponseType.USER_STARTED_SPEAKING, ")");
          }
        } catch (error) {
          log("Error parsing agent message:", error);
        }
      } 
      // Handle binary audio data
      else if (event.data instanceof ArrayBuffer) {
        log("Received agent audio data:", event.data.byteLength, "bytes");
        
        // Queue audio for playback
        try {
          // Skip audio if we're waiting for user voice after sleep
          if (isWaitingForUserVoiceAfterSleep.current) {
            log("Skipping audio playback because waiting for user voice after sleep");
            return;
          }
          
          await queueAudio(event.data);
        } catch (error) {
          log("Error queueing audio:", error);
          
          if (onError) {
            onError({
              service: 'agent',
              code: 'audio_playback_error',
              message: 'Failed to queue audio for playback',
              details: error,
            });
          }
        }
      }
    };
    
    agentSocket.addEventListener('message', handleAgentMessage);
    
    return () => {
      agentSocket.removeEventListener('message', handleAgentMessage);
    };
  }, [
    agentSocket,
    queueAudio,
    startSpeaking,
    startListening,
    startThinking,
    onReady,
    onUserStartedSpeaking,
    onAgentStateChange,
    onAgentUtterance,
    onError,
    log,
    agentOptions,
    isWaitingForUserVoiceAfterSleep,
    addVoicebotMessage,
    addBehindScenesEvent
  ]);
  
  // Handle transcription WebSocket messages
  useEffect(() => {
    if (!transcriptionSocket) return;
    
    const handleTranscriptionMessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          log("Transcription data:", data);
          
          if (onTranscriptUpdate) {
            onTranscriptUpdate(data);
          }
        } catch (error) {
          log("Error parsing transcription message:", error);
        }
      }
    };
    
    transcriptionSocket.addEventListener('message', handleTranscriptionMessage);
    
    return () => {
      transcriptionSocket.removeEventListener('message', handleTranscriptionMessage);
    };
  }, [transcriptionSocket, onTranscriptUpdate, log]);
  
  // Send settings to the agent WebSocket
  const sendAgentSettings = useCallback(() => {
    if (!agentSocket || agentSocket.readyState !== WebSocket.OPEN) {
      log("Cannot send settings: Agent WebSocket not open");
      return;
    }
    
    if (!agentOptions) {
      log("No agent options provided");
      return;
    }
    
    log("Sending agent settings");
    
    // Build settings message based on the VA-API spec
    const settings: AgentSettingsMessage = {
      type: AgentMessageType.SETTINGS,
      audio: {
        input: {
          encoding: "linear16",
          sample_rate: 16000
        },
        output: {
          encoding: "mp3",
          sample_rate: 24000
        }
      },
      agent: {
        language: agentOptions.language || "en",
        listen: {
          provider: {
            type: "deepgram",
            model: agentOptions.listenModel || "nova-2"
          }
        },
        think: {
          provider: {
            type: agentOptions.thinkProviderType || "open_ai",
            model: agentOptions.thinkModel || "gpt-4-turbo",
            temperature: agentOptions.thinkTemperature
          },
          prompt: agentOptions.instructions
        },
        speak: {
          provider: {
            type: agentOptions.speakProvider || "deepgram",
            voice: agentOptions.voice
          }
        },
        greeting: agentOptions.greeting
      }
    };
    
    try {
      agentSocket.send(JSON.stringify(settings));
    } catch (error) {
      log("Error sending settings:", error);
      
      if (onError) {
        onError({
          service: 'agent',
          code: 'settings_error',
          message: 'Failed to send agent settings',
          details: error,
        });
      }
    }
  }, [agentSocket, agentOptions, log, onError]);
  
  // Update agent instructions
  const updateAgentInstructions = useCallback((payload: UpdateInstructionsPayload) => {
    if (!agentSocket || agentSocket.readyState !== WebSocket.OPEN) {
      log("Cannot update instructions: Agent WebSocket not open");
      return;
    }
    
    log("Updating agent instructions:", payload);
    
    const promptMessage: UpdatePromptMessage = {
      type: AgentMessageType.UPDATE_PROMPT,
      prompt: payload.instructions || payload.context || ""
    };
    
    try {
      agentSocket.send(JSON.stringify(promptMessage));
    } catch (error) {
      log("Error updating instructions:", error);
      
      if (onError) {
        onError({
          service: 'agent',
          code: 'update_instructions_error',
          message: 'Failed to update agent instructions',
          details: error,
        });
      }
    }
  }, [agentSocket, log, onError]);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    // Start both connections and recording
    start: async () => {
      try {
        log("Starting connections and recording");
        await connectToAgent();
        await connectToTranscription();
        await startRecording();
        startListening();
        return;
      } catch (error) {
        log("Failed to start:", error);
        
        if (onError) {
          onError({
            service: 'transcription',
            code: 'start_error',
            message: 'Failed to start voice interaction',
            details: error,
          });
        }
        
        throw error;
      }
    },
    
    // Stop everything
    stop: async () => {
      log("Stopping all connections and recording");
      stopRecording();
      disconnectAgent();
      disconnectTranscription();
      clearAudioQueue();
    },
    
    // Update agent instructions
    updateAgentInstructions,
    
    // Interrupt agent speech
    interruptAgent: () => {
      log("Interrupting agent speech");
      clearAudioQueue();
      
      // Add an interruption event
      addBehindScenesEvent({
        type: BehindScenesEventType.INTERRUPTION
      });
      
      // Go back to listening mode
      startListening();
      
      if (onAgentStateChange) {
        onAgentStateChange('listening');
      }
    },
    
    // Sleep mode
    sleep: () => {
      log("Putting agent to sleep");
      startSleeping();
      
      if (onAgentStateChange) {
        onAgentStateChange('sleeping');
      }
    },
    
    // Wake mode
    wake: () => {
      log("Waking agent up");
      startListening(true);
      
      if (onAgentStateChange) {
        onAgentStateChange('listening');
      }
    },
    
    // Toggle sleep/wake
    toggleSleep: () => {
      log("Toggling sleep/wake state");
      toggleSleep();
      
      if (onAgentStateChange) {
        onAgentStateChange(status === 'sleeping' ? 'listening' : 'sleeping');
      }
    }
  }), [
    connectToAgent,
    connectToTranscription,
    startRecording,
    stopRecording,
    disconnectAgent,
    disconnectTranscription,
    clearAudioQueue,
    startListening,
    startSleeping,
    toggleSleep,
    updateAgentInstructions,
    log,
    status,
    onAgentStateChange,
    onError,
    addBehindScenesEvent
  ]);
  
  // Empty render as this is just a controller component
  return null;
}

export default forwardRef(DeepgramVoiceInteractionInner); 