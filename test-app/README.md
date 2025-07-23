# Deepgram TTS React - Test App

This is a test application for the Deepgram TTS React library, demonstrating real-time text-to-speech functionality.

## Features Demonstrated

### Text-to-Speech (TTS)
- Real-time text-to-speech conversion
- Intelligent text chunking for long texts
- Seamless audio playback
- Error handling and connection management
- Performance metrics tracking

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

## Running with Docker

```sh
# Build the image (from project root)
docker image build --secret id=VITE_DEEPGRAM_API_KEY,env=$DG_TOKEN -t deepgram-tts-demo . 

# Run the image
docker run --rm --name=dgtts -e VITE_DEEPGRAM_API_KEY:$DG_TOKEN -p 8080:80 deepgram-tts-demo
```

## Deploy with fly.io

```sh
# Add runtime secrets
fly secrets set VITE_DEEPGRAM_API_KEY=$DG_TOKEN
# Deploy with build secret
fly deploy --build-secret VITE_DEEPGRAM_API_KEY=$DG_TOKEN  
```

## Usage Examples

### Basic TTS Setup
```tsx
import { useDeepgramTTS } from 'deepgram-tts-react';

const { speak, stop, isLoading, isConnected, error } = useDeepgramTTS({
  apiKey: 'YOUR_API_KEY',
  debug: 'verbose',
  enableMetrics: true
});

// Convert text to speech
await speak('Hello, this is Deepgram TTS!');
```

### Advanced Configuration
```tsx
const { speak, metrics } = useDeepgramTTS({
  apiKey: 'YOUR_API_KEY',
  model: 'aura-2-apollo-en',
  onError: (error) => console.error('TTS Error:', error),
  onMetrics: (metrics) => console.log('Performance:', metrics)
});
```

### Handling Long Texts
```tsx
// The hook automatically chunks long texts
const longText = `
  This is a very long document that will be automatically
  split into manageable chunks for smooth playback...
`;

await speak(longText);
```

## Project Structure

```
test-app/
├── src/
│   ├── pages/
│   │   └── TTSPage.tsx        # TTS demonstration
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
- Test with very long texts

### Performance Testing
- Test with different chunk sizes
- Monitor metrics for optimization
- Test rapid speak/stop cycles

### Browser Compatibility
- Test across different browsers
- Test on mobile devices
- Test with different audio setups

## Troubleshooting

### Common Issues

1. **API Key Issues**
   - Ensure your API key is valid
   - Check that it has TTS permissions
   - Verify environment variable is set correctly

2. **Audio Playback Issues**
   - Check browser audio permissions
   - Ensure Web Audio API is supported
   - Try different browsers if issues persist

3. **Connection Problems**
   - Check network connectivity
   - Verify WebSocket support
   - Monitor browser console for errors

4. **Performance Issues**
   - Adjust chunk size for your use case
   - Enable metrics to identify bottlenecks
   - Consider text length and complexity

### Debug Modes

Use different debug levels to troubleshoot:
- `debug: 'hook'` - Hook-level events
- `debug: 'manager'` - Manager-level events  
- `debug: 'verbose'` - All debug information

## Features Showcase

The test app demonstrates:

1. **Basic TTS Functionality**
   - Simple text-to-speech conversion
   - Start/stop controls
   - Connection status display

2. **Advanced Features**
   - Automatic text chunking
   - Performance metrics
   - Error handling
   - Debug logging

3. **UI Best Practices**
   - Loading states
   - Error displays
   - Connection indicators
   - Responsive design

## Contributing

To contribute to the test app:

1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

This test application is part of the Deepgram TTS React package and is licensed under the MIT License.
