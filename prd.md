Okay, here is a Product Requirements Document (PRD) for the Deepgram Voice Interaction React Component, based on our discussions and the provided transcripts.

---

**Deepgram Voice Interaction React Component - PRD**

**Version:** 1.0
**Date:** 2024-03-26
**Owner:** Adam Sypniewski / Dan Mishler

**1. Introduction**

This document outlines the requirements for a React component designed to simplify the integration of Deepgram's real-time transcription and voice agent capabilities into web applications. The primary driver for this component is to support a key customer (MGX, represented by Pietro Casella) in building a sophisticated AI board meeting assistant. Pietro encountered significant challenges managing the complexities of WebSockets, browser microphone access (Web Audio API), audio playback, buffering, and state management. This component aims to abstract away this low-level plumbing, providing a developer experience similar to Clerk's authentication components – easy to drop in, configure, and use, allowing developers to focus on application logic rather than audio/WebSocket infrastructure.

**2. Goals**

*   **Enable Customer Success:** Provide MGX/Pietro with a stable, easy-to-use component to successfully deliver their AI board assistant demo by April 28th.
*   **Improve Developer Experience (DX):** Drastically reduce the complexity and time required for developers to implement real-time voice transcription and agent interactions in React web applications using Deepgram.
*   **Abstract Complexity:** Encapsulate the management of WebSockets, Web Audio API (mic input & audio output), buffering, and basic state synchronization.
*   **Create Reusable Asset:** Develop a foundational component that can be used internally and potentially released publicly (e.g., via NPM) to benefit the wider developer community.
*   **Reduce Support Overhead:** Address common setup and implementation challenges related to browser audio and WebSockets proactively.

**3. Non-Goals**

