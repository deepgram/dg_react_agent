/**
 * Audio processing utilities for smooth real-time audio playback
 */

/**
 * Creates an AudioBuffer from raw Linear16 PCM data
 * @param audioContext The Web Audio API AudioContext
 * @param data ArrayBuffer containing Linear16 PCM audio data
 * @param sampleRate Sample rate of the audio data (default: 24000Hz)
 * @returns AudioBuffer ready for playback
 */
export function createAudioBuffer(
  audioContext: AudioContext, 
  data: ArrayBuffer, 
  sampleRate: number = 24000
): AudioBuffer | undefined {
  const audioDataView = new Int16Array(data);
  if (audioDataView.length === 0) {
    console.error("Received audio data is empty.");
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
 * Downsamples audio data from one sample rate to another
 * @param buffer Float32Array of audio samples
 * @param fromSampleRate Original sample rate
 * @param toSampleRate Target sample rate
 * @returns Downsampled Float32Array
 */
export function downsample(
  buffer: Float32Array, 
  fromSampleRate: number, 
  toSampleRate: number
): Float32Array {
  if (fromSampleRate === toSampleRate) {
    return buffer;
  }
  
  const sampleRateRatio = fromSampleRate / toSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0, count = 0;
    
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    
    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  
  return result;
}

/**
 * Converts Float32Array audio data to Int16Array format
 * @param buffer Float32Array of audio samples
 * @returns ArrayBuffer containing Int16 audio data
 */
export function convertFloat32ToInt16(buffer: Float32Array): ArrayBuffer {
  let l = buffer.length;
  const buf = new Int16Array(l);
  
  while (l--) {
    buf[l] = Math.min(1, buffer[l]) * 0x7fff;
  }
  
  return buf.buffer;
}

/**
 * Normalizes audio volume using frequency data from an analyzer
 * @param analyzer AudioAnalyser node
 * @param dataArray Uint8Array to store analyzer data
 * @param normalizationFactor Factor to normalize against (higher = quieter)
 * @returns Normalized volume level between 0-1
 */
export function normalizeVolume(
  analyzer: AnalyserNode, 
  dataArray: Uint8Array, 
  normalizationFactor: number
): number {
  analyzer.getByteFrequencyData(dataArray);
  const sum = dataArray.reduce((acc, val) => acc + val, 0);
  const average = sum / dataArray.length;
  return Math.min(average / normalizationFactor, 1);
} 