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
  const [isSleeping, setIsSleeping] = useState(false);
  const [connectionStates, setConnectionStates] = useState<Record<ServiceType, ConnectionState>>({
    transcription: 'closed',
    agent: 'closed'
  });
  const [logs, setLogs] = useState<string[]>([]);
  
  // Helper to add logs - memoized
  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  }, []); // No dependencies, created once
  
  // Targeted sleep/wake logging for the App component
  const sleepLogApp = useCallback((message: string) => {
    addLog(`[SLEEP_CYCLE][APP] ${message}`);
  }, [addLog]);
  
  // Event handlers - memoized with useCallback
  const handleReady = useCallback((ready: boolean) => {
    setIsReady(ready);
    addLog(`Component is ${ready ? 'ready' : 'not ready'}`);
  }, [addLog]); // Depends on addLog
  
  const handleTranscriptUpdate = useCallback((transcript: TranscriptResponse) => {
    // Log the full transcript structure for debugging
    console.log('Full transcript response:', transcript);

    // Use type assertion to handle the actual structure from Deepgram
    // which differs from our TranscriptResponse type
    const deepgramResponse = transcript as unknown as {
      type: string;
      channel: {
        alternatives: Array<{
          transcript: string;
          confidence: number;
          words: Array<{
            word: string;
            start: number;
            end: number;
            confidence: number;
            speaker?: number;
            punctuated_word?: string;
          }>;
        }>;
      };
      is_final: boolean;
    };

    if (deepgramResponse.channel?.alternatives?.[0]?.transcript) {
      const text = deepgramResponse.channel.alternatives[0].transcript;
      // Get speaker ID if available
      const speakerId = deepgramResponse.channel.alternatives[0].words?.[0]?.speaker;
      const displayText = speakerId !== undefined 
        ? `Speaker ${speakerId}: ${text}` 
        : text;
      
      setLastTranscript(displayText);
      
      if (deepgramResponse.is_final) {
        addLog(`Final transcript: ${displayText}`);
      }
    }
  }, [addLog]); // Depends on addLog
  
  const handleAgentUtterance = useCallback((utterance: LLMResponse) => {
    setAgentResponse(utterance.text);
    addLog(`Agent said: ${utterance.text}`);
  }, [addLog]); // Depends on addLog
  
  const handleAgentStateChange = useCallback((state: AgentState) => {
    const prevState = agentState; // Capture previous state for comparison
    setAgentState(state);
    setIsSleeping(state === 'sleeping');
    addLog(`Agent state changed: ${state}`); // General log
    
    // Specific sleep cycle logging
    if (state === 'sleeping' && prevState !== 'sleeping') {
      sleepLogApp(`State changed TO sleeping.`);
    } else if (state !== 'sleeping' && prevState === 'sleeping') {
      sleepLogApp(`State changed FROM sleeping to ${state}.`);
    } else if (state === 'sleeping' && prevState === 'sleeping') {
      // This case might indicate an unnecessary update, but log it for now
      sleepLogApp(`State remained sleeping (received update).`);
    }
  }, [addLog, sleepLogApp, agentState]); // Depends on addLog, sleepLogApp, and agentState
  
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
  
  const toggleSleep = () => {
    if (deepgramRef.current) {
      sleepLogApp(`Toggle button clicked. Current app state isSleeping=${isSleeping}. Calling core toggleSleep().`);
      deepgramRef.current.toggleSleep();
      // Removed the potentially inaccurate log here, state change is handled by onAgentStateChange
    }
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
          interim_results: true,
          diarize: true, // Enable speaker diarization
          channels: 1
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
      
      <div style={{ border: '1px solid blue', padding: '10px', margin: '15px 0' }}>
        <h4>Component States:</h4>
        <p>App UI State (isSleeping): <strong>{isSleeping.toString()}</strong></p>
        <p>Core Component State (agentState via callback): <strong>{agentState}</strong></p>
        <p>Transcription Connection: <strong>{connectionStates.transcription}</strong></p>
        <p>Agent Connection: <strong>{connectionStates.agent}</strong></p>
        <p>Audio Recording: <strong>{isRecording.toString()}</strong></p>
        <p>Audio Playing: <strong>{isPlaying.toString()}</strong></p>
      </div>
      
      <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
        {!isRecording ? (
          <button 
            onClick={startInteraction} 
            disabled={!isReady || isRecording}
            style={{ padding: '10px 20px' }}
          >
            Start
          </button>
        ) : (
          <button 
            onClick={stopInteraction}
            disabled={!isRecording}
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
        <button 
          onClick={toggleSleep} 
          disabled={!isRecording}
          style={{
            padding: '10px 20px',
            backgroundColor: isSleeping ? '#e0f7fa' : 'transparent'
          }}
        >
          {isSleeping ? 'Wake Up' : 'Put to Sleep'}
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
            {isPlaying ? '🔈 Agent is speaking' : agentState === 'listening' ? '👂 Agent listening' : agentState === 'thinking' ? '🤔 Agent thinking' : agentState === 'sleeping' ? '😴 Agent sleeping' : '🎙️ Microphone active'}
          </p>
          {isSleeping && <p style={{ margin: '0', fontStyle: 'italic', color: '#555' }}>(Ignoring audio input)</p>}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginTop: '20px' }}>
        <div style={{ flex: 1, border: '1px solid #ccc', padding: '10px' }}>
          <h3>Live Transcript</h3>
          <pre>{lastTranscript || '(Waiting for transcript...)'}</pre>
        </div>
        <div style={{ flex: 1, border: '1px solid #ccc', padding: '10px' }}>
          <h3>Agent Response</h3>
          <pre>{agentResponse || '(Waiting for agent response...)'}</pre>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', border: '1px solid #eee', padding: '10px' }}>
        <h3>Event Log</h3>
        <button onClick={() => setLogs([])} style={{ marginBottom: '10px' }}>Clear Logs</button>
        <pre style={{ maxHeight: '300px', overflowY: 'scroll', background: '#f9f9f9', padding: '5px' }}>
          {logs.join('\n')}
        </pre>
      </div>
    </div>
  );
}

export default App;
