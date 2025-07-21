import { useRef, useState, useCallback, useMemo } from 'react';
import { 
  DeepgramVoiceInteraction, 
  DeepgramVoiceInteractionHandle,
  TranscriptResponse,
  LLMResponse,
  AgentState,
  ConnectionState,
  ServiceType,
  DeepgramError
} from '../../../src';

// Define UserMessageResponse type locally since it's not exported
interface UserMessageResponse {
  type: 'user';
  text: string;
  metadata?: any;
}

function VoiceInteractionPage() {
  const deepgramRef = useRef<DeepgramVoiceInteractionHandle>(null);
  
  // State for UI
  const [isReady, setIsReady] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [isRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [connectionStates, setConnectionStates] = useState<Record<ServiceType, ConnectionState>>({
    transcription: 'closed',
    agent: 'closed'
  });
  const [logs, setLogs] = useState<string[]>([]);

  const [microphonePermissions, setMicrophonePermissions] = useState<any>(null);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  
  // Memoized configuration objects
  const memoizedTranscriptionOptions = useMemo(() => ({
    model: 'nova-3', 
    language: 'en-US',
    smart_format: true,
    interim_results: true,
    diarize: true, 
    channels: 1,
    sample_rate: 48000,
    keyterm: [
      "Casella",
      "Symbiosis", 
      "Kerfuffle",
      "Supercalifragilisticexpialidocious"
    ]
  }), []);

  const memoizedAgentOptions = useMemo(() => ({
    language: 'en',
    listenModel: 'nova-3', 
    thinkProviderType: 'open_ai',
    thinkModel: 'gpt-4o-mini',
    voice: 'aura-2-apollo-en',
    instructions: 'You are a helpful voice assistant. Keep your responses concise and informative.',
    greeting: 'Hello! How can I assist you today?',
  }), []);

  const memoizedEndpointConfig = useMemo(() => ({
    transcriptionUrl: 'wss://api.deepgram.com/v1/listen',
    agentUrl: 'wss://agent.deepgram.com/v1/agent/converse',
  }), []);

  const memoizedMicrophoneConfig = useMemo(() => {
    if (!microphoneEnabled) {
      return undefined;
    }
    
    return {
      constraints: {
        sampleRate: 48000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: false,
        latency: 0.01
      },
      bufferSize: 4096,
      debug: true
    };
  }, [microphoneEnabled]);

  // Helper to add logs
  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  }, []);

  // Event handlers
  const handleReady = useCallback((ready: boolean) => {
    setIsReady(ready);
    addLog(`Component is ${ready ? 'ready' : 'not ready'}`);
  }, [addLog]);

  const handleTranscriptUpdate = useCallback((transcript: TranscriptResponse) => {
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
      const speakerId = deepgramResponse.channel.alternatives[0].words?.[0]?.speaker;
      const displayText = speakerId !== undefined 
        ? `Speaker ${speakerId}: ${text}` 
        : text;
      
      setLastTranscript(displayText);
      
      if (deepgramResponse.is_final) {
        addLog(`Final transcript: ${displayText}`);
      }
    }
  }, [addLog]);

  const handleAgentUtterance = useCallback((utterance: LLMResponse) => {
    setAgentResponse(utterance.text);
    addLog(`Agent said: ${utterance.text}`);
  }, [addLog]);

  const handleUserMessage = useCallback((message: UserMessageResponse) => {
    setUserMessage(message.text);
    addLog(`User message from server: ${message.text}`);
  }, [addLog]);

  const handleAgentStateChange = useCallback((state: AgentState) => {
    setAgentState(state);
    setIsSleeping(state === 'sleeping');
    addLog(`Agent state changed: ${state}`);
  }, [addLog]);

  const handleConnectionStateChange = useCallback((service: ServiceType, state: ConnectionState) => {
    setConnectionStates(prev => ({ ...prev, [service]: state }));
    addLog(`${service} connection: ${state}`);
  }, [addLog]);

  const handlePlaybackStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
    addLog(`Playback: ${playing ? 'started' : 'stopped'}`);
  }, [addLog]);

  const handleError = useCallback((error: DeepgramError) => {
    const errorType = 'type' in error ? error.type : 'unknown';
    addLog(`Error (${errorType}): ${error.message}`);
    console.error('Deepgram error:', error);
  }, [addLog]);

  const handleMicrophoneData = useCallback((data: ArrayBuffer) => {
    console.log('Microphone data received:', data.byteLength, 'bytes');
  }, []);

  // Microphone functions
  const enableMicrophoneWithPermissions = async () => {
    try {
      addLog('🎤 Enabling microphone and requesting permissions...');
      
      setMicrophoneEnabled(true);
      addLog('✅ Microphone configuration enabled');
      
      addLog('📋 Requesting microphone permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      
      stream.getTracks().forEach(track => track.stop());
      
      setMicrophonePermissions({ granted: true, state: 'granted' });
      addLog('✅ Microphone permissions granted - Ready to use!');
      
    } catch (error) {
      const err = error as DOMException;
      let state: PermissionState = 'denied';
      
      if (err.name === 'NotAllowedError') {
        state = 'denied';
        addLog('❌ Microphone permissions denied by user');
      } else if (err.name === 'NotFoundError') {
        addLog('❌ No microphone found on this device');
        return;
      } else {
        addLog(`❌ Microphone error: ${err.message}`);
      }
      
      setMicrophonePermissions({ granted: false, state });
    }
  };

  const startMicrophoneRecording = async () => {
    if (!microphoneEnabled) {
      addLog('❌ Please enable microphone first');
      return;
    }
    
    if (!microphonePermissions?.granted) {
      addLog('❌ Microphone permissions not granted. Please enable microphone first.');
      return;
    }
    
    if (deepgramRef.current) {
      try {
        addLog('🎙️ Starting microphone recording...');
        await deepgramRef.current.startRecording();
        addLog('✅ Microphone recording started successfully!');
      } catch (error) {
        addLog(`❌ Error starting microphone: ${(error as Error).message}`);
      }
    }
  };

  const stopMicrophoneRecording = () => {
    if (deepgramRef.current) {
      deepgramRef.current.stopRecording();
      addLog('Microphone recording stopped manually');
    }
  };

  // Control functions
  const startInteraction = async () => {
    console.log('🚀 Start button clicked!');
    addLog('🚀 Starting voice interaction');
    
    if (deepgramRef.current) {
      try {
        await deepgramRef.current.start();
        console.log('✅ start() method completed successfully');
      } catch (error) {
        addLog(`Error starting: ${(error as Error).message}`);
        console.error('Start error:', error);
      }
    } else {
      console.error('❌ deepgramRef.current is null!');
    }
  };

  const stopInteraction = async () => {
    console.log('🛑 Stop button clicked!');
    addLog('🛑 Stopping voice interaction');
    
    try {
      if (deepgramRef.current) {
        await deepgramRef.current.stop();
        console.log('✅ stop() method completed successfully');
      }
    } catch (error) {
      addLog(`Error stopping: ${(error as Error).message}`);
      console.error('Stop error:', error);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>🎙️ Deepgram Voice Interaction Test</h1>
      
      <DeepgramVoiceInteraction
        ref={deepgramRef}
        apiKey={import.meta.env.VITE_DEEPGRAM_API_KEY || ''}
        transcriptionOptions={memoizedTranscriptionOptions}
        agentOptions={memoizedAgentOptions}
        endpointConfig={memoizedEndpointConfig}
        microphoneConfig={memoizedMicrophoneConfig}
        onReady={handleReady}
        onTranscriptUpdate={handleTranscriptUpdate}
        onAgentUtterance={handleAgentUtterance}
        onUserMessage={handleUserMessage}
        onAgentStateChange={handleAgentStateChange}
        onConnectionStateChange={handleConnectionStateChange}
        onError={handleError}
        onPlaybackStateChange={handlePlaybackStateChange}
        onMicrophoneData={handleMicrophoneData}
        debug={true}
      />
      
      {/* Component States */}
      <div style={{ border: '1px solid blue', padding: '10px', margin: '15px 0' }}>
        <h4>Component States:</h4>
        <p>App UI State (isSleeping): <strong>{(isSleeping || agentState === 'entering_sleep').toString()}</strong></p>
        <p>Core Component State (agentState via callback): <strong>{agentState}</strong></p>
        <p>Transcription Connection: <strong>{connectionStates.transcription}</strong></p>
        <p>Agent Connection: <strong>{connectionStates.agent}</strong></p>
        <p>Audio Recording: <strong>{isRecording.toString()}</strong></p>
        <p>Audio Playing: <strong>{isPlaying.toString()}</strong></p>
      </div>

      {/* Microphone Controls */}
      <div style={{ border: '1px solid green', padding: '10px', margin: '15px 0' }}>
        <h4>🎤 Microphone Controls:</h4>
        
        {!microphoneEnabled ? (
          <div>
            <p>Status: <strong style={{ color: 'orange' }}>Not Enabled</strong></p>
            <p>Click the button below to enable microphone and request permissions:</p>
            <button onClick={enableMicrophoneWithPermissions} style={{ 
              padding: '10px 20px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer'
            }}>
              🎤 Enable Microphone & Grant Permissions
            </button>
          </div>
        ) : (
          <div>
            <p>Status: <strong style={{ color: microphonePermissions?.granted ? 'green' : 'orange' }}>
              {microphonePermissions?.granted ? '✅ Ready to Use' : '⏳ Permissions Needed'}
            </strong></p>
            
            <div style={{ margin: '10px 0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={startMicrophoneRecording} 
                disabled={!isReady || !microphonePermissions?.granted} 
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: microphonePermissions?.granted ? '#4CAF50' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: microphonePermissions?.granted ? 'pointer' : 'not-allowed'
                }}
              >
                🎙️ Start Recording
              </button>
              
              <button 
                onClick={stopMicrophoneRecording} 
                style={{ 
                  padding: '8px 16px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ⏹️ Stop Recording
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Main Controls */}
      <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
        {!isRecording ? (
          <button 
            onClick={startInteraction} 
            disabled={!isReady || isRecording}
            style={{ padding: '10px 20px' }}
          >
            Start Voice Interaction
          </button>
        ) : (
          <button 
            onClick={stopInteraction} 
            disabled={!isReady}
            style={{ padding: '10px 20px' }}
          >
            Stop Voice Interaction
          </button>
        )}
      </div>

      {/* Response Display */}
      <div style={{ margin: '20px 0' }}>
        <div style={{ marginBottom: '10px' }}>
          <strong>Last Transcript:</strong>
          <div style={{ 
            border: '1px solid #ccc', 
            padding: '10px', 
            minHeight: '40px', 
            backgroundColor: '#f9f9f9',
            fontStyle: lastTranscript ? 'normal' : 'italic',
            color: lastTranscript ? 'black' : '#666'
          }}>
            {lastTranscript || 'No transcript yet...'}
          </div>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Agent Response:</strong>
          <div style={{ 
            border: '1px solid #ccc', 
            padding: '10px', 
            minHeight: '40px', 
            backgroundColor: '#f0f8ff',
            fontStyle: agentResponse ? 'normal' : 'italic',
            color: agentResponse ? 'black' : '#666'
          }}>
            {agentResponse || 'No agent response yet...'}
          </div>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>User Message:</strong>
          <div style={{ 
            border: '1px solid #ccc', 
            padding: '10px', 
            minHeight: '40px', 
            backgroundColor: '#f0fff0',
            fontStyle: userMessage ? 'normal' : 'italic',
            color: userMessage ? 'black' : '#666'
          }}>
            {userMessage || 'No user message yet...'}
          </div>
        </div>
      </div>

      {/* Logs */}
      <div style={{ margin: '20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4>Activity Logs:</h4>
          <button onClick={clearLogs} style={{ padding: '5px 10px' }}>Clear Logs</button>
        </div>
        <div style={{ 
          border: '1px solid #ccc', 
          padding: '10px', 
          height: '200px', 
          overflowY: 'scroll', 
          backgroundColor: '#f8f8f8',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VoiceInteractionPage; 