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
export declare function createAudioBuffer(audioContext: AudioContext, data: ArrayBuffer, sampleRate?: number): AudioBuffer | undefined;
/**
 * Plays an AudioBuffer with precise timing to ensure continuous playback
 * @param audioContext The Web Audio API AudioContext
 * @param buffer AudioBuffer to play
 * @param startTimeRef Reference to the start time (to maintain continuity between chunks)
 * @param analyzer Optional AudioAnalyser node for volume analysis
 * @returns AudioBufferSourceNode that's playing the buffer
 */
export declare function playAudioBuffer(audioContext: AudioContext, buffer: AudioBuffer, startTimeRef: {
    current: number;
}, analyzer?: AnalyserNode): AudioBufferSourceNode;
/**
 * Creates a WAV header for Edge browser compatibility
 * Some browsers require proper audio container headers
 */
export declare function createWAVHeader(sampleRate?: number, channels?: number, bitsPerSample?: number): Uint8Array;
/**
 * Detects browser type for compatibility optimizations
 */
export declare function getBrowserInfo(): {
    isEdge: boolean;
    isChrome: boolean;
    isSafari: boolean;
    isFirefox: boolean;
};
/**
 * Gets browser-optimized audio configuration
 */
export declare function getBrowserOptimizedConfig(): AudioProcessingOptions & {
    bufferSize: number;
    latencyHint: AudioContextLatencyCategory;
};
/**
 * Creates an optimized AudioContext for TTS playback
 */
export declare function createOptimizedAudioContext(): AudioContext;
/**
 * Validates that required Web Audio API features are available
 */
export declare function validateWebAudioSupport(): {
    supported: boolean;
    missingFeatures: string[];
};
