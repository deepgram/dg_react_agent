import { useState } from 'react';
import { useDeepgramTTS } from 'deepgram-tts-react';

function TTSPage() {
  const [inputText, setInputText] = useState('Hello! This is a test of Deepgram text-to-speech functionality.');

  // Use the proper TTS hook from the src package
  const {
    speak,
    stop,
    isConnected,
    isReady,
    isLoading,
    error,
    disconnect
  } = useDeepgramTTS(
    import.meta.env.VITE_DEEPGRAM_API_KEY || '',
    {
      model: 'aura-2-apollo-en',
      debug: 'verbose',
      enableMetrics: true
    }
  );

  const handleSpeak = async () => {
    if (!inputText.trim()) {
      alert('Please enter some text to speak');
      return;
    }

    if (!isReady) {
      alert('TTS is not ready yet, please wait...');
      return;
    }

    try {
      await speak(inputText.trim());
    } catch (error) {
      console.error('Speak failed:', error);
      alert(`Speak failed: ${(error as Error).message}`);
    }
  };

  const getStatusColor = () => {
    if (!isConnected) return 'text-yellow-400';
    if (isConnected && !isReady) return 'text-blue-400';
    if (isReady) return 'text-green-400';
    return 'text-red-400';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Connecting...';
    if (isConnected && !isReady) return 'Initializing...';
    if (isReady) return 'Ready';
    return 'Disconnected';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Text-to-Speech Demo</h1>
          <div className="text-right">
            <div className={`text-sm ${getStatusColor()}`}>
              Status: {getStatusText()}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Voice: Apollo (Male) - aura-2-apollo-en
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <label className="block text-sm font-medium mb-2">
            Text to Speak
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message here..."
            className="w-full h-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isReady}
          />
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-400">
              {inputText.length} characters
            </div>

            <button
              onClick={handleSpeak}
              disabled={!inputText.trim() || !isReady || isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Speaking...
                </>
              ) : (
                <>
                  🗣️ Speak
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-900/20 border border-red-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="text-red-400">⚠️</div>
              <div>
                <h4 className="text-sm font-medium text-red-400">Connection Error</h4>
                <p className="text-sm text-red-300 mt-1">{error.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TTSPage; 