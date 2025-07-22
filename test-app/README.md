# Deepgram React Components Test App

This is a comprehensive test application for the Deepgram React Components library, demonstrating various usage patterns and configurations.

## Features Demonstrated

### Text-to-Speech (TTS)
- Basic text-to-speech conversion
- Real-time audio playback
- Error handling
- Performance optimization

### Voice Agent
- Interactive voice conversations
- Real-time transcription
- Agent state management
- Microphone configuration
- WebSocket connection handling

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   Create a `.env` file in the test-app directory:
   ```env
   VITE_DEEPGRAM_API_KEY=your_deepgram_api_key_here
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Navigate to `http://localhost:5173`

## Usage Examples

The Deepgram Agent component supports comprehensive voice interaction capabilities, demonstrated in this application:

### Basic Agent Setup
```tsx
import { useDeepgramAgent } from 'deepgram-voice-interaction-react';

const { start, stop, isReady, isRecording } = useDeepgramAgent({
  apiKey: 'YOUR_API_KEY',
  onAgentUtterance: (response) => console.log('Agent:', response.text),
  onUserMessage: (message) => console.log('User:', message.text)
});
```

### Advanced Configuration
```tsx
const { start, stop, agentState } = useDeepgramAgent({
  apiKey: 'YOUR_API_KEY',
  agentOptions: {
    language: 'en',
    voice: 'aura-asteria-en',
    instructions: 'You are a helpful assistant.',
    greeting: 'Hello! How can I help you today?'
  },
  debug: true,
  onAgentStateChange: (state) => console.log('State:', state),
  onError: (error) => console.error('Error:', error)
});
```

### Custom Microphone Configuration
```tsx
const { start, stop } = useDeepgramAgent({
  apiKey: 'YOUR_API_KEY',
  microphoneConfig: {
    constraints: {
      sampleRate: 48000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    bufferSize: 4096
  }
});
```

## Project Structure

```
test-app/
├── src/
│   ├── pages/
│   │   ├── AgentPage.tsx      # Voice agent demonstration
│   │   └── TTSPage.tsx        # Text-to-speech demonstration
│   ├── App.tsx                # Main application component
│   └── main.tsx              # Application entry point
├── public/
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Testing Different Scenarios

### Error Handling
- Test with invalid API keys
- Test network disconnections
- Test microphone permission denial

### Performance Testing
- Long conversations
- Rapid start/stop cycles
- Multiple simultaneous connections

### Browser Compatibility
- Test across different browsers
- Test on mobile devices
- Test with different microphone setups

## Troubleshooting

### Common Issues

1. **Microphone not working**
   - Ensure browser has microphone permissions
   - Check microphone configuration
   - Verify HTTPS connection (required for microphone access)

2. **WebSocket connection failures**
   - Verify API key is correct
   - Check network connectivity
   - Ensure firewall allows WebSocket connections

3. **Audio playback issues**
   - Check browser audio permissions
   - Verify audio output device
   - Test with different browsers

## Contributing

When adding new test cases or examples:

1. Follow the existing code structure
2. Add comprehensive error handling
3. Include debug logging
4. Test across different browsers
5. Update documentation

## Support

For issues specific to this test app, please open an issue in the main repository.
For Deepgram API issues, contact [Deepgram Support](https://deepgram.com/support).
