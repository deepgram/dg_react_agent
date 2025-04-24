# Deepgram Voice Interaction Test App

This is a simple demonstration app for the Deepgram Voice Interaction React component. It demonstrates the different operating modes of the component and allows testing its features.

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file in the root of this directory with your Deepgram API key:
   ```
   VITE_DEEPGRAM_API_KEY=your_deepgram_api_key_here
   # optional LLM provider key e.g. OpenAI API key
   # VITE_THINK_API_KEY=your_think_api_key_here
   ```
4. Start the development server: `npm run dev`

## Component Modes

The DeepgramVoiceInteraction component supports three operating modes, all demonstrated in this application:

### 1. Transcription Only Mode

To use the component in transcription-only mode:

```tsx
<DeepgramVoiceInteraction
  ref={deepgramRef}
  apiKey={apiKey}
  transcriptionOptions={transcriptionOptions}
  // No agentOptions prop - completely omit it, don't pass empty object
  onReady={handleReady}
  onTranscriptUpdate={handleTranscriptUpdate}
  onError={handleError}
  debug={true}
/>
```

### 2. Agent Only Mode

To use the component in agent-only mode:

```tsx
<DeepgramVoiceInteraction
  ref={deepgramRef}
  apiKey={apiKey}
  // No transcriptionOptions prop - completely omit it, don't pass empty object
  agentOptions={agentOptions}
  onReady={handleReady}
  onAgentStateChange={handleAgentStateChange}
  onAgentUtterance={handleAgentUtterance}
  onError={handleError}
  debug={true}
/>
```

### 3. Dual Mode (Transcription + Agent)

To use the component with both transcription and agent functionality:

```tsx
<DeepgramVoiceInteraction
  ref={deepgramRef}
  apiKey={apiKey}
  transcriptionOptions={transcriptionOptions}
  agentOptions={agentOptions}
  onReady={handleReady}
  onTranscriptUpdate={handleTranscriptUpdate}
  onAgentStateChange={handleAgentStateChange}
  onAgentUtterance={handleAgentUtterance}
  onError={handleError}
  debug={true}
/>
```

## Important Notes

1. **Empty Objects**: Never pass empty objects (`{}`) for options you don't want to use. This will still initialize that service. Instead, completely omit the prop.

2. **Configuration Options**: Use `useMemo` for your configuration objects to prevent unnecessary re-renders:

```tsx
const transcriptionOptions = useMemo(() => ({
  model: 'nova-2',
  language: 'en-US',
  interim_results: true,
  smart_format: true,
}), []);

const agentOptions = useMemo(() => ({
  instructions: 'You are a helpful assistant...',
  voice: 'aura-asteria-en',
  thinkModel: 'gpt-4o-mini',
  thinkApiKey: import.meta.env.VITE_THINK_API_KEY || '',
  thinkEndpointUrl: thinkEndpointUrl: 'https://api.openai.com/v1/chat/completions',
}), []);
```

3. **Callbacks**: Only define and pass the callbacks that are relevant to your chosen mode:
   - For transcription: `onTranscriptUpdate`, `onUserStartedSpeaking`, `onUserStoppedSpeaking`
   - For agent: `onAgentStateChange`, `onAgentUtterance`, `onPlaybackStateChange`
   - Both modes: `onReady`, `onConnectionStateChange`, `onError`

## Testing Tips

- Use the browser console to see debug logs (with `debug={true}`)
- Test microphone access and permissions
- Try different operating modes by modifying the component props
- Experiment with different transcription models and agent configurations

## License

MIT
