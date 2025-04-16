import { useState, useRef } from 'react'
import './App.css'
import { 
  DeepgramVoiceInteraction,
  DeepgramVoiceInteractionHandle, 
  DeepgramError
} from '../../src' // Direct import from our src directory

// Common shape of Deepgram responses
interface DeepgramResponseBase {
  type?: string
  is_final?: boolean
}

// Real response object shape from Deepgram - for debugging only
interface DeepgramDebugResponse extends DeepgramResponseBase {
  [key: string]: any
}

function App() {
  const [isReady, setIsReady] = useState(false)
  const [transcripts, setTranscripts] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const dgRef = useRef<DeepgramVoiceInteractionHandle>(null)

  const handleStart = async () => {
    try {
      setError(null)
      await dgRef.current?.start()
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
    }
  }

  const handleStop = async () => {
    try {
      await dgRef.current?.stop()
    } catch (err: Error | unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
    }
  }

  return (
    <div className="App">
      <h1>Deepgram Voice Interaction</h1>
      
      {/* Hidden component with no UI */}
      <DeepgramVoiceInteraction 
        ref={dgRef}
        apiKey={import.meta.env.VITE_DEEPGRAM_API_KEY || ''}
        transcriptionOptions={{
          model: 'nova-2',
          language: 'en-US',
          smart_format: true,
          punctuate: true,
          interim_results: true,
          sample_rate: 16000,
          encoding: 'linear16',
          channels: 1
        }}
        processorUrl="/AudioWorkletProcessor.js" // Path to the AudioWorklet in public dir
        onReady={setIsReady}
        onTranscriptUpdate={(transcript: DeepgramDebugResponse) => {
          console.log('Transcript:', JSON.stringify(transcript, null, 2));
          
          // Only process final transcripts
          if (transcript.is_final) {
            let text = '';
            
            // Handle different response formats
            
            // Nova-2 format with channel
            if (transcript.channel?.alternatives?.[0]?.transcript) {
              text = transcript.channel.alternatives[0].transcript;
            } 
            // Classic format with alternatives array
            else if (transcript.alternatives?.[0]?.transcript) {
              text = transcript.alternatives[0].transcript;
            }
            // Other possible formats?
            else if (typeof transcript.transcript === 'string') {
              text = transcript.transcript;
            }
            
            if (text && text.trim()) {
              console.log('Final transcript:', text);
              setTranscripts(prev => [...prev, text]);
            }
          }
        }}
        onError={(error: DeepgramError) => {
          console.error('Error:', error)
          setError(error.message)
        }}
        debug={true}
      />
      
      <div className="controls">
        <button onClick={handleStart} disabled={isReady}>Start</button>
        <button onClick={handleStop} disabled={!isReady}>Stop</button>
      </div>
      
      <div className="status">
        <div>Status: {isReady ? 'Ready' : 'Not ready'}</div>
        {error && <div className="error">Error: {error}</div>}
      </div>
      
      <div className="transcripts">
        <h2>Transcripts</h2>
        {transcripts.length === 0 ? (
          <div>No transcripts yet. Start speaking after connecting.</div>
        ) : (
          <ul>
            {transcripts.map((text, i) => <li key={i}>{text}</li>)}
          </ul>
        )}
      </div>
    </div>
  )
}

export default App
