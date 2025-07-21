import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TTSPage from './pages/TTSPage';
import VoiceInteractionPage from './pages/VoiceInteractionPage';

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Deepgram Test Suite</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Link 
            to="/tts"
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-700 transition-colors block"
          >
            <div className="text-2xl mb-4">🗣️</div>
            <h2 className="text-xl font-semibold mb-2">Text-to-Speech</h2>
            <p className="text-gray-400">Test Deepgram's TTS functionality</p>
          </Link>
          
          <Link 
            to="/voice-interaction"
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-700 transition-colors block"
          >
            <div className="text-2xl mb-4">🎙️</div>
            <h2 className="text-xl font-semibold mb-2">Voice Interaction</h2>
            <p className="text-gray-400">Test voice transcription</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tts" element={<TTSPage />} />
        <Route path="/voice-interaction" element={<VoiceInteractionPage />} />
      </Routes>
    </Router>
  );
}

export default App;
