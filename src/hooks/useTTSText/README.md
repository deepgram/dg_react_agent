# useTTSText Hook

A specialized React hook for managing text processing in Text-to-Speech (TTS) applications. This hook provides a robust solution for chunking, queuing, and processing text with specific considerations for TTS use cases.

## Features

- 🔄 Intelligent text chunking that maintains natural sentence boundaries
- ⏱️ Configurable delays between chunks to prevent rate limiting
- 📊 Detailed metrics tracking (characters, words, chunks, duration)
- ⏯️ Pause/resume functionality
- 🔍 Debug logging
- 📈 Progress tracking
- ⚡ Performance optimized

## Installation

The hook is part of the TTS components library and is available internally.

## Usage

### Basic Usage

```tsx
import { useTTSText } from './hooks/useTTSText';

function TTSComponent() {
  const {
    addText,
    clearText,
    status,
    metrics
  } = useTTSText({
    onChunkReady: async (chunk) => {
      // Send chunk to TTS service
      await ttsService.speak(chunk);
    }
  });

  return (
    <div>
      <button onClick={() => addText("Hello, this is a test.")}>
        Speak
      </button>
      <div>Status: {status}</div>
      <div>Words: {metrics.wordCount}</div>
    </div>
  );
}
```

### Advanced Usage with All Features

```tsx
function AdvancedTTSComponent() {
  const {
    addText,
    clearText,
    pause,
    resume,
    status,
    metrics,
    currentChunk,
    hasQueuedText
  } = useTTSText({
    // Configuration
    maxChunkSize: 100,
    minChunkSize: 5,
    chunkDelay: 10000,
    speakingRate: 15,
    debug: true,

    // Handlers
    onChunkReady: async (chunk) => {
      await ttsService.speak(chunk);
    },
    onError: (error) => {
      console.error('TTS error:', error);
    },
    onMetricsUpdate: (metrics) => {
      console.log('Progress:', 
        Math.round((metrics.processedCharacters / metrics.totalCharacters) * 100)
      );
    }
  });

  return (
    <div>
      <div>
        <button onClick={() => addText("Long text...")}>Speak</button>
        <button onClick={pause}>Pause</button>
        <button onClick={resume}>Resume</button>
        <button onClick={clearText}>Clear</button>
      </div>

      <div>Status: {status}</div>
      <div>Current chunk: {currentChunk}</div>
      
      <div>Progress:</div>
      <ul>
        <li>Characters: {metrics.processedCharacters}/{metrics.totalCharacters}</li>
        <li>Chunks: {metrics.processedChunks}/{metrics.totalChunks}</li>
        <li>Words: {metrics.wordCount}</li>
        <li>Estimated duration: {Math.round(metrics.estimatedDuration)}s</li>
      </ul>
    </div>
  );
}
```

## API Reference

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxChunkSize` | `number` | `100` | Maximum characters per chunk |
| `minChunkSize` | `number` | `5` | Minimum characters per chunk |
| `chunkDelay` | `number` | `10000` | Delay between chunks (ms) |
| `speakingRate` | `number` | `15` | Characters per second for duration estimation |
| `debug` | `boolean` | `false` | Enable debug logging |
| `onChunkReady` | `(chunk: string) => Promise<void>` | - | Called when a chunk is ready |
| `onError` | `(error: Error) => void` | - | Called on errors |
| `onMetricsUpdate` | `(metrics: TTSTextMetrics) => void` | - | Called when metrics update |

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `addText` | `(text: string) => void` | Add text to the processing queue |
| `clearText` | `() => void` | Clear all pending text |
| `pause` | `() => void` | Pause processing |
| `resume` | `() => void` | Resume processing |
| `status` | `TTSTextStatus` | Current status |
| `metrics` | `TTSTextMetrics` | Processing metrics |
| `currentChunk` | `string \| null` | Currently processing chunk |
| `hasQueuedText` | `boolean` | Whether there is text in queue |

### Metrics

The `metrics` object provides detailed information about the text processing:

```typescript
interface TTSTextMetrics {
    totalCharacters: number;      // Total characters added
    processedCharacters: number;  // Characters processed
    totalChunks: number;         // Total chunks created
    processedChunks: number;     // Chunks processed
    averageChunkSize: number;    // Average characters per chunk
    wordCount: number;           // Total words
    estimatedDuration: number;   // Estimated duration in seconds
}
```

### Status Values

The `status` property can be one of:
- `'idle'` - No processing active
- `'processing'` - Actively processing chunks
- `'paused'` - Processing paused
- `'error'` - Error occurred

## Integration with TTS Service

This hook is designed to work with our TTS service. Here's how to integrate it:

```typescript
import { useDeepgramTTS } from '../../components/DeepgramTTS/hooks/useDeepgramTTS';
import { useTTSText } from './useTTSText';

function TTSComponent({ apiKey }) {
  const tts = useDeepgramTTS(apiKey);
  
  const { addText, status, metrics } = useTTSText({
    onChunkReady: async (chunk) => {
      await tts.speak(chunk);
    },
    chunkDelay: 10000, // 10s between chunks
    debug: true
  });

  return (
    <div>
      <button 
        onClick={() => addText("Your long text here...")}
        disabled={status === 'processing'}
      >
        Speak
      </button>
      <div>Progress: {metrics.processedChunks}/{metrics.totalChunks} chunks</div>
    </div>
  );
}
```

## Best Practices

1. **Chunk Size**: 
   - Keep `maxChunkSize` around 100-200 characters for best results
   - This balances natural breaks with API efficiency

2. **Delay Timing**:
   - Set `chunkDelay` based on your TTS service's rate limits
   - For Deepgram, 10 seconds works well

3. **Error Handling**:
   - Always provide an `onError` handler
   - Consider retrying failed chunks

4. **Progress Updates**:
   - Use `onMetricsUpdate` for progress bars
   - Consider debouncing if updating UI frequently

5. **Debug Mode**:
   - Enable `debug: true` during development
   - Helps track chunking and processing issues

## Common Issues

1. **Rate Limiting**:
   - Increase `chunkDelay` if hitting rate limits
   - Consider implementing exponential backoff

2. **Unnatural Breaks**:
   - Adjust `minChunkSize` and `maxChunkSize`
   - Text is always split at sentence boundaries

3. **Performance**:
   - Large texts are processed efficiently
   - Metrics are updated optimally
   - Use `pause`/`resume` for user control 