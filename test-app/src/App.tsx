import React, { useRef, useState, useCallback } from 'react';
import { 
  DeepgramVoiceInteraction, 
  DeepgramVoiceInteractionHandle,
  TranscriptResponse,
  LLMResponse,
  AgentState,
  ConnectionState,
  ServiceType,
  DeepgramError
} from '../../src';

function App() {
  const deepgramRef = useRef<DeepgramVoiceInteractionHandle>(null);
  
  // State for UI
  const [isReady, setIsReady] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [connectionStates, setConnectionStates] = useState<Record<ServiceType, ConnectionState>>({
    transcription: 'closed',
    agent: 'closed'
  });
  const [logs, setLogs] = useState<string[]>([]);
  
  // Helper to add logs - memoized
  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  }, []); // No dependencies, created once
  
  // Event handlers - memoized with useCallback
  const handleReady = useCallback((ready: boolean) => {
    setIsReady(ready);
    addLog(`Component is ${ready ? 'ready' : 'not ready'}`);
  }, [addLog]); // Depends on addLog
  
  const handleTranscriptUpdate = useCallback((transcript: TranscriptResponse) => {
    if (transcript.alternatives?.[0]?.transcript) {
      const text = transcript.alternatives[0].transcript;
      setLastTranscript(text); // Update interim transcripts
      
      if (transcript.is_final) {
        addLog(`Final transcript: ${text}`);
      }
    }
  }, [addLog]); // Depends on addLog
  
  const handleAgentUtterance = useCallback((utterance: LLMResponse) => {
    setAgentResponse(utterance.text);
    addLog(`Agent said: ${utterance.text}`);
  }, [addLog]); // Depends on addLog
  
  const handleAgentStateChange = useCallback((state: AgentState) => {
    setAgentState(state);
    addLog(`Agent state: ${state}`);
  }, [addLog]); // Depends on addLog
  
  // Add a handler for audio playing status
  const handlePlaybackStateChange = useCallback((isPlaying: boolean) => {
    setIsPlaying(isPlaying);
    addLog(`Audio playback: ${isPlaying ? 'started' : 'stopped'}`);
  }, [addLog]);
  
  const handleConnectionStateChange = useCallback((service: ServiceType, state: ConnectionState) => {
    setConnectionStates(prev => ({
      ...prev,
      [service]: state
    }));
    addLog(`${service} connection state: ${state}`);
  }, [addLog]); // Depends on addLog
  
  const handleError = useCallback((error: DeepgramError) => {
    addLog(`Error (${error.service}): ${error.message}`);
    console.error('Deepgram error:', error);
  }, [addLog]); // Depends on addLog
  
  // Control functions
  const startInteraction = async () => {
    try {
      await deepgramRef.current?.start();
      setIsRecording(true);
      addLog('Started interaction');
    } catch (error) {
      addLog(`Error starting: ${(error as Error).message}`);
      console.error('Start error:', error);
    }
  };
  
  const stopInteraction = async () => {
    try {
      await deepgramRef.current?.stop();
      setIsRecording(false);
      addLog('Stopped interaction');
    } catch (error) {
      addLog(`Error stopping: ${(error as Error).message}`);
      console.error('Stop error:', error);
    }
  };
  
  const interruptAgent = () => {
    console.log('🚨 Interrupt button clicked!');
    addLog('🔇 Interrupting agent - attempting to stop all audio');
    
    if (deepgramRef.current) {
      deepgramRef.current.interruptAgent();
      console.log('✅ interruptAgent() method called');
    } else {
      console.error('❌ deepgramRef.current is null!');
    }
  };
  
  const updateContext = () => {
    deepgramRef.current?.updateAgentInstructions({
      context: `The current time is ${new Date().toLocaleTimeString()}.`
    });
    addLog('Updated agent context');
  };
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Deepgram Voice Interaction Test</h1>
      
      <DeepgramVoiceInteraction
        ref={deepgramRef}
        apiKey={import.meta.env.VITE_DEEPGRAM_API_KEY || ''}
        transcriptionOptions={{
          model: 'nova-2',
          language: 'en-US',
          smart_format: true,
          interim_results: true
        }}
        agentOptions={{
          language: 'en',
          listenModel: 'nova-2',
          thinkProviderType: 'open_ai',
          thinkModel: 'gpt-4o-mini',
          voice: 'aura-2-apollo-en',
          instructions: 'You are a helpful voice assistant. Keep your responses concise and informative.',
          greeting: 'Hello! How can I assist you today?'
        }}
        onReady={handleReady}
        onTranscriptUpdate={handleTranscriptUpdate}
        onAgentUtterance={handleAgentUtterance}
        onAgentStateChange={handleAgentStateChange}
        onConnectionStateChange={handleConnectionStateChange}
        onError={handleError}
        onPlaybackStateChange={handlePlaybackStateChange}
        debug={true}
      />
      
      <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
        {!isRecording ? (
          <button 
            onClick={startInteraction} 
            disabled={!isReady}
            style={{ padding: '10px 20px' }}
          >
            Start
          </button>
        ) : (
          <button 
            onClick={stopInteraction}
            style={{ padding: '10px 20px' }}
          >
            Stop
          </button>
        )}
        <button 
          onClick={interruptAgent}
          disabled={!isRecording}
          style={{ padding: '10px 20px' }}
        >
          Interrupt Audio
        </button>
        <button 
          onClick={updateContext}
          disabled={!isRecording}
          style={{ padding: '10px 20px' }}
        >
          Update Context
        </button>
      </div>
      
      {isRecording && (
        <div style={{
          margin: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px',
          border: '2px solid #ff3333',
          borderRadius: '8px',
          backgroundColor: '#fff8f8'
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
            {isPlaying ? '🔈 Agent is speaking' : '🎙️ Microphone active'}
          </p>
          <button 
            onClick={interruptAgent}
            style={{ 
              padding: '12px 30px',
              backgroundColor: '#ff3333',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
          >
            🔇 INTERRUPT & CLEAR AUDIO
          </button>
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Status</h2>
        <p><strong>Component ready:</strong> {isReady ? 'Yes' : 'No'}</p>
        <p><strong>Transcription connection:</strong> {connectionStates.transcription}</p>
        <p><strong>Agent connection:</strong> {connectionStates.agent}</p>
        <p><strong>Agent state:</strong> {agentState}</p>
        <p>
          <strong>Audio: </strong>
          {isPlaying && (
            <span style={{ 
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              marginRight: '5px',
              animation: 'pulse 1s infinite'
            }}></span>
          )}
          {isPlaying ? 'Playing' : 'Silent'}
        </p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Conversation</h2>
        <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', minHeight: '50px' }}>
          <strong>Your speech:</strong> {lastTranscript || '(No transcription yet)'}
        </div>
        <div style={{ border: '1px solid #ccc', padding: '10px', minHeight: '50px' }}>
          <strong>Agent response:</strong> {agentResponse || '(No response yet)'}
        </div>
      </div>
      
      <div>
        <h2>Logs</h2>
        <div style={{ 
          border: '1px solid #ccc', 
          padding: '10px', 
          height: '200px', 
          overflowY: 'scroll',
          fontFamily: 'monospace',
          fontSize: '12px',
          backgroundColor: '#f5f5f5'
        }}>
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
