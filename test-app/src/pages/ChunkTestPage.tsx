import React, { useState, useCallback } from 'react';
import { chunkBySentences, SentenceChunk } from '../../../src/utils/shared/SentenceChunker';

export default function ChunkTestPage() {
  const [inputText, setInputText] = useState('');
  const [maxChunkSize, setMaxChunkSize] = useState(100);
  const [minChunkSize, setMinChunkSize] = useState(5);
  const [chunks, setChunks] = useState<SentenceChunk[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  // Custom logger to capture debug output
  const logger = useCallback((message: string, data?: any) => {
    setLogs(prev => [...prev, `${message}${data ? ` ${JSON.stringify(data, null, 2)}` : ''}`]);
  }, []);

  const handleChunk = useCallback(() => {
    setLogs([]); // Clear previous logs
    
    const result = chunkBySentences(inputText, {
      maxChunkLength: maxChunkSize,
      minChunkLength: minChunkSize,
      debug: true
    });
    
    setChunks(result);
  }, [inputText, maxChunkSize, minChunkSize]);

  const handleClear = useCallback(() => {
    setInputText('');
    setChunks([]);
    setLogs([]);
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Text Chunking Test</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Configuration</label>
        <div className="flex gap-4">
          <div>
            <label className="block text-xs">Max Chunk Size</label>
            <input
              type="number"
              value={maxChunkSize}
              onChange={e => setMaxChunkSize(parseInt(e.target.value))}
              className="border rounded px-2 py-1 w-24"
            />
          </div>
          <div>
            <label className="block text-xs">Min Chunk Size</label>
            <input
              type="number"
              value={minChunkSize}
              onChange={e => setMinChunkSize(parseInt(e.target.value))}
              className="border rounded px-2 py-1 w-24"
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Input Text</label>
        <div className="flex gap-2 mb-2">
          <span className="text-sm text-gray-500">Characters: {inputText.length}</span>
        </div>
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          className="w-full h-32 border rounded p-2 font-mono text-sm"
          placeholder="Enter text to chunk..."
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleChunk}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Chunk Text
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear
        </button>
      </div>

      {chunks.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">Chunks ({chunks.length})</h2>
          <div className="border rounded divide-y">
            {chunks.map((chunk, i) => (
              <div key={i} className="p-3">
                <div className="flex gap-4 text-sm text-gray-500 mb-1">
                  <span>Chunk {i + 1}/{chunks.length}</span>
                  <span>{chunk.text.length} characters</span>
                  <span>Complete: {chunk.isComplete ? 'Yes' : 'No'}</span>
                </div>
                <div className="font-mono text-sm whitespace-pre-wrap">{chunk.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-2">Debug Logs</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm font-mono whitespace-pre-wrap">
            {logs.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
} 