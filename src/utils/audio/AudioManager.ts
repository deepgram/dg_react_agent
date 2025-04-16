import { DeepgramError } from '../../types';

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
   * Worklet processor URL
   */
  processorUrl: string;
  
  /**
   * Target sample rate for microphone capture
   */
  sampleRate?: number;
  
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
  debug: false,
};

/**
 * Manages audio capture and playback
 */
export class AudioManager {
  private options: AudioManagerOptions;
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isRecording = false;
  private isPlaying = false;
  private isInitialized = false;
  private eventListeners: Array<(event: AudioEvent) => void> = [];
  private audioQueue: Array<AudioBuffer> = [];
  private currentSource: AudioBufferSourceNode | null = null;
  private processingAudio = false;
  
  /**
   * Creates a new AudioManager
   */
  constructor(options: AudioManagerOptions) {
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
      
      // Load the AudioWorklet processor
      await this.audioContext.audioWorklet.addModule(this.options.processorUrl);
      this.log('AudioWorklet loaded');
      
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
   * Queues audio data for playback
   */
  public async queueAudio(data: ArrayBuffer): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Decode the audio data
      const audioBuffer = await this.audioContext!.decodeAudioData(data);
      
      // Add to queue
      this.audioQueue.push(audioBuffer);
      this.log(`Queued audio chunk (${audioBuffer.duration.toFixed(2)}s), queue size: ${this.audioQueue.length}`);
      
      // Start processing if not already
      if (!this.processingAudio) {
        this.processAudioQueue();
      }
    } catch (error) {
      this.log('Failed to decode audio:', error);
      this.emit({
        type: 'error',
        error: {
          service: 'agent',
          code: 'audio_decode_error',
          message: 'Failed to decode audio data',
          details: error,
        },
      });
    }
  }
  
  /**
   * Processes the audio queue
   */
  private async processAudioQueue(): Promise<void> {
    if (this.processingAudio || this.audioQueue.length === 0) {
      return;
    }
    
    this.processingAudio = true;
    
    while (this.audioQueue.length > 0) {
      // Get the next buffer
      const buffer = this.audioQueue.shift()!;
      
      try {
        // Play the buffer
        await this.playBuffer(buffer);
      } catch (error) {
        this.log('Error playing audio:', error);
        // Continue with next buffer on error
      }
    }
    
    this.processingAudio = false;
  }
  
  /**
   * Plays an audio buffer
   */
  private playBuffer(buffer: AudioBuffer): Promise<void> {
    return new Promise((resolve) => {
      // Create a source node
      const source = this.audioContext!.createBufferSource();
      source.buffer = buffer;
      
      // Connect to destination
      source.connect(this.audioContext!.destination);
      
      // Set up completion handler
      source.onended = () => {
        this.log('Audio playback finished');
        this.currentSource = null;
        this.isPlaying = false;
        this.emit({ type: 'playing', isPlaying: false });
        resolve();
      };
      
      // Start playback
      this.currentSource = source;
      source.start();
      this.isPlaying = true;
      this.emit({ type: 'playing', isPlaying: true });
      this.log('Audio playback started');
    });
  }
  
  /**
   * Stops all audio playback and clears the queue
   */
  public clearAudioQueue(): void {
    this.log('Clearing audio queue');
    
    // Stop current playback
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (error) {
        this.log('Error stopping current audio source:', error);
      }
      this.currentSource = null;
    }
    
    // Clear queue
    this.audioQueue = [];
    
    this.isPlaying = false;
    this.processingAudio = false;
    this.emit({ type: 'playing', isPlaying: false });
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