# Deepgram Voice Interaction React Component

A headless React component designed to drastically simplify the integration of Deepgram's real-time transcription and voice agent capabilities into web applications. It handles the low-level complexities of WebSocket connections, browser microphone access, and agent audio playback, allowing you to focus on building your application's UI and logic.

[![npm version](https://badge.fury.io/js/deepgram-react.svg)](https://badge.fury.io/js/deepgram-react) <!-- Placeholder - update if published -->
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

-   **Real-time Transcription:** Streams microphone audio to Deepgram's Speech-to-Text API and provides live results.
-   **Voice Agent Interaction:** Connects to Deepgram's Voice Agent API, enabling two-way voice conversations.
-   **Microphone Handling:** Manages browser microphone access (requesting permissions) and audio capture using the Web Audio API.
-   **Agent Audio Playback:** Automatically plays audio responses received from the voice agent using the Web Audio API.
-   **Robust Control:** Provides methods to programmatically start, stop, interrupt the agent, toggle sleep mode, update agent instructions, and inject messages.
-   **Event-Driven:** Uses callbacks (`props`) to deliver transcription updates, agent state changes, agent utterances, user messages, connection status, errors, and more.
*   **Keyterm Prompting:** Supports Deepgram's Keyterm Prompting feature for improved accuracy on specific terms (requires Nova-3 model).
*   **Sleep/Wake:** Includes functionality to put the agent into a sleep state where it ignores audio input until explicitly woken.
-   **Headless:** Contains **no UI elements**, giving you complete control over the look and feel of your application.
-   **TypeScript:** Built with TypeScript for enhanced type safety and developer experience.

## Component Modes

This component is highly flexible and can operate in three distinct modes:

1. **Transcription + Agent (Dual Mode):**
   - **Configuration:** Provide both `transcriptionOptions` and `agentOptions` props
   - **Behavior:** Uses both services - transcribes speech while simultaneously enabling agent conversations
   - **Use Case:** Applications requiring both real-time transcription and agent interaction
   - **Key Benefits:** 
     - Get independent transcription results while also interacting with the agent
     - Transcription is handled separately from agent, allowing different models/settings
     - All callbacks for both services are available
   - **Example Scenario:** A meeting assistant that both transcribes the conversation and allows participants to ask an AI questions

2. **Transcription Only:**
   - **Configuration:** Provide `transcriptionOptions` prop, **completely omit** the `agentOptions` prop
   - **Behavior:** Only connects to the transcription service, no agent functionality is initialized
   - **Use Case:** Applications needing only speech-to-text without agent capabilities
   - **Key Benefits:**
     - Lighter weight (no agent connection or audio playback)
     - Focused functionality for pure transcription needs
     - Enhanced control over transcription options without agent constraints
   - **Example Scenario:** A dictation app that converts speech to text for note-taking

3. **Agent Only:**
   - **Configuration:** Provide `agentOptions` prop, **completely omit** the `transcriptionOptions` prop
   - **Behavior:** Only initializes the agent service (which handles its own transcription internally)
   - **Use Case:** Voice agent applications where you don't need separate transcription results
   - **Key Benefits:**
     - Simplified setup for agent-only interactions
     - Agent handles transcription internally (via the `listenModel` option)
     - No duplicate transcription processing (saves resources)
   - **Example Scenario:** A voice assistant that responds to queries but doesn't need to display intermediate transcription

> **IMPORTANT:** For proper initialization, you must completely **omit** (not pass) the options prop for any service you don't want to use. Passing an empty object (`{}`) will still activate that service.

### Mode Selection Guide

Choose your mode based on these criteria:

- **Do you need to display live transcripts?** If yes, you need Transcription Only or Dual Mode.
- **Do you need an AI assistant that responds to voice?** If yes, you need Agent Only or Dual Mode.
- **Do you need separate control over transcription options?** If yes, use Dual Mode instead of Agent Only.
- **Are you concerned about performance/resource usage?** Use the most minimal mode for your needs (avoid Dual Mode if you only need one service).

### Callbacks Relevant to Each Mode

| Callback | Transcription Only | Agent Only | Dual Mode |
|----------|:-----------------:|:----------:|:---------:|
| `onReady` | ✅ | ✅ | ✅ |
| `onConnectionStateChange` | ✅ | ✅ | ✅ |
| `onError` | ✅ | ✅ | ✅ |
| `onTranscriptUpdate` | ✅ | ❌ | ✅ |
| `onUserStartedSpeaking` | ✅ | ❌ | ✅ |
| `onUserStoppedSpeaking` | ✅ | ❌ | ✅ |
| `onAgentStateChange` | ❌ | ✅ | ✅ |
| `onAgentUtterance` | ❌ | ✅ | ✅ |
| `onUserMessage` | ❌ | ✅ | ✅ |
| `onPlaybackStateChange` | ❌ | ✅ | ✅ |

## Installation

```bash
npm install deepgram-react
# or
yarn add deepgram-react
```

*(Note: For local development, adjust the path as needed.)*

## Getting Started

This component simplifies complex interactions. Here's how to get started with common use cases:

### 1. Basic Real-time Transcription (Transcription Only Mode)

This example focuses solely on getting live transcripts from microphone input.

```tsx
import React, { useRef, useState, useCallback, useMemo } from 'react';
// Adjust import path based on your setup (package vs local)
import { DeepgramVoiceInteraction } from 'deepgram-react'; 
import type { 
  DeepgramVoiceInteractionHandle, 
  TranscriptResponse,
  TranscriptionOptions,
  DeepgramError 
} from 'deepgram-react';

function SimpleTranscriber() {
  const deepgramRef = useRef<DeepgramVoiceInteractionHandle>(null);
  const [isReady, setIsReady] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');

  // Define transcription options (use useMemo to prevent unnecessary re-renders)
  const transcriptionOptions = useMemo<TranscriptionOptions>(() => ({
    model: 'nova-2', // Or your preferred model
    language: 'en-US',
    interim_results: true,
    smart_format: true,
  }), []);
  
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
        // IMPORTANT: agentOptions prop is completely omitted, not just empty
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

### 2. Basic Agent Interaction (Agent Only Mode)

This example focuses on interacting with a voice agent, using its responses.

```tsx
import React, { useRef, useState, useCallback, useMemo } from 'react';
// Adjust import path based on your setup (package vs local)
import { DeepgramVoiceInteraction } from 'deepgram-react';
import type { 
  DeepgramVoiceInteractionHandle, 
  AgentState, 
  LLMResponse,
  AgentOptions,
  DeepgramError,
  UserMessageResponse // Added for the new callback
} from 'deepgram-react';

function SimpleAgent() {
  const deepgramRef = useRef<DeepgramVoiceInteractionHandle>(null);
  const [isReady, setIsReady] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [lastAgentResponse, setLastAgentResponse] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState(''); // Added for user messages
  
  // Define agent options (use useMemo to prevent unnecessary re-renders)
  const agentOptions = useMemo<AgentOptions>(() => ({
    instructions: 'You are a friendly chatbot.',
    // Specify Deepgram listen provider if you want agent to handle STT
    listenModel: 'nova-2', 
    // Specify voice, think model, etc.
    voice: 'aura-asteria-en', 
    thinkModel: 'gpt-4o-mini',
  }), []);

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
  
  // Handle user messages from the server
  const handleUserMessage = useCallback((message: UserMessageResponse) => {
    console.log('User message from server:', message.text);
    setLastUserMessage(message.text);
  }, []);
  
  const handleError = useCallback((error: DeepgramError) => {
    console.error('Deepgram Error:', error);
  }, []);

  // --- Control Functions ---
  const startInteraction = () => deepgramRef.current?.start();
  const stopInteraction = () => deepgramRef.current?.stop();
  const interruptAgent = () => deepgramRef.current?.interruptAgent();
  const injectTestMessage = () => deepgramRef.current?.injectAgentMessage("Hello from the client!");

  return (
    <div>
      <h1>Voice Agent Interaction</h1>
      
      <DeepgramVoiceInteraction
        ref={deepgramRef}
        apiKey={process.env.REACT_APP_DEEPGRAM_API_KEY || "YOUR_DEEPGRAM_API_KEY"}
        // Pass agentOptions, completely omit transcriptionOptions
        agentOptions={agentOptions}
        onReady={handleReady}
        onAgentStateChange={handleAgentStateChange}
        onAgentUtterance={handleAgentUtterance}
        onUserMessage={handleUserMessage} // Added new callback
        onError={handleError}
        debug={true} // Enable console logs from the component
      />
      
      <div>
        <button onClick={startInteraction} disabled={!isReady}>Start Interaction</button>
        <button onClick={stopInteraction} disabled={!isReady}>Stop Interaction</button>
        <button onClick={interruptAgent} disabled={!isReady}>Interrupt Agent</button>
        <button onClick={injectTestMessage} disabled={!isReady}>Inject Message</button> {/* Added inject button */}
      </div>
      
      <h2>Agent State: {agentState}</h2>
      <h2>Last Agent Response:</h2>
      <p>{lastAgentResponse || '(Waiting...)'}</p>
      <h2>Last User Message (from Server):</h2> {/* Added display for user message */} 
      <p>{lastUserMessage || '(Waiting...)'}</p>
    </div>
  );
}

export default SimpleAgent;
```

### 3. Combined Transcription and Agent Interaction (Dual Mode)

Leverage both services simultaneously. Get live transcripts *while* interacting with the agent.

```tsx
// (Combine imports, state, callbacks, and controls from examples 1 & 2)
import { DeepgramVoiceInteraction } from 'deepgram-react';
import type { 
  // ... include UserMessageResponse ... 
} from 'deepgram-react';
// ...

function CombinedInteraction() {
  // ... Add state for user messages ...
  // ... Add handleUserMessage callback ...
  
  return (
    <div>
      <h1>Combined Interaction</h1>
      
      <DeepgramVoiceInteraction
        ref={deepgramRef}
        apiKey={process.env.REACT_APP_DEEPGRAM_API_KEY || "YOUR_DEEPGRAM_API_KEY"}
        // Include BOTH options for dual mode
        transcriptionOptions={transcriptionOptions}
        agentOptions={agentOptions}
        // Pass all relevant callbacks
        onReady={/*...*/}
        onTranscriptUpdate={/*...*/}
        onAgentStateChange={/*...*/}
        onAgentUtterance={/*...*/}
        onUserMessage={/* handleUserMessage */}
        onError={/*...*/}
        onPlaybackStateChange={(playing) => console.log('Agent playing:', playing)}
        debug={true}
      />
      
      <div>
        {/* Add buttons for Start, Stop, Interrupt, Inject Message, Toggle Sleep, Update Context etc. */}
      </div>
      
      {/* Display relevant state */}
      <h2>Agent State: {agentState}</h2>
      <h2>Live Transcript:</h2>
      <p>{lastTranscript || '(Waiting...)'}</p>
      <h2>Last Agent Response:</h2>
      <p>{lastAgentResponse || '(Waiting...)'}</p>
      <h2>Last User Message (from Server):</h2> {/* Added display for user message */}
      <p>{/* Display user message state */}</p>
    </div>
  );
}

export default CombinedInteraction;
```

## Core Concepts

*   **Headless Component:** This component manages all the background work (audio, WebSockets, state) but renders **no UI**. You build your interface using standard React components and connect it using the component's `ref` and callback `props`.
*   **Three Operating Modes:** The component can run in Transcription Only mode, Agent Only mode, or Dual mode (both services). Simply include or omit the corresponding options props (`transcriptionOptions` and/or `agentOptions`).
*   **Control via Ref:** Use `React.useRef` to create a reference to the component instance. This `ref.current` provides access to control methods:
    *   `start()`: Initializes connections and starts microphone capture.
    *   `stop()`: Stops microphone capture and closes connections.
    *   `interruptAgent()`: Immediately stops any agent audio playback and clears the queue.
    *   `sleep()`: Puts the agent into a state where it ignores audio input.
    *   `wake()`: Wakes the agent from the sleep state.
    *   `toggleSleep()`: Switches between active and sleep states.
    *   `updateAgentInstructions(payload)`: Sends new context or instructions to the agent mid-conversation.
    *   `injectAgentMessage(message: string)`: Sends a message directly into the agent conversation programmatically. 
*   **Configuration via Props:** Configure the component's behavior by passing props:
    *   `apiKey`: Your Deepgram API key (required).
    *   `transcriptionOptions`: An object matching Deepgram's `/v1/listen` query parameters. **Omit completely** (not just `{}`) when not using transcription.
    *   `agentOptions`: An object defining the agent's configuration. **Omit completely** (not just `{}`) when not using agent.
    *   `endpointConfig`: Optionally override the default Deepgram WebSocket URLs (useful for dedicated deployments).
    *   `debug`: Set to `true` to enable verbose logging in the browser console.
*   **Data/Events via Callbacks:** The component communicates back to your application using callback functions passed as props:
    *   `onReady(isReady: boolean)`: Indicates if the component is initialized and ready to start.
    *   `onConnectionStateChange(service: ServiceType, state: ConnectionState)`: Reports status changes ('connecting', 'connected', 'error', 'closed') for 'transcription' and 'agent' services.
    *   `onTranscriptUpdate(transcriptData: TranscriptResponse)`: Delivers live transcription results (both interim and final). Check `transcriptData.is_final`.
    *   `onAgentStateChange(state: AgentState)`: Reports the agent's current state ('idle', 'listening', 'thinking', 'speaking', 'entering_sleep', 'sleeping').
    *   `onAgentUtterance(utterance: LLMResponse)`: Provides the text content generated by the agent.
    *   `onUserMessage(message: UserMessageResponse)`: Provides user messages received from the server (from `ConversationText` events with `role:user`).
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

| Prop                    | Type                                                     | Required | Description                                                                                               |
| :---------------------- | :------------------------------------------------------- | :------- | :-------------------------------------------------------------------------------------------------------- |
| `apiKey`                | `string`                                                 | Yes      | Your Deepgram API key.                                                                                    |
| `transcriptionOptions`  | `TranscriptionOptions`                                   | *        | Options for the transcription service. See `TranscriptionOptions` type & [Deepgram STT Docs][stt-docs]. **Omit completely** (not just `{}`) when not using transcription. |
| `agentOptions`          | `AgentOptions`                                           | *        | Options for the agent service. See `AgentOptions` type & [Deepgram Agent Docs][agent-docs]. **Omit completely** (not just `{}`) when not using agent. |
| `endpointConfig`        | `EndpointConfig` (`{ transcriptionUrl?, agentUrl? }`)    | No       | Override default Deepgram WebSocket URLs.                                                                 |
| `onReady`               | `(isReady: boolean) => void`                             | No       | Called when the component is initialized and ready to start.                                              |
| `onConnectionStateChange`| `(service: ServiceType, state: ConnectionState) => void` | No       | Called when WebSocket connection state changes for 'transcription' or 'agent'.                            |
| `onTranscriptUpdate`    | `(transcriptData: TranscriptResponse) => void`           | No       | Called with live transcription results (interim & final).                                                 |
| `onAgentStateChange`    | `(state: AgentState) => void`                            | No       | Called when the agent's state changes.                                                                    |
| `onAgentUtterance`      | `(utterance: LLMResponse) => void`                       | No       | Called when the agent produces a text response.                                                           |
| `onUserMessage`         | `(message: UserMessageResponse) => void`                 | No       | Called when a user message is received from the server (`role:user`).                                     |
| `onUserStartedSpeaking` | `() => void`                                             | No       | Called when user speech starts (VAD).                                                                     |
| `onUserStoppedSpeaking` | `() => void`                                             | No       | Called when user speech stops (VAD).                                                                      |
| `onPlaybackStateChange` | `(isPlaying: boolean) => void`                           | No       | Called when agent audio playback starts or stops.                                                         |
| `onError`               | `(error: DeepgramError) => void`                         | No       | Called when an error occurs (mic, WebSocket, API, etc.).                                                  |
| `debug`                 | `boolean`                                                | No       | Enable verbose logging to the browser console.                                                            |

\* At least one of `transcriptionOptions` or `agentOptions` must be provided, otherwise the component will throw an error.

*[stt-docs]: https://developers.deepgram.com/docs/streaming-audio-overview
*[agent-docs]: https://developers.deepgram.com/docs/voice-agent-overview

### Control Methods (`DeepgramVoiceInteractionHandle`)

These methods are accessed via the `ref` attached to the component (e.g., `deepgramRef.current?.start()`).

| Method                    | Parameters                           | Return Type     | Description                                                                |
| :------------------------ | :----------------------------------- | :-------------- | :------------------------------------------------------------------------- |
| `start`                   | `none`                               | `Promise<void>` | Initializes connections, requests mic access, and starts recording/streaming. |
| `stop`                    | `none`                               | `Promise<void>` | Stops recording/streaming and closes WebSocket connections.                |
| `updateAgentInstructions` | `payload: UpdateInstructionsPayload` | `void`          | Sends new instructions or context to the agent mid-session. Only works in agent or dual mode. |
| `interruptAgent`          | `none`                               | `void`          | Immediately stops agent audio playback and clears the audio queue. Only works in agent or dual mode. |
| `sleep`                   | `none`                               | `void`          | Puts the agent into sleep mode (ignores audio input). Only works in agent or dual mode. |
| `wake`                    | `none`                               | `void`          | Wakes the agent from sleep mode. Only works in agent or dual mode. |
| `toggleSleep`             | `none`                               | `void`          | Toggles the agent between active and sleep states. Only works in agent or dual mode. |
| `injectAgentMessage`      | `message: string`                    | `void`          | Sends a message directly to the agent. Only works in agent or dual mode.    |

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
*   **Mode Configuration:** If the wrong services are being initialized, verify that you're correctly including or omitting the `transcriptionOptions` and `agentOptions` props based on your needs.

## License

MIT 