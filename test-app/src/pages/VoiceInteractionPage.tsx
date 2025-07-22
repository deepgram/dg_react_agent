import { useRef, useState, useCallback, useMemo, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  useDeepgramVoiceInteraction,
  DeepgramVoiceInteractionHandle,
  TranscriptResponse,
  LLMResponse,
  AgentState,
  ConnectionState,
  ServiceType,
  DeepgramError,
  AgentOptions,
  MicrophoneConfig
} from '../../../src';

interface UserMessageResponse {
  type: 'user';
  text: string;
  metadata?: any;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

interface DeepgramVoiceInteractionProps {
  apiKey: string;
  transcriptionOptions?: Record<string, any>;
  agentOptions?: AgentOptions;
  endpointConfig?: Record<string, any>;
  microphoneConfig?: Partial<MicrophoneConfig>;
  onReady?: (isReady: boolean) => void;
  onTranscriptUpdate?: (transcript: TranscriptResponse) => void;
  onAgentUtterance?: (response: LLMResponse) => void;
  onUserMessage?: (message: UserMessageResponse) => void;
  onAgentStateChange?: (state: AgentState) => void;
  onConnectionStateChange?: (service: ServiceType, state: ConnectionState) => void;
  onError?: (error: DeepgramError) => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onMicrophoneData?: (data: ArrayBuffer) => void;
  debug?: boolean;
  ref?: React.Ref<DeepgramVoiceInteractionHandle>;
}

const DeepgramVoiceInteraction = forwardRef<DeepgramVoiceInteractionHandle, DeepgramVoiceInteractionProps>(
  ({ apiKey, ...props }) => {
    useDeepgramVoiceInteraction(apiKey, {
      transcriptionOptions: props.transcriptionOptions,
      agentOptions: props.agentOptions,
      endpointOverrides: props.endpointConfig,
      microphoneConfig: props.microphoneConfig,
      onReady: props.onReady,
      onTranscriptUpdate: props.onTranscriptUpdate,
      onAgentUtterance: props.onAgentUtterance,
      onUserMessage: props.onUserMessage,
      onAgentStateChange: props.onAgentStateChange,
      onConnectionStateChange: props.onConnectionStateChange,
      onError: props.onError,
      onPlaybackStateChange: props.onPlaybackStateChange,
      onMicrophoneData: props.onMicrophoneData,
      debug: props.debug
    });
    
    return null;
  }
);

DeepgramVoiceInteraction.displayName = 'DeepgramVoiceInteraction';

function VoiceInteractionPage() {
  const deepgramRef = useRef<DeepgramVoiceInteractionHandle>(null);
  
  // State for UI
  const [isReady, setIsReady] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStates, setConnectionStates] = useState<Record<ServiceType, ConnectionState>>({
    transcription: 'closed',
    agent: 'closed'
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [microphonePermissions, setMicrophonePermissions] = useState<{ granted: boolean; state: string } | null>(null);
  
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

  // Add chat message
  const addChatMessage = useCallback((type: 'user' | 'agent', text: string) => {
    setChatMessages(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      type,
      text,
      timestamp: new Date()
    }]);
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
      setLastTranscript(text);
      
      if (deepgramResponse.is_final) {
        addLog(`Final transcript: ${text}`);
        addChatMessage('user', text);
      }
    }
  }, [addLog, addChatMessage]);

  const handleAgentUtterance = useCallback((utterance: LLMResponse) => {
    addChatMessage('agent', utterance.text);
    addLog(`Agent said: ${utterance.text}`);
  }, [addLog, addChatMessage]);

  const handleUserMessage = useCallback((message: UserMessageResponse) => {
    addChatMessage('user', message.text);
    addLog(`User message from server: ${message.text}`);
  }, [addLog, addChatMessage]);

  const handleAgentStateChange = useCallback((state: AgentState) => {
    setAgentState(state);
    addLog(`Agent state changed: ${state}`);
  }, [addLog]);

  const handleConnectionStateChange = useCallback((service: ServiceType, state: ConnectionState) => {
    setConnectionStates(prev => ({ ...prev, [service]: state }));
    addLog(`${service} connection: ${state}`);
  }, [addLog]);

  const handlePlaybackStateChange = useCallback((playing: boolean) => {
    // setIsPlaying(playing); // This state variable was removed
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
      let state = 'denied';
      
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

  const handleStartInteraction = async () => {
    addLog('🚀 Starting voice interaction');
    
    if (deepgramRef.current) {
      try {
        await deepgramRef.current.start();
        setIsRecording(true);
      } catch (error) {
        addLog(`Error starting: ${(error as Error).message}`);
      }
    }
  };

  const handleStopInteraction = async () => {
    addLog('🛑 Stopping voice interaction');
    
    if (deepgramRef.current) {
      try {
        await deepgramRef.current.stop();
        setIsRecording(false);
      } catch (error) {
        addLog(`Error stopping: ${(error as Error).message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="text-blue-400 hover:text-blue-300">← Back to Home</Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Voice Interaction</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="mr-2">Agent:</span>
              <span className={`
                ${agentState === 'idle' ? 'text-gray-400' : ''}
                ${agentState === 'listening' ? 'text-green-400' : ''}
                ${agentState === 'thinking' ? 'text-yellow-400' : ''}
                ${agentState === 'speaking' ? 'text-blue-400' : ''}
                ${agentState === 'sleeping' ? 'text-purple-400' : ''}
              `}>
                {agentState.charAt(0).toUpperCase() + agentState.slice(1)}
              </span>
            </div>
            <div className="text-sm">
              <span className="mr-2">Connection:</span>
              <span className={`
                ${connectionStates.agent === 'connected' ? 'text-green-400' : ''}
                ${connectionStates.agent === 'connecting' ? 'text-yellow-400' : ''}
                ${connectionStates.agent === 'disconnected' ? 'text-red-400' : ''}
              `}>
                {connectionStates.agent}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Controls and Chat */}
          <div className="space-y-6">
            {/* Connection Controls */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Connection Controls</h2>
              
              {/* Microphone Setup */}
              {!microphoneEnabled ? (
                <button
                  onClick={enableMicrophoneWithPermissions}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium transition-colors"
                >
                  🎤 Enable Microphone
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Microphone Status:</span>
                    <span className={microphonePermissions?.granted ? 'text-green-400' : 'text-red-400'}>
                      {microphonePermissions?.granted ? '✅ Ready' : '❌ Not Ready'}
                    </span>
                  </div>
                  
                  <button
                    onClick={isRecording ? handleStopInteraction : handleStartInteraction}
                    disabled={!isReady || !microphonePermissions?.granted}
                    className={`w-full px-4 py-2 rounded font-medium transition-colors ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } disabled:bg-gray-600 disabled:cursor-not-allowed`}
                  >
                    {isRecording ? '⏹️ Stop Interaction' : '▶️ Start Interaction'}
                  </button>
                </div>
              )}
            </div>

            {/* Chat Window */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 h-[400px] flex flex-col">
              <h2 className="text-lg font-semibold mb-4">Conversation</h2>
              <div className="flex-1 overflow-y-auto space-y-4">
                {chatMessages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-white'
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className="text-xs opacity-50 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {lastTranscript && !chatMessages.find(m => m.text === lastTranscript) && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-700 text-gray-400 italic">
                      {lastTranscript}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Activity Log */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Activity Log</h2>
              <button
                onClick={() => setLogs([])}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="h-[600px] overflow-y-auto font-mono text-sm space-y-1">
              {logs.map((log, index) => {
                // Extract timestamp and message
                const [timestamp, ...messageParts] = log.split(' - ');
                const message = messageParts.join(' - ');

                // Determine log type for styling
                const getLogStyle = () => {
                  const lowerMessage = message.toLowerCase();
                  if (lowerMessage.includes('error')) return 'text-red-400';
                  if (lowerMessage.includes('ready')) return 'text-green-400';
                  if (lowerMessage.includes('connecting')) return 'text-yellow-400';
                  if (lowerMessage.includes('connected')) return 'text-blue-400';
                  if (lowerMessage.includes('initialized')) return 'text-purple-400';
                  return 'text-gray-300';
                };

                return (
                  <div key={index} className="flex items-start border-b border-gray-700 last:border-0 py-1">
                    <span className="text-gray-500 shrink-0 mr-2">{timestamp}</span>
                    <span className={getLogStyle()}>{message}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hidden Component - Only render when microphone is enabled */}
        {microphoneEnabled && (
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
        )}
      </div>
    </div>
  );
}

export default VoiceInteractionPage; 