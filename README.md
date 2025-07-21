# Deepgram Voice Interaction React

A React component library for real-time transcription and voice agent interactions using Deepgram's WebSocket APIs.

## Features

- Real-time speech-to-text transcription
- Voice agent interactions with customizable behavior
- Support for multiple operation modes (Transcription-only, Agent-only, or both)
- Next.js compatibility with SSR support
- TypeScript support
- Comprehensive error handling
- Extensive customization options

## Installation

```bash
npm install deepgram-voice-interaction-react
# or
yarn add deepgram-voice-interaction-react
```

## Quick Start

### Basic Usage

```tsx
import { DeepgramVoiceInteraction } from 'deepgram-voice-interaction-react';

function App() {
  return (
    <DeepgramVoiceInteraction
      apiKey={process.env.REACT_APP_DEEPGRAM_API_KEY}
      transcriptionOptions={{
        language: 'en-US',
        model: 'nova-2',
      }}
    />
  );
}
```

### Next.js Usage

```tsx
'use client';

import { DeepgramWrapper } from 'deepgram-voice-interaction-react';

export default function App() {
  return (
    <DeepgramWrapper
      apiKey={process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY}
      transcriptionOptions={{
        language: 'en-US',
        model: 'nova-2',
      }}
    />
  );
}
```

## Operation Modes

### 1. Dual Mode (Transcription + Agent)
```tsx
<DeepgramVoiceInteraction
  apiKey={apiKey}
  transcriptionOptions={{
    language: 'en-US',
    model: 'nova-2',
  }}
  agentOptions={{
    language: 'en',
    voice: 'aura-2-apollo-en',
    instructions: 'You are a helpful voice assistant.',
  }}
/>
```

### 2. Transcription-Only Mode
```tsx
<DeepgramVoiceInteraction
  apiKey={apiKey}
  transcriptionOptions={{
    language: 'en-US',
    model: 'nova-2',
  }}
/>
```

### 3. Agent-Only Mode
```tsx
<DeepgramVoiceInteraction
  apiKey={apiKey}
  agentOptions={{
    language: 'en',
    voice: 'aura-2-apollo-en',
    instructions: 'You are a helpful voice assistant.',
  }}
/>
```

## Error Handling

Use the ErrorBoundary component for graceful error handling:

```tsx
import { DeepgramVoiceInteraction, DeepgramErrorBoundary } from 'deepgram-voice-interaction-react';

function App() {
  return (
    <DeepgramErrorBoundary
      fallback={<div>Something went wrong</div>}
      onError={(error, errorInfo) => {
        console.error('Voice interaction error:', error, errorInfo);
      }}
    >
      <DeepgramVoiceInteraction apiKey={apiKey} />
    </DeepgramErrorBoundary>
  );
}
```

## API Reference

### DeepgramVoiceInteraction Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| apiKey | string | Yes | Your Deepgram API key |
| transcriptionOptions | TranscriptionOptions | No | Configuration for transcription service |
| agentOptions | AgentOptions | No | Configuration for agent service |
| endpointConfig | EndpointConfig | No | Custom endpoint URLs |
| onReady | (isReady: boolean) => void | No | Called when component is ready |
| onError | (error: DeepgramError) => void | No | Called when an error occurs |
| debug | boolean | No | Enable debug logging |

### TranscriptionOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| language | string | 'en-US' | Language for transcription |
| model | string | 'nova-2' | Transcription model |
| interim_results | boolean | true | Enable interim results |
| smart_format | boolean | true | Enable smart formatting |

### AgentOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| language | string | 'en' | Agent language |
| voice | string | 'aura-2-apollo-en' | Voice model |
| instructions | string | - | Agent instructions |
| greeting | string | - | Initial greeting |

## Development

```bash
# Install dependencies
npm install

# Run development build
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details

## Support

For support, please contact [Deepgram Support](https://deepgram.com/support) or open an issue in this repository. 