import React, { useRef, useState } from 'react';
import { 
  DeepgramVoiceInteraction, 
  DeepgramVoiceInteractionHandle, 
  TranscriptResponse,
  LLMResponse,
  AgentState
} from '../src';

/**
 * Example of using the DeepgramVoiceInteraction component
 * in a simple board meeting assistant application.
 */
function BoardMeetingAssistant() {
  // Create a ref to control the voice interaction
  const deepgramRef = useRef<DeepgramVoiceInteractionHandle>(null);
  
  // State for UI display
  const [isConnected, setIsConnected] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [agentResponses, setAgentResponses] = useState<string[]>([]);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [error, setError] = useState<string | null>(null);
  
  // Handler for component ready state
  const handleReady = (isReady: boolean) => {
    console.log('Component ready:', isReady);
  };
  
  // Handler for connection state changes
  const handleConnectionStateChange = (service: 'transcription' | 'agent', state: string) => {
    console.log(`${service} connection state:`, state);
    // Update connected state if both services are connected
    if (state === 'connected') {
      setIsConnected(true);
    } else if (state === 'closed' || state === 'error') {
      setIsConnected(false);
    }
  };
  
  // Handler for transcript updates
  const handleTranscriptUpdate = (transcript: TranscriptResponse) => {
    // Only display final transcripts
    if (transcript.is_final) {
      const text = transcript.alternatives[0].transcript;
      if (text.trim()) {
        setTranscripts(prev => [...prev, text]);
      }
    }
  };
  
  // Handler for agent state changes
  const handleAgentStateChange = (state: AgentState) => {
    console.log('Agent state:', state);
    setAgentState(state);
  };
  
  // Handler for agent utterances (text)
  const handleAgentUtterance = (utterance: LLMResponse) => {
    console.log('Agent said:', utterance.text);
    setAgentResponses(prev => [...prev, utterance.text]);
  };
  
  // Handler for errors
  const handleError = (err: any) => {
    console.error('Error:', err);
    setError(err.message || 'An unknown error occurred');
  };
  
  // Start the voice interaction
  const startInteraction = async () => {
    try {
      setError(null);
      await deepgramRef.current?.start();
    } catch (err: any) {
      setError(err.message || 'Failed to start');
    }
  };
  
  // Stop the voice interaction
  const stopInteraction = async () => {
    try {
      await deepgramRef.current?.stop();
    } catch (err: any) {
      setError(err.message || 'Failed to stop');
    }
  };
  
  // Interrupt the agent
  const interruptAgent = () => {
    deepgramRef.current?.interruptAgent();
  };
  
  // Update context for the agent
  const updateContext = () => {
    deepgramRef.current?.updateAgentInstructions({
      context: `This is a board meeting about quarterly results. The user is discussing revenue growth.`,
    });
  };
  
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Board Meeting Assistant</h1>
      
      {/* The DeepgramVoiceInteraction component */}
      <DeepgramVoiceInteraction
        ref={deepgramRef}
        apiKey={process.env.REACT_APP_DEEPGRAM_API_KEY || ''}
        transcriptionOptions={{
          model: 'nova-2',
          language: 'en-US',
          diarize: true,
          smart_format: true,
          punctuate: true,
          endpointing: true,
          vad_events: true
        }}
        agentOptions={{
          model: 'aura-polaris',
          language: 'en-US',
          voice: 'male-1',
          instructions: 'You are an AI assistant for a board meeting. Help answer questions about quarterly results, business strategy, and market trends.',
          endpointing: true
        }}
        onReady={handleReady}
        onConnectionStateChange={handleConnectionStateChange}
        onTranscriptUpdate={handleTranscriptUpdate}
        onAgentStateChange={handleAgentStateChange}
        onAgentUtterance={handleAgentUtterance}
        onUserStartedSpeaking={() => console.log('User started speaking')}
        onUserStoppedSpeaking={() => console.log('User stopped speaking')}
        onError={handleError}
        debug={true}
      />
      
      {/* Status indicator */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '10px', 
        backgroundColor: isConnected ? '#e6ffe6' : '#ffe6e6',
        borderRadius: '5px'
      }}>
        <strong>Status:</strong> {isConnected ? 'Connected' : 'Disconnected'}
        <div>Agent state: {agentState}</div>
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      </div>
      
      {/* Control buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={startInteraction} 
          disabled={isConnected}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Start
        </button>
        <button 
          onClick={stopInteraction} 
          disabled={!isConnected}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Stop
        </button>
        <button 
          onClick={interruptAgent}
          disabled={!isConnected || agentState !== 'speaking'}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Interrupt
        </button>
        <button 
          onClick={updateContext}
          disabled={!isConnected}
          style={{ padding: '8px 16px' }}
        >
          Update Context
        </button>
      </div>
      
      {/* Display area */}
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Transcripts */}
        <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '5px', padding: '10px', minHeight: '300px' }}>
          <h2>Transcripts</h2>
          <div>
            {transcripts.length > 0 ? (
              transcripts.map((text, index) => (
                <p key={index} style={{ margin: '8px 0' }}>{text}</p>
              ))
            ) : (
              <p style={{ color: '#666' }}>No transcripts yet. Start speaking after connecting.</p>
            )}
          </div>
        </div>
        
        {/* Agent Responses */}
        <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: '5px', padding: '10px', minHeight: '300px' }}>
          <h2>Agent Responses</h2>
          <div>
            {agentResponses.length > 0 ? (
              agentResponses.map((text, index) => (
                <p key={index} style={{ margin: '8px 0' }}>{text}</p>
              ))
            ) : (
              <p style={{ color: '#666' }}>No agent responses yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BoardMeetingAssistant; 