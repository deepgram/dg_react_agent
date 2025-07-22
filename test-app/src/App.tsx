import AgentPage from './pages/AgentPage';
import TTSPage from './pages/TTSPage';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tts" element={<TTSPage />} />
          <Route path="/agent" element={<AgentPage />} />
        </Routes>
      </div>
    </Router>
  );
}

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-8">Deepgram React Components</h1>
        <p className="text-gray-300 mb-12">
          Test and demonstrate the Deepgram React components library
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Link 
            to="/tts" 
            className="bg-blue-600 hover:bg-blue-700 transition-colors p-6 rounded-lg block"
          >
            <h2 className="text-xl font-semibold mb-2">Text-to-Speech</h2>
            <p className="text-blue-100">
              Convert text to natural-sounding speech using Deepgram's TTS API
            </p>
          </Link>
          
          <Link 
            to="/agent" 
            className="bg-green-600 hover:bg-green-700 transition-colors p-6 rounded-lg block"
          >
            <h2 className="text-xl font-semibold mb-2">Voice Agent</h2>
            <p className="text-green-100">
              Interactive voice conversations with Deepgram's agent capabilities
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default App;
