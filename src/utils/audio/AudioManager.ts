import { DeepgramError } from '../../types';
// Import the inlined worklet code - add ?url suffix
import audioWorkletProcessorUrl from './AudioWorkletProcessor.js?url';
import { createAudioBuffer, playAudioBuffer } from './AudioUtils';

/**
 * Event types emitted by the AudioManager
 */
export type AudioEvent =
  | { type: 'ready' }
  | { type: 'recording'; isRecording: boolean }
  | { type: 'playing'; isPlaying: boolean }
  | { type: 'error'; error: DeepgramError }
  | { type: 'data'; data: ArrayBuffer };

/**
 * Options for the AudioManager
 */
export interface AudioManagerOptions {
  /**
   * Target sample rate for microphone capture
   */
  sampleRate?: number;
  
  /**
   * Output sample rate for agent audio
   */
  outputSampleRate?: number;
  
  /**
   * Enable volume normalization
   */
  normalizeVolume?: boolean;
  
  /**
   * Volume normalization factor (higher = quieter)
   */
  normalizationFactor?: number;
  
  /**
   * Enable verbose logging
   */
  debug?: boolean;
}

/**
 * Default options for the AudioManager
 */
const DEFAULT_OPTIONS: Partial<AudioManagerOptions> = {
  sampleRate: 16000,
  outputSampleRate: 24000,
  normalizeVolume: true,
  normalizationFactor: 128,
  debug: false,
};

/**
 * Manages audio capture and playback
 */
export class AudioManager {
  private options: Omit<AudioManagerOptions, 'processorUrl'>; // processorUrl is no longer needed
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isRecording = false;
  private isPlaying = false;
  private isInitialized = false;
  private eventListeners: Array<(event: AudioEvent) => void> = [];
  
  // Improved audio playback variables
  private startTimeRef = { current: 0 };
  private analyzer: AnalyserNode | null = null;
  private analyzerData: Uint8Array | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private activeSourceNodes: AudioBufferSourceNode[] = []; // Track all active/scheduled sources
  
  /**
   * Creates a new AudioManager
   */
  constructor(options: Omit<AudioManagerOptions, 'processorUrl'>) { // Update constructor options
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.log('AudioManager created');
  }
  
