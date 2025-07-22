import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDeepgramAgent } from '../../../src';

function AgentPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  }, []);

  const handleError = useCallback((error: Error) => {
    addLog(`❌ Error: ${error.message}`);
  }, [addLog]);

  const {
    start,
    stop,
    isReady,
    isRecording,
    agentState,
    error: agentError
  } = useDeepgramAgent({
    apiKey: import.meta.env.VITE_DEEPGRAM_API_KEY || '',
    debug: true,
    onError: handleError,
    onReady: (ready) => addLog(`Agent is ${ready ? 'ready' : 'not ready'}`),
    onAgentStateChange: (state) => addLog(`Agent state changed: ${state}`),
    onTranscriptUpdate: (transcript) => addLog(`Transcript: ${transcript.channel?.alternatives?.[0]?.transcript || ''}`),
    onAgentUtterance: (utterance) => addLog(`Agent: ${utterance.text}`),
    onUserMessage: (message) => addLog(`User: ${message.text}`)
  });

  const handleStartInteraction = useCallback(async () => {
    try {
      await start();
      addLog('🎤 Started agent interaction');
    } catch (error) {
      handleError(error as Error);
    }
  }, [start, addLog, handleError]);

  const handleStopInteraction = useCallback(async () => {
    try {
      await stop();
      addLog('🛑 Stopped agent interaction');
    } catch (error) {
      handleError(error as Error);
    }
  }, [stop, addLog, handleError]);

  const getStatusColor = () => {
    if (agentError) return 'text-red-400';
    if (!isReady) return 'text-yellow-400';
    if (isRecording) return 'text-green-400';
    return 'text-gray-400';
  };

  const getStatusText = () => {
    if (agentError) return 'Error';
    if (!isReady) return 'Initializing';
    if (isRecording) return 'Recording';
    return 'Ready';
  };

  const getAgentStateColor = () => {
    switch (agentState) {
      case 'listening': return 'text-green-400';
      case 'thinking': return 'text-yellow-400';
      case 'speaking': return 'text-blue-400';
      case 'sleeping': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="text-blue-400 hover:text-blue-300">← Back to Home</Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Deepgram Agent</h1>
          <div className="flex items-center gap-4">
            <div className={`text-sm ${getStatusColor()}`}>Status: {getStatusText()}</div>
            <div className={`text-sm ${getAgentStateColor()}`}>Agent: {agentState.charAt(0).toUpperCase() + agentState.slice(1)}</div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-center">
            <button
              onClick={isRecording ? handleStopInteraction : handleStartInteraction}
              disabled={!isReady}
              className={`px-8 py-4 rounded-full font-medium transition-colors flex items-center gap-2 ${
                isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              } disabled:bg-gray-600 disabled:cursor-not-allowed`}
            >
              {isRecording ? '⏹️ Stop' : '🎤 Start'}
            </button>
          </div>
        </div>

        {agentError && (
          <div className="mt-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-400">⚠️</span>
              <h3 className="text-red-400 font-semibold">Agent Error</h3>
            </div>
            <p className="text-red-300 text-sm">{agentError.message}</p>
          </div>
        )}

        <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Activity Log</h2>
            <button
              onClick={() => setLogs([])}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="h-96 overflow-y-auto font-mono text-sm space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-500 italic">No activity yet. Click "Start" to begin.</div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    log.includes('❌') ? 'bg-red-900/20 text-red-300' :
                    log.includes('✅') ? 'bg-green-900/20 text-green-300' :
                    log.includes('🎤') ? 'bg-blue-900/20 text-blue-300' :
                    log.includes('Agent:') ? 'bg-purple-900/20 text-purple-300' :
                    log.includes('User:') ? 'bg-yellow-900/20 text-yellow-300' :
                    'bg-gray-800 text-gray-300'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-400">
            💡 Make sure you have your <code className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">VITE_DEEPGRAM_API_KEY</code> environment variable configured.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AgentPage; 