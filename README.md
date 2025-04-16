# Deepgram Voice Interaction React Component

A React component for integrating Deepgram's real-time transcription and voice agent capabilities into web applications.

## Features

- Real-time transcription via Deepgram's WebSocket API
- Voice agent interactions with Deepgram's agent API
- Microphone audio capture and processing
- Agent audio playback
- Control methods for starting, stopping, and updating interactions
- Event callbacks for transcription and agent responses
- Completely headless (no UI) for maximum flexibility
- Built with TypeScript for strong typing

## Installation

```bash
npm install deepgram-voice-interaction-react
# or
yarn add deepgram-voice-interaction-react
```

## Usage

### Basic Example

```tsx
import React, { useRef } from 'react';
import { 
  DeepgramVoiceInteraction, 
  DeepgramVoiceInteractionHandle, 
  TranscriptResponse 
} from 'deepgram-voice-interaction-react';

function MyVoiceApp() {
  // Reference to control the voice interaction
  const deepgramRef = useRef<DeepgramVoiceInteractionHandle>(null);
  
  // Start listening and processing
  const startInteraction = () => {
    deepgramRef.current?.start();
  };
  
  // Stop listening and processing
  const stopInteraction = () => {
    deepgramRef.current?.stop();
  };
  
  // Handle transcription updates
  const handleTranscriptUpdate = (transcript: TranscriptResponse) => {
    console.log('New transcript:', transcript);
  };
  
  return (
    <div>
      <h1>Voice Interaction Demo</h1>
      
      {/* Deepgram Voice Interaction component */}
      <DeepgramVoiceInteraction
        ref={deepgramRef}
        apiKey={process.env.REACT_APP_DEEPGRAM_API_KEY || ''}
        transcriptionOptions={{
          model: 'nova-2',
          language: 'en-US',
          diarize: true,
          smart_format: true
        }}
        agentOptions={{
          model: 'aura-polaris',
          instructions: 'You are a helpful voice assistant.'
        }}
        onTranscriptUpdate={handleTranscriptUpdate}
        onAgentUtterance={(utterance) => console.log('Agent said:', utterance.text)}
        onAgentStateChange={(state) => console.log('Agent state:', state)}
        onError={(error) => console.error('Error:', error)}
      />
      
      {/* UI controls */}
      <div>
        <button onClick={startInteraction}>Start</button>
        <button onClick={stopInteraction}>Stop</button>
      </div>
    </div>
  );
}
```

### Advanced Example: Context Updates and Interruption

```tsx
import React, { useRef, useState } from 'react';
import { 
  DeepgramVoiceInteraction, 
  DeepgramVoiceInteractionHandle 
} from 'deepgram-voice-interaction-react';

function PresentationAssistant() {
  const deepgramRef = useRef<DeepgramVoiceInteractionHandle>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  
  // Change slide and update agent context
  const changeSlide = (slideNumber: number) => {
    setCurrentSlide(slideNumber);
    
    // Update the agent's context with new slide information
    deepgramRef.current?.updateAgentInstructions({
      context: `User is viewing slide ${slideNumber}. This slide contains information about...`
    });
  };
  
  // Interrupt the agent if it's speaking
  const interruptAgent = () => {
    deepgramRef.current?.interruptAgent();
  };
  
  return (
    <div>
      <h1>Presentation Assistant</h1>
      
      <DeepgramVoiceInteraction
        ref={deepgramRef}
        apiKey={process.env.REACT_APP_DEEPGRAM_API_KEY || ''}
        transcriptionOptions={{
          model: 'nova-2',
          language: 'en-US'
        }}
        agentOptions={{
          model: 'aura-polaris',
          instructions: 'You are a presentation assistant that helps answer questions about the current slide.'
        }}
        // Add your event handlers here
      />
      
      <div>
        <p>Current Slide: {currentSlide}</p>
        <button onClick={() => changeSlide(currentSlide - 1)}>Previous Slide</button>
        <button onClick={() => changeSlide(currentSlide + 1)}>Next Slide</button>
        <button onClick={interruptAgent}>Interrupt Agent</button>
      </div>
    </div>
  );
}
```

## API Reference

### Props

| Prop                    | Type                                                 | Description                                                                   |
|-------------------------|------------------------------------------------------|-------------------------------------------------------------------------------|
| `apiKey`                | `string`                                             | **Required**. Your Deepgram API key                                           |
| `transcriptionOptions`  | `TranscriptionOptions`                               | Options for the transcription service (see Deepgram API docs)                 |
| `agentOptions`          | `AgentOptions`                                       | Options for the agent service (see Deepgram API docs)                         |
| `endpointConfig`        | `EndpointConfig`                                     | Custom endpoint URLs for transcription and agent services                     |
| `onReady`               | `(isReady: boolean) => void`                         | Called when the component is ready                                            |
| `onConnectionStateChange`| `(service: ServiceType, state: ConnectionState) => void`| Called when the connection state changes                                  |
| `onTranscriptUpdate`    | `(transcriptData: TranscriptResponse) => void`       | Called when a new transcript is received                                      |
| `onAgentStateChange`    | `(state: AgentState) => void`                        | Called when the agent's state changes                                         |
| `onAgentUtterance`      | `(utterance: LLMResponse) => void`                   | Called when the agent produces text output                                    |
| `onUserStartedSpeaking` | `() => void`                                         | Called when the user starts speaking (based on VAD)                           |
| `onUserStoppedSpeaking` | `() => void`                                         | Called when the user stops speaking (based on VAD)                            |
| `onError`               | `(error: DeepgramError) => void`                     | Called when an error occurs                                                   |
| `debug`                 | `boolean`                                            | Enable verbose logging to console                                             |

### Control Methods (exposed via ref)

| Method                    | Parameters                              | Return Type     | Description                                        |
|---------------------------|----------------------------------------|-----------------|--------------------------------------------------- |
| `start`                   | None                                    | `Promise<void>` | Start the voice interaction                        |
| `stop`                    | None                                    | `Promise<void>` | Stop the voice interaction                         |
| `updateAgentInstructions` | `payload: UpdateInstructionsPayload`    | `void`          | Update the agent's instructions during a session   |
| `interruptAgent`          | None                                    | `void`          | Interrupt the agent while it is speaking           |

## Browser Compatibility

This component is primarily optimized for Chromium-based browsers (Chrome, Edge, etc.) which fully support the Web Audio API and AudioWorklet feature. Some functionality may be limited in other browsers.

## License

MIT 