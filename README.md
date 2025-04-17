# Deepgram Voice Interaction React Component

A headless React component designed to drastically simplify the integration of Deepgram's real-time transcription and voice agent capabilities into web applications. It handles the low-level complexities of WebSocket connections, browser microphone access, and agent audio playback, allowing you to focus on building your application's UI and logic.

[![npm version](https://badge.fury.io/js/deepgram-voice-interaction-react.svg)](https://badge.fury.io/js/deepgram-voice-interaction-react) <!-- Placeholder - update if published -->
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

-   **Real-time Transcription:** Streams microphone audio to Deepgram's Speech-to-Text API and provides live results.
-   **Voice Agent Interaction:** Connects to Deepgram's Voice Agent API, enabling two-way voice conversations.
-   **Microphone Handling:** Manages browser microphone access (requesting permissions) and audio capture using the Web Audio API.
-   **Agent Audio Playback:** Automatically plays audio responses received from the voice agent using the Web Audio API.
-   **Robust Control:** Provides methods to programmatically start, stop, interrupt the agent, toggle sleep mode, and update agent instructions.
-   **Event-Driven:** Uses callbacks (`props`) to deliver transcription updates, agent state changes, agent utterances, connection status, errors, and more.
*   **Keyterm Prompting:** Supports Deepgram's Keyterm Prompting feature for improved accuracy on specific terms (requires Nova-3 model).
*   **Sleep/Wake:** Includes functionality to put the agent into a sleep state where it ignores audio input until explicitly woken.
-   **Headless:** Contains **no UI elements**, giving you complete control over the look and feel of your application.
-   **TypeScript:** Built with TypeScript for enhanced type safety and developer experience.

## Installation

```bash
npm install deepgram-voice-interaction-react
# or
yarn add deepgram-voice-interaction-react
```

*(Note: Replace `deepgram-voice-interaction-react` with the actual package name if published, or adjust the path for local usage.)*

## Getting Started

This component simplifies complex interactions. Here's how to get started with common use cases:

### 1. Basic Real-time Transcription

This example focuses solely on getting live transcripts from microphone input.

```tsx
import React, { useRef, useState, useCallback } from 'react';
// Adjust import path based on your setup (package vs local)
import { DeepgramVoiceInteraction } from 'deepgram-voice-interaction-react'; 
import type { 
  DeepgramVoiceInteractionHandle, 
  TranscriptResponse,
  TranscriptionOptions,
  DeepgramError 
} from 'deepgram-voice-interaction-react';

function SimpleTranscriber() {
  const deepgramRef = useRef<DeepgramVoiceInteractionHandle>(null);
  const [isReady, setIsReady] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');

  // Define transcription options (memoize if they might change)
  const transcriptionOptions: TranscriptionOptions = {
    model: 'nova-2', // Or your preferred model
    language: 'en-US',
    interim_results: true,
    smart_format: true,
  };

  // --- Callbacks ---
  const handleReady = useCallback((ready: boolean) => {
    console.log(`Transcription component ready: ${ready}`);
    setIsReady(ready);
  }, []);

  const handleTranscriptUpdate = useCallback((transcript: TranscriptResponse) => {
    if (transcript.is_final && transcript.channel?.alternatives?.[0]) {
      const text = transcript.channel.alternatives[0].transcript;
      console.log('Final transcript:', text);
      setLastTranscript(text);
    } else if (transcript.channel?.alternatives?.[0]) {
      // Handle interim results if needed
      // console.log('Interim transcript:', transcript.channel.alternatives[0].transcript);
    }
  }, []);
  
  const handleError = useCallback((error: DeepgramError) => {
    console.error('Deepgram Error:', error);
  }, []);

  // --- Control Functions ---
  const startTranscription = () => deepgramRef.current?.start();
  const stopTranscription = () => deepgramRef.current?.stop();

  return (
    <div>
      <h1>Live Transcription</h1>
      
      <DeepgramVoiceInteraction
        ref={deepgramRef}
        apiKey={process.env.REACT_APP_DEEPGRAM_API_KEY || "YOUR_DEEPGRAM_API_KEY"}
        transcriptionOptions={transcriptionOptions}
        // No agentOptions needed for transcription only
        onReady={handleReady}
        onTranscriptUpdate={handleTranscriptUpdate}
        onError={handleError}
        debug={true} // Enable console logs from the component
      />
      
      <div>
        <button onClick={startTranscription} disabled={!isReady}>Start Transcribing</button>
        <button onClick={stopTranscription} disabled={!isReady}>Stop Transcribing</button>
      </div>
      
      <h2>Last Transcript:</h2>
      <p>{lastTranscript || '(Waiting...)'}</p>
    </div>
  );
}

export default SimpleTranscriber;
```

### 2. Basic Agent Interaction

This example focuses on interacting with a voice agent, using its responses. Note that the component *still* connects to the transcription endpoint behind the scenes, but we primarily use the agent callbacks here.

```tsx
import React, { useRef, useState, useCallback } from 'react';
// Adjust import path based on your setup (package vs local)
import { DeepgramVoiceInteraction } from 'deepgram-voice-interaction-react';
import type { 
  DeepgramVoiceInteractionHandle, 
  AgentState, 
  LLMResponse,
  AgentOptions,
  DeepgramError 
} from 'deepgram-voice-interaction-react';

function SimpleAgent() {
  const deepgramRef = useRef<DeepgramVoiceInteractionHandle>(null);
  const [isReady, setIsReady] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [lastAgentResponse, setLastAgentResponse] = useState('');

  // Define agent options (memoize if they might change)
  const agentOptions: AgentOptions = {
    instructions: 'You are a friendly chatbot.',
    // Specify Deepgram listen provider if you want agent to handle STT
    listenModel: 'nova-2', 
    // Specify voice, think model, etc.
    voice: 'aura-asteria-en', 
    thinkModel: 'gpt-4o-mini',
  };

  // --- Callbacks ---
  const handleReady = useCallback((ready: boolean) => {
    console.log(`Agent component ready: ${ready}`);
    setIsReady(ready);
  }, []);

  const handleAgentStateChange = useCallback((state: AgentState) => {
    console.log(`Agent state: ${state}`);
    setAgentState(state);
  }, []);

  const handleAgentUtterance = useCallback((utterance: LLMResponse) => {
    console.log('Agent said:', utterance.text);
    setLastAgentResponse(utterance.text);
  }, []);
  
  const handleError = useCallback((error: DeepgramError) => {
    console.error('Deepgram Error:', error);
  }, []);

  // --- Control Functions ---
  const startInteraction = () => deepgramRef.current?.start();
  const stopInteraction = () => deepgramRef.current?.stop();
  const interruptAgent = () => deepgramRef.current?.interruptAgent();

  return (
    <div>
      <h1>Voice Agent Interaction</h1>
      
      <DeepgramVoiceInteraction
        ref={deepgramRef}
        apiKey={process.env.REACT_APP_DEEPGRAM_API_KEY || "YOUR_DEEPGRAM_API_KEY"}
        // Pass agentOptions, transcriptionOptions can be minimal or omitted
        agentOptions={agentOptions}
        onReady={handleReady}
        onAgentStateChange={handleAgentStateChange}
        onAgentUtterance={handleAgentUtterance}
        onError={handleError}
        debug={true} // Enable console logs from the component
      />
      
      <div>
        <button onClick={startInteraction} disabled={!isReady}>Start Interaction</button>
        <button onClick={stopInteraction} disabled={!isReady}>Stop Interaction</button>
        <button onClick={interruptAgent} disabled={!isReady}>Interrupt Agent</button>
      </div>
      
      <h2>Agent State: {agentState}</h2>
      <h2>Last Agent Response:</h2>
      <p>{lastAgentResponse || '(Waiting...)'}</p>
    </div>
  );
}

export default SimpleAgent;
```

### 3. Combined Transcription and Agent Interaction

Leverage both services simultaneously. Get live transcripts *while* interacting with the agent.

```tsx
// (Combine imports, state, callbacks, and controls from examples 1 & 2)
// ...

function CombinedInteraction() {
  const deepgramRef = useRef<DeepgramVoiceInteractionHandle>(null);
  const [isReady, setIsReady] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [lastAgentResponse, setLastAgentResponse] = useState('');

  // Define options (memoize if needed)
  const transcriptionOptions: TranscriptionOptions = { /* ... */ };
  const agentOptions: AgentOptions = { /* ... */ };
  
  // Define all necessary callbacks (handleReady, handleTranscriptUpdate, handleAgentStateChange, etc.)
  // ... see previous examples ...

  // Define control functions (startInteraction, stopInteraction, etc.)
  // ... see previous examples ...
  
  return (
    <div>
      <h1>Combined Interaction</h1>
      
      <DeepgramVoiceInteraction
        ref={deepgramRef}
        apiKey={process.env.REACT_APP_DEEPGRAM_API_KEY || "YOUR_DEEPGRAM_API_KEY"}
        transcriptionOptions={transcriptionOptions}
        agentOptions={agentOptions}
        // Pass all relevant callbacks
        onReady={/*...*/}
        onTranscriptUpdate={/*...*/}
        onAgentStateChange={/*...*/}
        onAgentUtterance={/*...*/}
        onError={/*...*/}
        onPlaybackStateChange={(playing) => console.log('Agent playing:', playing)}
        debug={true}
      />
      
      <div>
        {/* Add buttons for Start, Stop, Interrupt, Toggle Sleep, Update Context etc. */}
      </div>
      
      {/* Display relevant state */}
      <h2>Agent State: {agentState}</h2>
      <h2>Live Transcript:</h2>
      <p>{lastTranscript || '(Waiting...)'}</p>
      <h2>Last Agent Response:</h2>
      <p>{lastAgentResponse || '(Waiting...)'}</p>
    </div>
  );
}

export default CombinedInteraction;
```

## Core Concepts

*   **Headless Component:** This component manages all the background work (audio, WebSockets, state) but renders **no UI**. You build your interface using standard React components and connect it using the component's `ref` and callback `props`.
*   **Control via Ref:** Use `React.useRef` to create a reference to the component instance. This `ref.current` provides access to control methods:
    *   `start()`: Initializes connections and starts microphone capture.
    *   `stop()`: Stops microphone capture and closes connections.
    *   `interruptAgent()`: Immediately stops any agent audio playback and clears the queue.
    *   `sleep()`: Puts the agent into a state where it ignores audio input.
    *   `wake()`: Wakes the agent from the sleep state.
    *   `toggleSleep()`: Switches between active and sleep states.
    *   `updateAgentInstructions(payload)`: Sends new context or instructions to the agent mid-conversation.
*   **Configuration via Props:** Configure the component's behavior by passing props:
    *   `apiKey`: Your Deepgram API key (required).
    *   `transcriptionOptions`: An object matching Deepgram's `/v1/listen` query parameters (e.g., `model`, `language`, `diarize`, `smart_format`, `keyterm`).
    *   `agentOptions`: An object defining the agent's configuration (e.g., `instructions`, `voice`, `thinkModel`, `listenModel`). See `AgentOptions` type and Deepgram Agent docs.
    *   `endpointConfig`: Optionally override the default Deepgram WebSocket URLs (useful for dedicated deployments).
    *   `debug`: Set to `true` to enable verbose logging in the browser console.
*   **Data/Events via Callbacks:** The component communicates back to your application using callback functions passed as props:
    *   `onReady(isReady: boolean)`: Indicates if the component is initialized and ready to start.
    *   `onConnectionStateChange(service: ServiceType, state: ConnectionState)`: Reports status changes ('connecting', 'connected', 'error', 'closed') for 'transcription' and 'agent' services.
    *   `onTranscriptUpdate(transcriptData: TranscriptResponse)`: Delivers live transcription results (both interim and final). Check `transcriptData.is_final`.
    *   `onAgentStateChange(state: AgentState)`: Reports the agent's current state ('idle', 'listening', 'thinking', 'speaking', 'entering_sleep', 'sleeping').
    *   `onAgentUtterance(utterance: LLMResponse)`: Provides the text content generated by the agent.
    *   `onUserStartedSpeaking()` / `onUserStoppedSpeaking()`: Triggered based on voice activity detection (if `vad_events` is enabled in `transcriptionOptions` or implicitly by the agent endpoint).
    *   `onPlaybackStateChange(isPlaying: boolean)`: Indicates if the agent audio is currently playing.
    *   `onError(error: DeepgramError)`: Reports errors from microphone access, WebSockets, or the Deepgram APIs.
*   **Microphone Input:** The component handles requesting microphone permissions from the user via the browser prompt. Once granted and `start()` is called, it uses the Web Audio API (`getUserMedia`, `AudioContext`, `AudioWorklet`) to capture audio. It automatically processes and streams this audio in the required format (Linear16 PCM, 16kHz default) to Deepgram's WebSocket endpoints.
*   **Audio Output (Agent):** Binary audio data received from the Agent WebSocket endpoint is automatically decoded and played back through the user's speakers using the Web Audio API. The playback queue is managed internally. The `interruptAgent()` method provides immediate cessation of playback.
*   **WebSocket Management:** The component encapsulates the creation, connection, authentication, and message handling for WebSockets connecting to both the Deepgram Transcription (`/v1/listen`) and Agent (`/v1/agent`) endpoints. Connection state is reported via `onConnectionStateChange`. Keepalives are handled automatically by the underlying manager.
*   **State Management:** Internal state (connection status, agent status, recording/playback status, etc.) is managed using `useReducer`. Relevant changes are communicated externally via the callback props.
*   **Sleep/Wake:** The `sleep()`, `wake()`, and `toggleSleep()` methods control the agent's active state. When sleeping, the component actively ignores VAD/transcription events and stops sending audio data to the agent service. An intermediate `entering_sleep` state handles potential race conditions during the transition.

## API Reference

### Props (`DeepgramVoiceInteractionProps`)

| Prop                    | Type                                                     | Required | Default                                      | Description                                                                                               |
| :---------------------- | :------------------------------------------------------- | :------- | :------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `apiKey`                | `string`                                                 | Yes      | -                                            | Your Deepgram API key.                                                                                    |
| `transcriptionOptions`  | `TranscriptionOptions`                                   | No       | `{}`                                         | Options for the transcription service. See `TranscriptionOptions` type & [Deepgram STT Docs][stt-docs]. |
| `agentOptions`          | `AgentOptions`                                           | No       | `{}`                                         | Options for the agent service. See `AgentOptions` type & [Deepgram Agent Docs][agent-docs].             |
| `endpointConfig`        | `EndpointConfig` (`{ transcriptionUrl?, agentUrl? }`)    | No       | `{}`                                         | Override default Deepgram WebSocket URLs.                                                                 |
| `onReady`               | `(isReady: boolean) => void`                             | No       | -                                            | Called when the component is initialized and ready to start.                                              |
| `onConnectionStateChange`| `(service: ServiceType, state: ConnectionState) => void` | No       | -                                            | Called when WebSocket connection state changes for 'transcription' or 'agent'.                            |
| `onTranscriptUpdate`    | `(transcriptData: TranscriptResponse) => void`           | No       | -                                            | Called with live transcription results (interim & final).                                                 |
| `onAgentStateChange`    | `(state: AgentState) => void`                            | No       | -                                            | Called when the agent's state changes.                                                                    |
| `onAgentUtterance`      | `(utterance: LLMResponse) => void`                       | No       | -                                            | Called when the agent produces a text response.                                                           |
| `onUserStartedSpeaking` | `() => void`                                             | No       | -                                            | Called when user speech starts (VAD).                                                                     |
| `onUserStoppedSpeaking` | `() => void`                                             | No       | -                                            | Called when user speech stops (VAD).                                                                      |
| `onPlaybackStateChange` | `(isPlaying: boolean) => void`                           | No       | -                                            | Called when agent audio playback starts or stops.                                                         |
| `onError`               | `(error: DeepgramError) => void`                         | No       | -                                            | Called when an error occurs (mic, WebSocket, API, etc.).                                                  |
| `debug`                 | `boolean`                                                | No       | `false`                                      | Enable verbose logging to the browser console.                                                            |

*[stt-docs]: https://developers.deepgram.com/docs/streaming-audio-overview
*[agent-docs]: https://developers.deepgram.com/docs/voice-agent-overview

### Control Methods (`DeepgramVoiceInteractionHandle`)

These methods are accessed via the `ref` attached to the component (e.g., `deepgramRef.current?.start()`).

| Method                    | Parameters                           | Return Type     | Description                                                                |
| :------------------------ | :----------------------------------- | :-------------- | :------------------------------------------------------------------------- |
| `start`                   | `none`                               | `Promise<void>` | Initializes connections, requests mic access, and starts recording/streaming. |
| `stop`                    | `none`                               | `Promise<void>` | Stops recording/streaming and closes WebSocket connections.                |
| `updateAgentInstructions` | `payload: UpdateInstructionsPayload` | `void`          | Sends new instructions or context to the agent mid-session.                |
| `interruptAgent`          | `none`                               | `void`          | Immediately stops agent audio playback and clears the audio queue.         |
| `sleep`                   | `none`                               | `void`          | Puts the agent into sleep mode (ignores audio input).                      |
| `wake`                    | `none`                               | `void`          | Wakes the agent from sleep mode.                                           |
| `toggleSleep`             | `none`                               | `void`          | Toggles the agent between active and sleep states.                         |

## Advanced Configuration

### Custom Endpoints

If you are using Deepgram's self-hosted solution or have dedicated endpoints, provide them via `endpointConfig`:

```tsx
<DeepgramVoiceInteraction
  // ...
  endpointConfig={{
    transcriptionUrl: 'wss://your-dg-instance.com/v1/listen',
    agentUrl: 'wss://your-dg-agent-instance.com/v1/agent' 
  }}
  // ...
/>
```

### Keyterm Prompting

To improve recognition of specific words or phrases, use the `keyterm` option within `transcriptionOptions`. **Note:** This currently only works with `model: 'nova-3'` and for English.

```tsx
<DeepgramVoiceInteraction
  // ...
  transcriptionOptions={{
    model: 'nova-3', // Required for keyterm
    language: 'en',  // Required for keyterm
    keyterm: ["Deepgram", "Casella", "Symbiosis", "Board Meeting AI"] 
  }}
  // ...
/>
```

The component handles appending each keyterm correctly to the WebSocket URL. Phrases with spaces are automatically encoded.

### Agent Configuration

The `agentOptions` prop allows detailed configuration of the voice agent. Refer to the `AgentOptions` type definition and the [Deepgram Agent Documentation][agent-docs] for available settings like:

*   `instructions`: Base prompt for the agent.
*   `voice`: The Aura voice model to use (e.g., `aura-asteria-en`).
*   `thinkModel`: The underlying LLM for thinking (e.g., `gpt-4o-mini`, `claude-3-haiku`).
*   `thinkProviderType`: The LLM provider (e.g., `open_ai`, `anthropic`).
*   `listenModel`: The STT model the agent uses internally (e.g., `nova-2`).
*   `greeting`: An optional initial greeting spoken by the agent.
*   ... and more.

## Browser Compatibility

This component relies heavily on the **Web Audio API** (specifically `getUserMedia` and `AudioWorklet`) and the **WebSocket API**. It is primarily tested and optimized for modern **Chromium-based browsers** (Chrome, Edge). While it may work in other modern browsers like Firefox and Safari, full compatibility, especially concerning `AudioWorklet`, is not guaranteed.

## Troubleshooting / Debugging

*   **Enable Debug Logs:** Pass the `debug={true}` prop to the component. This will print detailed logs from the component's internal operations, state changes, WebSocket messages, and audio processing steps to the browser's developer console. Look for messages prefixed with `[DeepgramVoiceInteraction]` and `[SLEEP_CYCLE]`.
*   **Check API Key:** Ensure your Deepgram API key is correct and has the necessary permissions.
*   **Microphone Permissions:** Make sure the user has granted microphone access permissions to your site in the browser. Check browser settings if the prompt doesn't appear.
*   **Network Tab:** Use your browser's developer tools (Network tab, filtered to WS/WebSockets) to inspect the WebSocket connections, messages being sent/received, and any connection errors.
*   **Console Errors:** Check the browser console for any JavaScript errors originating from the component or its dependencies.
*   **Callback Handlers:** Ensure your callback functions passed as props (`onTranscriptUpdate`, `onError`, etc.) are correctly defined and handle the data/errors appropriately.

## License

MIT 