  /**
   * Logs a message if debug is enabled
   */
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[AudioManager]', ...args);
    }
  }
  
  /**
   * Adds an event listener
   */
  public addEventListener(listener: (event: AudioEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Emits an event to all listeners
   */
  private emit(event: AudioEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in AudioManager event listener:', error);
      }
    });
  }
  
  /**
   * Initializes the AudioManager
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      this.log('Initializing AudioManager');
      
      // Create AudioContext
      this.audioContext = new AudioContext({
        sampleRate: this.options.sampleRate,
        latencyHint: 'interactive',
      });
      
      // Create analyzer for volume normalization
      if (this.options.normalizeVolume) {
        this.analyzer = this.audioContext.createAnalyser();
        this.analyzer.fftSize = 1024;
        this.analyzerData = new Uint8Array(this.analyzer.frequencyBinCount);
        this.log('Created audio analyzer for volume normalization');
      }
      
      // Reset start time reference
      this.startTimeRef.current = 0;
      
      // Load the AudioWorklet processor using the imported Data URI
      await this.audioContext.audioWorklet.addModule(audioWorkletProcessorUrl);
      this.log('AudioWorklet loaded from Data URI');
      
      this.isInitialized = true;
      this.emit({ type: 'ready' });
    } catch (error) {
      this.log('Failed to initialize AudioManager:', error);
      this.emit({
        type: 'error',
        error: {
          service: 'transcription',
          code: 'audio_init_error',
          message: 'Failed to initialize audio',
          details: error,
        },
      });
      throw error;
    }
  }
  
  /**
   * Requests microphone permissions and starts capturing audio
   */
  public async startRecording(): Promise<void> {
    if (this.isRecording) {
      this.log('Already recording');
      return;
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      this.log('Requesting microphone access');
      
      // Request microphone access
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      
      // Connect microphone to AudioWorklet
      this.sourceNode = this.audioContext!.createMediaStreamSource(this.microphoneStream);
      this.workletNode = new AudioWorkletNode(this.audioContext!, 'microphone-processor');
      
      // Listen for audio data from the worklet
      this.workletNode.port.onmessage = (event: MessageEvent) => {
        const message = event.data;
        
        if (message.type === 'audio') {
          this.log('Received audio data from worklet');
          this.emit({ type: 'data', data: message.data });
        } else if (message.type === 'started') {
          this.log('Recording started');
          this.isRecording = true;
          this.emit({ type: 'recording', isRecording: true });
        } else if (message.type === 'stopped') {
          this.log('Recording stopped');
          this.isRecording = false;
          this.emit({ type: 'recording', isRecording: false });
        } else if (message.type === 'log') {
          this.log(`[AudioWorklet] ${message.message}`);
        }
      };
      
      // Connect the nodes
      this.sourceNode.connect(this.workletNode);
      this.workletNode.connect(this.audioContext!.destination);
      
      // Resume the AudioContext if it's suspended
      if (this.audioContext!.state === 'suspended') {
        await this.audioContext!.resume();
      }
      
      // Start recording
      this.workletNode.port.postMessage({ type: 'start' });
      this.log('Recording started');
    } catch (error) {
      this.log('Failed to start recording:', error);
      this.emit({
        type: 'error',
        error: {
          service: 'transcription',
          code: 'microphone_error',
          message: error instanceof DOMException && error.name === 'NotAllowedError'
            ? 'Microphone permission denied'
            : 'Failed to access microphone',
          details: error,
        },
      });
      throw error;
    }
  }
  
  /**
   * Stops recording
   */
  public stopRecording(): void {
    if (!this.isRecording) {
      return;
    }
    
    this.log('Stopping recording');
    
    // Stop the worklet
    if (this.workletNode) {
      this.workletNode.port.postMessage({ type: 'stop' });
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    
    // Stop the microphone
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    // Stop all microphone tracks
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }
    
    this.isRecording = false;
    this.emit({ type: 'recording', isRecording: false });
  }
  
  /**
   * Queues audio data for playback using precise timing
   * @param data ArrayBuffer containing audio data (Linear16 PCM expected)
   */
  public async queueAudio(data: ArrayBuffer): Promise<void> {
    if (!this.isInitialized) {
      this.log('AudioManager not initialized, initializing now...');
      await this.initialize();
      this.log('AudioManager initialized from queueAudio');
    }
    
    try {
      this.log(`Processing audio data (${data.byteLength} bytes)...`);
      this.log(`[queueAudio] Before: activeSourceNodes.length = ${this.activeSourceNodes.length}, startTimeRef.current = ${this.startTimeRef.current}`);
      
      // Create an audio buffer from the raw data
      const buffer = createAudioBuffer(
        this.audioContext!, 
        data, 
        this.options.outputSampleRate!
      );
      
      if (!buffer) {
        throw new Error('Failed to create audio buffer: buffer is undefined');
      }
      
      this.log(`[queueAudio] Created audio buffer (${buffer.duration.toFixed(3)}s)`);
      
      // Play the buffer with precise timing
      const source = playAudioBuffer(
        this.audioContext!, 
        buffer, 
        this.startTimeRef, 
        this.analyzer || undefined
      );
      this.log(`[queueAudio] Scheduled source to start at ${this.startTimeRef.current - buffer.duration} (duration: ${buffer.duration})`);
      
      // Add to active sources array for tracking
      this.activeSourceNodes.push(source);
      this.log(`[queueAudio] Added source. activeSourceNodes.length = ${this.activeSourceNodes.length}`);
      
      // Set up ended handler to remove from active sources when done
      const originalOnEnded = source.onended;
      source.onended = (event) => {
        // Remove from active sources first to ensure cleanup even if there's an error
        const index = this.activeSourceNodes.indexOf(source);
        if (index !== -1) {
          this.activeSourceNodes.splice(index, 1);
          this.log(`[onended] Source removed. activeSourceNodes.length = ${this.activeSourceNodes.length}`);
        } else {
          this.log(`[onended] Source not found in activeSourceNodes (unusual)`);
        }
        
        // Call original handler if there was one
        try {
          if (originalOnEnded) {
            originalOnEnded.call(source, event);
          }
        } catch (err) {
          this.log('Error in original onended handler:', err);
        }
      };
      
      // Set current source (for backwards compatibility)
      this.currentSource = source;
      
      // Set playing state
      const wasPlaying = this.isPlaying;
      this.isPlaying = true;
      
      // Emit playing event only if starting playback
      if (!wasPlaying) {
        this.emit({ type: 'playing', isPlaying: true });
      }
      
      // Set up ended handler for the last chunk
      this.currentSource.onended = () => {
        this.log('[currentSource.onended] Current audio source playback ended');
        
        // Only emit playing=false if this was the last scheduled chunk
        if (this.activeSourceNodes.length === 0) {
          this.log('[currentSource.onended] No more active sources, setting playing state to false');
          this.isPlaying = false;
          this.emit({ type: 'playing', isPlaying: false });
        }
      };
      
      this.log(`[queueAudio] After: activeSourceNodes.length = ${this.activeSourceNodes.length}, startTimeRef.current = ${this.startTimeRef.current}`);
      this.log(`Audio scheduled to play at ${this.startTimeRef.current.toFixed(3)}s, current time: ${this.audioContext!.currentTime.toFixed(3)}s, active sources: ${this.activeSourceNodes.length}`);
      
    } catch (error) {
      this.log('Failed to process audio:', error);
      this.emit({
        type: 'error',
        error: {
          service: 'agent',
          code: 'audio_process_error',
          message: 'Failed to process audio data',
          details: error,
        },
      });
      throw error; // Re-throw to be caught by caller
    }
  }
  
  /**
   * Stops all audio playback and clears scheduled audio
   */
  public clearAudioQueue(): void {
    this.log('🚨 CLEARING AUDIO QUEUE - EMERGENCY STOP 🚨');
    this.log(`[clearAudioQueue] Before: activeSourceNodes.length = ${this.activeSourceNodes.length}, startTimeRef.current = ${this.startTimeRef.current}`);
    
    if (!this.audioContext) {
      this.log('❌ No audioContext available');
      return;
    }
    
    // Reset the timing reference to stop future scheduling
    const oldTime = this.startTimeRef.current;
    this.startTimeRef.current = this.audioContext.currentTime;
    this.log(`⏱️ Reset timing reference from ${oldTime.toFixed(3)}s to ${this.startTimeRef.current.toFixed(3)}s`);
    
    // Stop all active source nodes
    this.log(`🔇 Attempting to stop ${this.activeSourceNodes.length} active audio sources`);
    
    if (this.activeSourceNodes.length === 0) {
      this.log('ℹ️ No active sources found to stop');
    }
    
    this.activeSourceNodes.forEach((source, index) => {
      try {
        this.log(`🔇 Stopping source ${index + 1}/${this.activeSourceNodes.length}`);
        source.onended = null; // Remove ended callback to prevent state confusion
        source.stop();
        source.disconnect();
        this.log(`✅ Source ${index + 1} stopped and disconnected`);
      } catch (error) {
        this.log(`❌ Error stopping audio source ${index + 1}:`, error);
      }
    });
    
    // Clear the active sources array
    const count = this.activeSourceNodes.length;
    this.activeSourceNodes = [];
    this.log(`🧹 Cleared ${count} active sources from tracking array`);
    
    // Also clear current source reference
    if (this.currentSource) {
      this.log('🧹 Cleared currentSource reference');
      this.currentSource = null;
    } else {
      this.log('ℹ️ No currentSource reference to clear');
    }
    
    // Force the playing state to false
    const wasPlaying = this.isPlaying;
    this.isPlaying = false;
    this.log(`🔇 Set isPlaying state to false (was: ${wasPlaying})`);
    
    // Emit playing event only if we were previously playing
    if (wasPlaying) {
      this.log('📢 Emitting playing=false event');
      this.emit({ type: 'playing', isPlaying: false });
    } else {
      this.log('ℹ️ Not emitting playing event since we weren\'t playing');
    }
    
    // Try to flush the audio context
    try {
      if (this.audioContext.state !== 'closed') {
        this.log('🔄 Attempting to flush the audio context');
        const dummy = this.audioContext.createGain();
        dummy.connect(this.audioContext.destination);
        dummy.disconnect();
      }
    } catch (err) {
      this.log('⚠️ Error while flushing audio context:', err);
    }
    
    this.log(`[clearAudioQueue] After: activeSourceNodes.length = ${this.activeSourceNodes.length}, startTimeRef.current = ${this.startTimeRef.current}`);
    this.log('✅ Audio queue cleared, all playback should have stopped');
  }
  
  /**
   * Checks if microphone permissions are granted
   */
  public static async checkMicrophonePermissions(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const microphones = devices.filter(device => device.kind === 'audioinput');
      
      if (microphones.length === 0) {
        return false;
      }
      
      // Check if we have access to device labels (indicates permission)
      return microphones.some(mic => mic.label !== '');
    } catch (error) {
      console.error('Error checking microphone permissions:', error);
      return false;
    }
  }
  
  /**
   * Cleans up resources
   */
  public dispose(): void {
    this.log('Disposing AudioManager');
    
    this.stopRecording();
    this.clearAudioQueue();
    
    if (this.analyzer) {
      this.analyzer.disconnect();
      this.analyzer = null;
      this.analyzerData = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isInitialized = false;
    this.eventListeners = [];
  }
  
  /**
   * Gets whether recording is active
   */
  public isRecordingActive(): boolean {
    return this.isRecording;
  }
  
  /**
   * Gets whether playback is active
   */
  public isPlaybackActive(): boolean {
    return this.isPlaying;
  }
} 