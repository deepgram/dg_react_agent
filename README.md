# Deepgram Text-to-Speech React

A React hook for real-time text-to-speech using Deepgram's TTS API with ultra-low latency streaming.

## Features

- Real-time text-to-speech streaming
- Support for multiple voices
- Next.js compatibility with SSR support
- TypeScript support
- Comprehensive error handling
- Extensive customization options
- Performance metrics tracking

## Installation

```bash
npm install deepgram-tts-react
# or
yarn add deepgram-tts-react
```

## Quick Start

```tsx
import { useDeepgramTTS } from 'deepgram-tts-react';

function App() {
  const tts = useDeepgramTTS(process.env.REACT_APP_DEEPGRAM_API_KEY, {
    model: 'aura-2-thalia-en',
    enableMetrics: true
  });

  const handleSpeak = async () => {
    await tts.speak('Hello, this is Deepgram TTS!');
  };

  return (
    <button onClick={handleSpeak} disabled={!tts.isConnected}>
      {tts.isConnected ? 'Speak' : 'Connecting...'}
    </button>
  );
}
```

## Usage

### Basic Usage

```tsx
const tts = useDeepgramTTS(apiKey);
await tts.speak('Hello world!');
```

### Streaming Mode (for LLM Integration)

```tsx
const tts = useDeepgramTTS(apiKey);

// Initialize streaming
await tts.initializeStreaming();

// Stream text chunks as they arrive
for (const chunk of streamingResponse) {
  await tts.streamText(chunk);
}

// Flush when complete
await tts.flushStream();
```

### With Error Handling

```tsx
const tts = useDeepgramTTS(apiKey, {
  onError: (error) => console.error('TTS Error:', error),
  onConnectionChange: (connected) => console.log('Connected:', connected)
});
```

### With Performance Metrics

```tsx
const tts = useDeepgramTTS(apiKey, {
  enableMetrics: true,
  onMetrics: (metrics) => {
    console.log('First byte latency:', metrics.firstByteLatency);
    console.log('Total duration:', metrics.totalDuration);
  }
});
```

## API Reference

### useDeepgramTTS Options

```typescript
interface TTSConfig {
  model?: string;                // TTS model to use
  debug?: boolean | 'verbose';   // Enable debug logging
  enableMetrics?: boolean;       // Enable performance tracking
  enableTextChunking?: boolean;  // Enable text chunking for long inputs
  maxChunkSize?: number;         // Maximum chunk size for text chunking
  onError?: (error: TTSError) => void;
  onConnectionChange?: (connected: boolean) => void;
  onMetrics?: (metrics: TTSMetrics) => void;
}
```

### Return Value

```typescript
interface UseDeepgramTTSReturn {
  speak: (text: string) => Promise<void>;
  streamText: (text: string) => Promise<void>;
  flushStream: () => Promise<void>;
  stop: () => void;
  clear: () => Promise<void>;
  disconnect: () => void;
  isPlaying: boolean;
  isConnected: boolean;
  isReady: boolean;
  error: TTSError | null;
  metrics: TTSMetrics | null;
}
```

## Error Handling

The hook provides comprehensive error handling through the `TTSError` type:

```typescript
type TTSError = {
  code: string;
  message: string;
  details?: any;
};
```

Common error scenarios:
- Connection failures
- Invalid API key
- Audio playback issues
- Invalid text input

## Performance Metrics

When metrics are enabled, you get access to:

```typescript
interface TTSMetrics {
  totalDuration: number;      // Total processing time
  firstByteLatency: number;   // Time to first byte
  firstAudioLatency: number;  // Time to first audio
  totalBytes: number;         // Total audio bytes
  averageChunkSize: number;   // Average audio chunk size
  chunkCount: number;         // Number of audio chunks
}
```

## Browser Support

- Chrome (primary support)
- Edge
- Firefox
- Safari (limited support)

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Development mode
npm run dev
```

## License

MIT 