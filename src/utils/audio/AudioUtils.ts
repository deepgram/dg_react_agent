import { AudioProcessingOptions } from '../../types/common/audio';

/**
 * Audio processing utilities for smooth real-time audio playback
 */

/**
 * Creates an AudioBuffer from raw Linear16 PCM data
 * @param audioContext The Web Audio API AudioContext
 * @param data ArrayBuffer containing Linear16 PCM audio data
 * @param sampleRate Sample rate of the audio data (default: 48000Hz)
 * @returns AudioBuffer ready for playback
 */
export function createAudioBuffer(
  audioContext: AudioContext, 
  data: ArrayBuffer, 
  sampleRate: number = 48000
): AudioBuffer | undefined {
  const audioDataView = new Int16Array(data);
  if (audioDataView.length === 0) {
    return undefined;
  }

  const buffer = audioContext.createBuffer(1, audioDataView.length, sampleRate);
  const channelData = buffer.getChannelData(0);

  // Convert linear16 PCM to float [-1, 1]
  for (let i = 0; i < audioDataView.length; i++) {
    channelData[i] = audioDataView[i] / 32768;
  }

  return buffer;
}

/**
 * Plays an AudioBuffer with precise timing to ensure continuous playback
 * @param audioContext The Web Audio API AudioContext
 * @param buffer AudioBuffer to play
 * @param startTimeRef Reference to the start time (to maintain continuity between chunks)
 * @param analyzer Optional AudioAnalyser node for volume analysis
 * @returns AudioBufferSourceNode that's playing the buffer
 */
export function playAudioBuffer(
  audioContext: AudioContext, 
  buffer: AudioBuffer, 
  startTimeRef: { current: number },
  analyzer?: AnalyserNode
): AudioBufferSourceNode {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  
  if (analyzer) {
    source.connect(analyzer);
    analyzer.connect(audioContext.destination);
  } else {
    source.connect(audioContext.destination);
  }

  const currentTime = audioContext.currentTime;
  if (startTimeRef.current < currentTime) {
    startTimeRef.current = currentTime;
  }

  source.start(startTimeRef.current);
  startTimeRef.current += buffer.duration;

  return source;
}

/**
 * Creates a WAV header for Edge browser compatibility
 * Some browsers require proper audio container headers
 */
export function createWAVHeader(
  sampleRate: number = 48000,
  channels: number = 1,
  bitsPerSample: number = 16
): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 0, true); // File size placeholder
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Chunk size
  view.setUint16(20, 1, true); // Audio format (PCM)
  view.setUint16(22, channels, true); // Number of channels
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, sampleRate * channels * (bitsPerSample / 8), true); // Byte rate
  view.setUint16(32, channels * (bitsPerSample / 8), true); // Block align
  view.setUint16(34, bitsPerSample, true); // Bits per sample

  // data chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, 0, true); // Data size placeholder

  return new Uint8Array(header);
}

/**
 * Detects browser type for compatibility optimizations
 */
export function getBrowserInfo(): {
  isEdge: boolean;
  isChrome: boolean;
  isSafari: boolean;
  isFirefox: boolean;
} {
  const userAgent = navigator.userAgent;
  
  return {
    isEdge: /Edge|Edg/.test(userAgent),
    isChrome: /Chrome/.test(userAgent) && !/Edge|Edg/.test(userAgent),
    isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
    isFirefox: /Firefox/.test(userAgent)
  };
}

/**
 * Gets browser-optimized audio configuration
 */
export function getBrowserOptimizedConfig(): AudioProcessingOptions & {
  bufferSize: number;
  latencyHint: AudioContextLatencyCategory;
} {
  const browser = getBrowserInfo();
  
  if (browser.isEdge) {
    // Edge needs more conservative settings
    return {
      sampleRate: 48000,
      channels: 1,
      encoding: 'linear16',
      bufferSize: 8192,
      latencyHint: 'balanced'
    };
  }
  
  // Chrome and other browsers can handle more aggressive low-latency settings
  return {
    sampleRate: 48000,
    channels: 1,
    encoding: 'linear16',
    bufferSize: 4096,
    latencyHint: 'interactive'
  };
}

/**
 * Creates an optimized AudioContext for TTS playback
 */
export function createOptimizedAudioContext(): AudioContext {
  const config = getBrowserOptimizedConfig();
  
  return new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: config.sampleRate,
    latencyHint: config.latencyHint
  });
}

/**
 * Validates that required Web Audio API features are available
 */
export function validateWebAudioSupport(): {
  supported: boolean;
  missingFeatures: string[];
} {
  const missingFeatures: string[] = [];
  
  if (!window.AudioContext && !(window as any).webkitAudioContext) {
    missingFeatures.push('AudioContext');
  }
  
  if (!window.WebSocket) {
    missingFeatures.push('WebSocket');
  }
  
  if (!window.performance || !window.performance.now) {
    missingFeatures.push('Performance API');
  }
  
  return {
    supported: missingFeatures.length === 0,
    missingFeatures
  };
} 