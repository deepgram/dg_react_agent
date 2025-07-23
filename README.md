# Deepgram TTS React

A production-ready React hook for real-time text-to-speech using Deepgram's TTS API. Features intelligent text chunking, queue management, and seamless audio playback.

## Features

- 🎯 **Simple Integration**: Single React hook for TTS functionality
- 🔄 **Intelligent Chunking**: Automatically splits large texts while preserving sentence boundaries
- 📦 **Queue Management**: Sequential chunk processing with rate limiting
- 🎵 **Seamless Playback**: Smooth audio transitions using Web Audio API
- ⚡ **Real-time Streaming**: WebSocket-based streaming for low latency
- 🛡️ **Production Ready**: Comprehensive error handling and connection management
- 📊 **Built-in Metrics**: Optional performance tracking and analytics
- 🎛️ **Configurable**: Extensive customization options

## Installation

```bash
npm install deepgram-tts-react
```

## Quick Start

```tsx
import React, { useState } from 'react';
import { useDeepgramTTS } from 'deepgram-tts-react';

function TTSDemo() {
  const [text, setText] = useState('');
  
  const { speak, stop, isLoading, isConnected, error } = useDeepgramTTS({
    apiKey: 'your-deepgram-api-key'
  });

  const handleSpeak = async () => {
    try {
      await speak(text);
      console.log('Speech completed!');
    } catch (err) {
      console.error('Speech failed:', err);
    }
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to speak..."
        rows={4}
        cols={50}
      />
      <div>
        <button onClick={handleSpeak} disabled={isLoading || !isConnected}>
          {isLoading ? 'Speaking...' : 'Speak'}
        </button>
        <button onClick={stop} disabled={!isLoading}>
          Stop
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
    </div>
  );
}
```

## API Reference

### useDeepgramTTS(options)

The main hook for TTS functionality.

#### Parameters

```tsx
interface DeepgramTTSOptions {
  apiKey: string;                    // Your Deepgram API key
  model?: string;                    // TTS model (default: 'aura-2-thalia-en')
  debug?: boolean | DebugLevel;      // Debug logging level
  enableMetrics?: boolean;           // Enable performance metrics
  maxChunkSize?: number;            // Maximum characters per chunk (default: 150)
  onConnectionChange?: (state: ConnectionState) => void;
  onError?: (error: TTSError) => void;
  onMetrics?: (metrics: TTSMetrics) => void;
}

type DebugLevel = 'off' | 'hook' | 'manager' | 'verbose';
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
```

#### Return Value

```tsx
interface DeepgramTTSReturn {
  speak: (text: string) => Promise<void>;     // Convert text to speech
  stop: () => void;                           // Stop current speech
  isLoading: boolean;                         // Is currently speaking
  isConnected: boolean;                       // WebSocket connection status
  connectionState: ConnectionState;           // Detailed connection state
  error: TTSError | null;                    // Last error encountered
  metrics: TTSMetrics | null;                // Performance metrics
}
```

## Configuration Options

### Text Chunking

The hook automatically splits large texts into manageable chunks to ensure smooth playback and respect API rate limits. You can customize the chunk size:

```tsx
const { speak } = useDeepgramTTS({
  apiKey: 'your-api-key',
  maxChunkSize: 200,          // Characters per chunk (default: 150)
});

// This will be automatically chunked:
await speak("This is a very long text that will be automatically split into smaller chunks to ensure smooth playback and optimal performance...");
```

### Debug Levels

Control the verbosity of debug logging:

```tsx
const { speak } = useDeepgramTTS({
  apiKey: 'your-api-key',
  debug: 'verbose',  // 'off' | 'hook' | 'manager' | 'verbose'
});
```

- `'off'`: No debug output
- `'hook'`: Hook-level events only
- `'manager'`: Hook + manager events
- `'verbose'`: All debug information

### Error Handling

```tsx
const { speak, error } = useDeepgramTTS({
  apiKey: 'your-api-key',
  onError: (error) => {
    console.error('TTS Error:', error.message);
    
    // Handle specific error types
    switch (error.type) {
      case 'connection':
        console.log('Connection issue - will retry automatically');
        break;
      case 'audio':
        console.log('Audio playback issue');
        break;
      case 'api':
        console.log('API error - check your key and usage');
        break;
      case 'tts':
        console.log('TTS processing error');
        break;
    }
  }
});
```

### Performance Metrics

Track performance and usage metrics:

```tsx
const { speak, metrics } = useDeepgramTTS({
  apiKey: 'your-api-key',
  enableMetrics: true,
  onMetrics: (metrics) => {
    console.log('Performance metrics:', {
      totalCharacters: metrics.totalCharacters,
      totalChunks: metrics.totalChunks,
      averageLatency: metrics.averageLatency,
      totalAudioDuration: metrics.totalAudioDuration,
    });
  }
});
```

## Next.js Integration

For Next.js applications, use the provided adapter to handle SSR/hydration issues:

### Component Adapter

