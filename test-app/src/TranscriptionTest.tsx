import { useState, useRef, useEffect } from 'react'
import { WebSocketManager } from '../../src/utils/websocket/WebSocketManager'
import { AudioManager } from '../../src/utils/audio/AudioManager'

// Defining interface for transcript data structure
interface DeepgramTranscriptResponse {
  type?: string
  channel?: {
    alternatives: Array<{
      transcript: string
      confidence?: number
    }>
  }
  is_final?: boolean
  request_id?: string
  created?: string
  sha256?: string
  transaction_key?: string
  duration?: number
  channels?: number
}

function TranscriptionTest() {
  const [isConnected, setIsConnected] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [transcripts, setTranscripts] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  
  const webSocketRef = useRef<WebSocketManager | null>(null)
  const audioManagerRef = useRef<AudioManager | null>(null)
  
  // On component mount, set up the managers
  useEffect(() => {
    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY

    if (!apiKey) {
      setError('API key is missing. Please add it to your .env file.')
      return
    }
    
    console.log('Setting up WebSocket and Audio managers')
    
    // Create WebSocket manager
    webSocketRef.current = new WebSocketManager({
      url: 'wss://api.deepgram.com/v1/listen',
      apiKey,
      service: 'transcription',
      queryParams: {
        model: 'nova-2',
        language: 'en-US',
        smart_format: true,
        punctuate: true,
        interim_results: true,
        sample_rate: 16000,
        encoding: 'linear16',
        channels: 1
      },
      debug: true
    })
    
    // Create audio manager
    audioManagerRef.current = new AudioManager({
      processorUrl: '/AudioWorkletProcessor.js',
      debug: true
    })
    
    // Set up WebSocket event listener
    const wsUnsubscribe = webSocketRef.current.addEventListener((event) => {
      if (event.type === 'state') {
        console.log(`WebSocket state changed to: ${event.state}`)
        setIsConnected(event.state === 'connected')
      } else if (event.type === 'message') {
        handleTranscriptMessage(event.data)
      } else if (event.type === 'error') {
        console.error('WebSocket error:', event.error)
        setError(event.error.message)
      }
    })
    
    // Set up audio manager event listener
    const audioUnsubscribe = audioManagerRef.current.addEventListener((event) => {
      if (event.type === 'ready') {
        console.log('Audio manager ready')
        setIsReady(true)
      } else if (event.type === 'recording') {
        console.log(`Recording state: ${event.isRecording}`)
        setIsRecording(event.isRecording)
      } else if (event.type === 'error') {
        console.error('Audio error:', event.error)
        setError(event.error.message)
      } else if (event.type === 'data') {
        sendAudioData(event.data)
      }
    })
    
    // Initialize audio manager
    audioManagerRef.current.initialize()
      .catch(err => {
        console.error('Failed to initialize audio manager:', err)
        setError(`Failed to initialize audio: ${err instanceof Error ? err.message : String(err)}`)
      })
    
    // Clean up on unmount
    return () => {
      console.log('Cleaning up')
      wsUnsubscribe()
      audioUnsubscribe()
      
      webSocketRef.current?.close()
      audioManagerRef.current?.dispose()
      
      webSocketRef.current = null
      audioManagerRef.current = null
    }
  }, [])
  
  // Handle transcript messages from Deepgram
  const handleTranscriptMessage = (data: DeepgramTranscriptResponse) => {
    console.log('Received message from Deepgram:', JSON.stringify(data, null, 2));
    
    // Handle metadata or other initial messages
    if (data.type === 'Metadata') {
      console.log('Received metadata from Deepgram:', data);
      return;
    }
    
    // Handle KeepAlive responses
    if (data.type === 'KeepAlive') {
      console.log('Received KeepAlive response');
      return;
    }
    
    // Check for channel data which contains transcript
    if (!data.channel || !data.channel.alternatives || !data.channel.alternatives[0]) {
      console.log('No transcript data in message');
      return;
    }
    
    const transcript = data.channel.alternatives[0].transcript;
    console.log('Extracted transcript:', transcript);
    
    if (!transcript || transcript.trim() === '') {
      console.log('Empty transcript, ignoring');
      return;
    }
    
    if (data.is_final) {
      console.log('Final transcript:', transcript);
      setTranscripts(prev => [...prev, transcript]);
    } else {
      console.log('Interim transcript (not adding to list):', transcript);
    }
  }
  
  // Send audio data to Deepgram
  const sendAudioData = (data: ArrayBuffer) => {
    console.log('Received audio data from microphone, size:', data.byteLength);
    
    if (!webSocketRef.current) {
      console.log('Cannot send audio data, WebSocket manager not initialized');
      return;
    }
    
    // Check the actual WebSocket state
    const wsState = webSocketRef.current.getState();
    if (wsState !== 'connected') {
      console.log(`Cannot send audio data, WebSocket not connected (state: ${wsState})`);
      return;
    }
    
    // WebSocket is connected, send the data
    console.log('Sending audio data to Deepgram');
    webSocketRef.current.sendBinary(data);
  }
  
  // Start transcription
  const handleStart = async () => {
    try {
      setError(null)
      
      console.log('Starting transcription')
      
      // Connect WebSocket first
      if (webSocketRef.current) {
        console.log('Connecting to WebSocket...')
        await webSocketRef.current.connect()
        
        // Wait a short time to ensure connection is fully established
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Verify connection state using the manager's state directly
        const wsState = webSocketRef.current.getState()
        console.log(`Current WebSocket state: ${wsState}`)
        if (wsState !== 'connected') {
          throw new Error(`WebSocket failed to connect (state: ${wsState})`)
        }
        
        // Send an initial KeepAlive to make sure connection is active
        webSocketRef.current.sendJSON({ type: 'KeepAlive' })
        console.log('Sent initial KeepAlive message')
        
        console.log('WebSocket connected successfully, starting audio recording')
        
        // Start recording only after WebSocket is connected
        if (audioManagerRef.current) {
          await audioManagerRef.current.startRecording()
        }
      }
      
    } catch (err: Error | unknown) {
      console.error('Failed to start:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to start transcription'
      setError(errorMessage)
    }
  }
  
  // Stop transcription
  const handleStop = () => {
    try {
      console.log('Stopping transcription')
      
      // Send CloseStream message to finalize any pending transcriptions
      if (webSocketRef.current && webSocketRef.current.getState() === 'connected') {
        console.log('Sending CloseStream message to Deepgram')
        webSocketRef.current.sendJSON({ type: 'CloseStream' })
      }
      
      // Stop recording
      if (audioManagerRef.current) {
        audioManagerRef.current.stopRecording()
      }
      
      // Small delay before closing the WebSocket
      setTimeout(() => {
        if (webSocketRef.current) {
          console.log('Closing WebSocket connection')
          webSocketRef.current.close()
        }
      }, 1000)
      
    } catch (err: Error | unknown) {
      console.error('Failed to stop:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop transcription'
      setError(errorMessage)
    }
  }
  
  // Test WebSocket connection with Deepgram
  const handleTestConnection = () => {
    try {
      if (!webSocketRef.current || webSocketRef.current.getState() !== 'connected') {
        setError('WebSocket is not connected')
        return
      }
      
      console.log('Sending test KeepAlive message')
      webSocketRef.current.sendJSON({ type: 'KeepAlive' })
    } catch (err: Error | unknown) {
      console.error('Failed to test connection:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to test connection'
      setError(errorMessage)
    }
  }
  
  return (
    <div className="App">
      <h1>Deepgram Transcription Test</h1>
      
      <div className="status">
        <div>Audio Ready: {isReady ? 'Yes' : 'No'}</div>
        <div>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</div>
        <div>Recording: {isRecording ? 'Yes' : 'No'}</div>
        {error && <div className="error">Error: {error}</div>}
      </div>
      
      <div className="controls">
        <button 
          onClick={handleStart} 
          disabled={isConnected || isRecording || !isReady}
        >
          Start Transcription
        </button>
        
        <button 
          onClick={handleStop} 
          disabled={!isConnected && !isRecording}
        >
          Stop Transcription
        </button>
        
        <button 
          onClick={handleTestConnection} 
          disabled={!isConnected}
        >
          Test Connection
        </button>
      </div>
      
      <div className="transcripts">
        <h2>Transcripts</h2>
        {transcripts.length === 0 ? (
          <div className="empty-message">No transcripts yet. Start speaking after connecting.</div>
        ) : (
          <ul>
            {transcripts.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default TranscriptionTest 