*   **UI Implementation:** This component will provide *no* UI elements. It is responsible for the underlying logic and state management. The consuming application is responsible for rendering any UI (buttons, transcript display, agent status indicators, etc.).
*   **Complex Function Calling Logic:** The component will facilitate sending context/instructions to the agent, but it will *not* implement complex client-side logic for interpreting or acting on function call requests *from* the agent. This remains the responsibility of the consuming application.
*   **Server-Side Logic:** This is purely a client-side browser component.
*   **Polyfills for Legacy Browsers:** Target modern browsers supporting the necessary Web Audio API and WebSocket features. Focus initially on Chromium-based browsers.
*   **Advanced Speaker Recognition Features:** Beyond enabling diarization via the API, the component will not implement features like pre-loading voice signatures (as the underlying API doesn't currently support this specific request).

**4. User Persona**

*   **Name:** Frontend/Full-Stack Web Developer (e.g., Pietro)
*   **Skills:** Proficient in React and JavaScript/TypeScript. Familiar with consuming APIs.
*   **Pain Points:** Finds setting up and managing real-time audio streams (mic input, speaker output) and WebSocket connections in the browser complex, time-consuming, and error-prone. Wants to focus on building application features, not low-level audio plumbing.
*   **Goals:** Quickly integrate reliable live transcription and interactive voice agent capabilities into their web application with minimal boilerplate and configuration hassle. Needs clear ways to control the interaction (start, stop, interrupt, provide context) and receive data/events (transcripts, agent state).

**5. User Stories / Requirements**

*   **5.1 Setup & Configuration:**
    *   As a developer, I want to easily initialize the component with my Deepgram API key.
    *   As a developer, I want to configure transcription options (e.g., model, language, diarization, endpointing) via props.
    *   As a developer, I want to configure voice agent options (e.g., model, language, Aura voice, endpointing) via props.
    *   As a developer, I want to be able to specify custom Deepgram API endpoints (for on-prem/dedicated deployments like UAE).
*   **5.2 Core Functionality:**
    *   As a developer, I want to be able to programmatically start and stop the connection(s) to Deepgram (for both transcription and agent).
    *   As a developer, I want the component to handle microphone access, including requesting permissions from the user.
    *   As a developer, I want the component to automatically capture microphone audio and stream it to Deepgram when active.
    *   As a developer, I want to receive live transcription results (interim and final) including speaker labels (if diarization is enabled) via callbacks or events.
    *   As a developer, I want the component to receive audio output from the voice agent and play it back seamlessly through the user's speakers.
    *   As a developer, I want to be informed of the voice agent's state (e.g., idle, listening, thinking, speaking) via callbacks or events.
*   **5.3 Agent Interaction:**
    *   As a developer, I want a method to send updated instructions or context to the voice agent during an active session (e.g., when a presentation slide changes).
    *   As a developer, I want a method to reliably interrupt the voice agent while it is speaking, causing it to stop playback immediately and clear its output buffer.
    *   As a developer, I want to know when the user starts and stops speaking (based on VAD/endpointing).
*   **5.4 Reliability & State:**
    *   As a developer, I want the component to manage WebSocket keepalives automatically.
    *   As a developer, I want to be notified of connection status changes (connecting, connected, disconnected, error) for both transcription and agent services.
    *   As a developer, I want the component to handle common errors gracefully (e.g., network issues, API errors, permissions denied) and report them via callbacks or events.

**6. Functional Requirements**

*   **6.1 Component Interface:**
    *   Provide a React component (likely class or functional component using hooks).
    *   Accept configuration via props (`apiKey`, `transcriptionOptions`, `agentOptions`, `endpointConfig`).
    *   Expose control methods (e.g., via `useRef` or a custom hook return): `start()`, `stop()`, `updateAgentInstructions(payload)`, `interruptAgent()`.
    *   Emit events/data via callbacks provided as props (e.g., `onTranscriptUpdate(transcript)`, `onAgentStateChange(state)`, `onAgentUtterance(llmResponse)`, `onError(error)`, `onConnectionStateChange(service, state)`).
*   **6.2 WebSocket Management:**
    *   Establish and maintain WebSocket connections to Deepgram's `/v1/listen` (transcription) and `/v1/agent` endpoints.
    *   Handle authentication (API Key).
    *   Send keepalive messages.
    *   Parse incoming JSON messages (transcripts, agent state, errors).
    *   Handle incoming binary audio data (from agent).
    *   Send outgoing audio data (mic) and JSON messages (agent instructions).
    *   Manage connection lifecycle and error handling/reconnection strategy (TBD - simple error reporting initially).
*   **6.3 Microphone Handling (Web Audio API):**
    *   Request microphone permissions (`navigator.mediaDevices.getUserMedia`).
    *   Create `AudioContext` and associated nodes (`AudioWorklet` preferred for processing).
    *   Capture audio, encode appropriately (e.g., Linear16 PCM), and chunk for WebSocket transmission.
    *   Manage microphone state (active, inactive, permissions).
*   **6.4 Audio Playback (Web Audio API):**
    *   Receive binary audio chunks from the agent WebSocket.
    *   Implement a robust buffering/queueing mechanism.
    *   Use `AudioContext` to decode (`decodeAudioData`) and play (`AudioBufferSourceNode`) the audio chunks seamlessly with low latency.
    *   Handle playback state (idle, playing, paused).
    *   Implement logic to immediately stop playback and clear the buffer upon `interruptAgent()` call.
*   **6.5 State Management:**
    *   Maintain internal state for connection status (transcription, agent), microphone status/permissions, agent state, playback status.
    *   Expose relevant state changes via callbacks/events.

**7. Technical Requirements & Considerations**

*   **Framework:** React (v16.8+ for hooks)
*   **Language:** TypeScript (Recommended for type safety)
*   **Core APIs:** Web Audio API, WebSockets API
*   **Dependencies:** Minimize external dependencies. Aim for zero runtime dependencies beyond React if feasible.
*   **Browser Support:** Prioritize modern Chromium-based browsers (Chrome, Edge). Test on Firefox and Safari as secondary targets.
*   **Performance:** Focus on low latency for audio processing and playback. Efficient handling of audio data.

**8. Design & Developer Experience (DX)**

*   **Simplicity:** Inspired by Clerk – aim for minimal configuration to get started. Provide sensible defaults for options.
*   **Abstraction:** Hide the complexity of WebSockets and Web Audio API. Developers should interact with high-level methods and events.
*   **Clarity:** Provide clear and informative error messages via the `onError` callback/event.
*   **Documentation:** (Future) Clear documentation and examples will be crucial if released publicly.
*   **Debuggability:** Consider adding optional verbose logging controlled by a prop for easier debugging during development.

**9. Configuration (Props - Preliminary)**

```typescript
interface DeepgramVoiceInteractionProps {
  apiKey: string;
  transcriptionOptions?: TranscriptionOptions; // Corresponds to /v1/listen query params
  agentOptions?: AgentOptions; // Corresponds to /v1/agent query params & potentially config messages
  endpointConfig?: {
    transcriptionUrl?: string; // Defaults to wss://api.deepgram.com/v1/listen
    agentUrl?: string; // Defaults to wss://api.deepgram.com/v1/agent
  };
  onReady?: (isReady: boolean) => void; // Component initialized, maybe mic ready
  onConnectionStateChange?: (service: 'transcription' | 'agent', state: 'connecting' | 'connected' | 'error' | 'closed') => void;
  onTranscriptUpdate?: (transcriptData: TranscriptResponse) => void; // Includes interim, final, speaker
  onAgentStateChange?: (state: AgentState) => void; // e.g., idle, listening, thinking, speaking
  onAgentUtterance?: (utterance: LLMResponse) => void; // Text from the agent LLM
  onUserStartedSpeaking?: () => void;
  onUserStoppedSpeaking?: () => void;
  onError?: (error: DeepgramError) => void;
  debug?: boolean; // Enable verbose logging
}

// Example Control Handle (e.g., via useRef)
interface DeepgramVoiceInteractionHandle {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  updateAgentInstructions: (payload: UpdateInstructionsPayload) => void;
  interruptAgent: () => void;
  // Potentially methods to get current state if needed
}
```
*(Note: Specific option types like `TranscriptionOptions`, `AgentOptions`, response types etc., need further definition based on Deepgram API docs)*

**10. Error Handling**

*   Handle errors related to:
    *   Microphone permissions (denied, unavailable).
    *   WebSocket connection failures (initial connection, abrupt closure).
    *   Deepgram API errors (authentication, invalid options, processing errors).
    *   Audio playback issues (decoding errors).
*   Report errors clearly via the `onError` callback, providing context where possible.
*   Define component behavior on different error types (e.g., attempt reconnect? halt? requires further discussion).

**11. Future Considerations**

*   Public NPM Package Release.
*   More sophisticated reconnection strategies.
*   Support for additional Deepgram features as they become available (e.g., advanced speaker handling).
*   Helper utilities or hooks for common UI patterns (though UI remains outside the core component).
*   Configuration presets for common use cases.

**12. Open Questions**

*   What is the desired behavior upon encountering specific API errors? (e.g., stop vs. retry)
*   What reconnection logic (if any) should be built-in initially?
*   Exact definition of `interruptAgent` behavior regarding subsequent agent state.
*   Finalize the exact structure of callback payloads (`TranscriptResponse`, `AgentError`, etc.).
*   Confirm best practice for exposing control methods (ref vs. hook return).

**13. Success Metrics**

*   Pietro successfully uses the component for the April 28th demo.
*   Positive feedback from Pietro/MGX regarding ease of use and stability.
*   Internal adoption for demos or other projects.
*   (If public) Community adoption and positive feedback.
*   (Long term) Reduction in support tickets related to basic WebSocket/Web Audio setup for React apps.

---