```tsx
import { NextDeepgramTTS } from 'deepgram-tts-react';

export default function MyPage() {
  return (
    <NextDeepgramTTS
      apiKey={process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY}
      model="aura-2-thalia-en"
      debug="verbose"
    >
      {({ speak, stop, isLoading, isConnected, error, isClientReady }) => (
        <div>
          {!isClientReady ? (
            <p>Loading TTS...</p>
          ) : (
            <>
              <button 
                onClick={() => speak('Hello from Next.js!')}
                disabled={isLoading || !isConnected}
              >
                {isLoading ? 'Speaking...' : 'Speak'}
              </button>
              <button onClick={stop} disabled={!isLoading}>
                Stop
              </button>
              {error && <p>Error: {error.message}</p>}
              <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
            </>
          )}
        </div>
      )}
    </NextDeepgramTTS>
  );
}
```

### Hook Adapter

```tsx
import { useNextDeepgramTTS } from 'deepgram-tts-react';

export default function MyComponent() {
  const { speak, stop, isLoading, isConnected, error, isClientReady } = useNextDeepgramTTS({
    apiKey: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY,
    model: 'aura-2-thalia-en'
  });

  if (!isClientReady) {
    return <div>Loading TTS...</div>;
  }

  return (
    <button 
      onClick={() => speak('Hello!')}
      disabled={isLoading || !isConnected}
    >
      {isLoading ? 'Speaking...' : 'Speak'}
    </button>
  );
}
```

## Advanced Usage

### Custom Voice Models

```tsx
const { speak } = useDeepgramTTS({
  apiKey: 'your-api-key',
  model: 'aura-2-apollo-en',  // Male voice
  // model: 'aura-2-athena-en',  // Alternative female voice
});
```

### Connection State Management

```tsx
const { speak, connectionState } = useDeepgramTTS({
  apiKey: 'your-api-key',
  onConnectionChange: (state) => {
    switch (state) {
      case 'connecting':
        console.log('Establishing connection...');
        break;
      case 'connected':
        console.log('Ready for TTS requests');
        break;
      case 'disconnected':
        console.log('Connection lost - will reconnect automatically');
        break;
      case 'error':
        console.log('Connection error occurred');
        break;
    }
  }
});
```

### Handling Long Texts

The hook automatically handles long texts by chunking them appropriately:

```tsx
const { speak } = useDeepgramTTS({
  apiKey: 'your-api-key',
  maxChunkSize: 200,  // Larger chunks for longer texts
});

// Automatically chunked and queued
const longText = `
  This is a very long document that contains multiple paragraphs and sentences.
  The hook will automatically split this into appropriate chunks while preserving
  sentence boundaries to ensure natural speech flow. Each chunk will be processed
  sequentially with proper timing to avoid rate limits and ensure smooth playback.
`;

await speak(longText);
```

## Error Types

The hook provides detailed error information:

```tsx
interface TTSError {
  name: string;           // Error class name
  message: string;        // Human-readable message
  type: 'connection' | 'audio' | 'api' | 'tts';
  code: string;          // Error code for programmatic handling
  details?: object;      // Additional error context
}
```

Common error scenarios:
- **Connection errors**: Network issues, WebSocket failures
- **Audio errors**: Web Audio API issues, playback failures
- **API errors**: Invalid API key, rate limits, service unavailable
- **TTS errors**: Text processing issues, model unavailable

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```tsx
import { 
  useDeepgramTTS, 
  DeepgramTTSOptions, 
  TTSError, 
  TTSMetrics,
  ConnectionState 
} from 'deepgram-tts-react';

const options: DeepgramTTSOptions = {
  apiKey: 'your-api-key',
  model: 'aura-2-thalia-en',
  debug: 'verbose',
  enableMetrics: true,
};

const { speak, error }: DeepgramTTSReturn = useDeepgramTTS(options);
```

## Browser Compatibility

- Chrome/Chromium 66+
- Firefox 60+
- Safari 14.1+
- Edge 79+

Requires:
- WebSocket support
- Web Audio API
- ES2020 features

## Rate Limits

The hook automatically manages rate limits:
- Text chunking respects character limits
- Sequential processing prevents overwhelming the API
- Automatic delays between chunks based on content length
- Built-in retry logic for rate limit responses

## Best Practices

1. **API Key Security**: Never expose API keys in client-side code in production
2. **Error Handling**: Always implement error handlers for production use
3. **Text Length**: For very long texts, consider showing progress indicators
4. **Connection Management**: Handle connection state changes gracefully
5. **Performance**: Enable metrics in development to optimize chunk sizes

## Examples

Check out the [test-app](./test-app) directory for a complete working example with:
- Basic TTS implementation
- Error handling
- Connection management
- Performance monitoring
- UI best practices

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://developers.deepgram.com/docs/tts)
- 💬 [Discord Community](https://discord.gg/xWRaCDBtW4)
- 🐛 [Issue Tracker](https://github.com/deepgram/deepgram-tts-react/issues)
- 📧 [Contact Support](https://help.deepgram.com/)

---

Made with ❤️ by [Deepgram](https://deepgram.com) 