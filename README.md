# Deepgram React Components

A comprehensive React component library for integrating Deepgram's voice AI capabilities into your applications.

## Features

- **Text-to-Speech (TTS)**: Convert text to natural-sounding speech
- **Voice Agent**: Interactive voice conversations with AI agents
- **Real-time Transcription**: Live speech-to-text conversion
- **TypeScript Support**: Full type safety and IntelliSense
- **Flexible Architecture**: Composable hooks and components
- **Error Handling**: Comprehensive error management
- **Performance Optimized**: Efficient resource management

## Installation

```bash
npm install deepgram-voice-interaction-react
```

## Quick Start

### Basic Voice Agent

```tsx
import React from 'react';
import { useDeepgramAgent } from 'deepgram-voice-interaction-react';

function VoiceChat() {
  const { start, stop, isReady, isRecording } = useDeepgramAgent({
    apiKey: 'YOUR_DEEPGRAM_API_KEY',
    onAgentUtterance: (response) => console.log('Agent:', response.text),
    onUserMessage: (message) => console.log('User:', message.text)
  });

  return (
    <div>
      <button onClick={isRecording ? stop : start} disabled={!isReady}>
        {isRecording ? 'Stop' : 'Start'} Conversation
      </button>
    </div>
  );
}
```

### Text-to-Speech

```tsx
import React, { useState } from 'react';
import { useDeepgramTTS } from 'deepgram-voice-interaction-react';

function TextToSpeech() {
  const [text, setText] = useState('');
  const { speak, isPlaying } = useDeepgramTTS('YOUR_DEEPGRAM_API_KEY');

  return (
    <div>
      <textarea 
        value={text} 
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to speak..."
      />
      <button onClick={() => speak(text)} disabled={isPlaying}>
        {isPlaying ? 'Speaking...' : 'Speak'}
      </button>
    </div>
  );
}
```

### Advanced Agent Configuration

```tsx
import React from 'react';
import { useDeepgramAgent } from 'deepgram-voice-interaction-react';

function AdvancedAgent() {
  const { start, stop, isReady, agentState } = useDeepgramAgent({
    apiKey: 'YOUR_DEEPGRAM_API_KEY',
    agentOptions: {
      language: 'en',
      voice: 'aura-asteria-en',
      instructions: 'You are a helpful assistant specializing in customer support.',
      greeting: 'Hello! How can I help you today?'
    },
    debug: true,
    onAgentStateChange: (state) => console.log('Agent state:', state),
    onTranscriptUpdate: (transcript) => console.log('Transcript:', transcript),
    onError: (error) => console.error('Error:', error)
  });

  return (
    <div>
      <p>Agent Status: {agentState}</p>
      <button onClick={isRecording ? stop : start} disabled={!isReady}>
        {isRecording ? 'End Call' : 'Start Call'}
      </button>
    </div>
  );
}
```

### With Error Boundary

```tsx
import React from 'react';
import { DeepgramAgent, DeepgramErrorBoundary } from 'deepgram-voice-interaction-react';

function App() {
  return (
    <DeepgramErrorBoundary>
      <DeepgramAgent apiKey={apiKey} />
    </DeepgramErrorBoundary>
  );
}
```

## API Reference

### useDeepgramAgent

Main hook for voice agent functionality.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `apiKey` | `string` | Your Deepgram API key |
| `agentOptions` | `AgentOptions` | Configuration for the AI agent |
| `transcriptionOptions` | `object` | Transcription settings |
| `microphoneConfig` | `object` | Microphone configuration |
| `debug` | `boolean` | Enable debug logging |
| `onReady` | `function` | Called when agent is ready |
| `onAgentUtterance` | `function` | Called when agent speaks |
| `onUserMessage` | `function` | Called when user speaks |
| `onAgentStateChange` | `function` | Called when agent state changes |
| `onTranscriptUpdate` | `function` | Called with live transcription |
| `onError` | `function` | Called on errors |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `start` | `function` | Start the conversation |
| `stop` | `function` | Stop the conversation |
| `isReady` | `boolean` | Whether the agent is ready |
| `isRecording` | `boolean` | Whether currently recording |
| `agentState` | `AgentState` | Current agent state |
| `error` | `Error | null` | Current error, if any |

### useDeepgramTTS

Hook for text-to-speech functionality.

#### Basic Usage

```tsx
const { speak, isPlaying, stop } = useDeepgramTTS(apiKey, options);
```

## Environment Setup

Create a `.env` file in your project root:

```env
VITE_DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

## Examples

Check out the `test-app` directory for complete examples including:

- Basic voice agent setup
- Text-to-speech implementation  
- Error handling patterns
- Advanced configuration options

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details. 