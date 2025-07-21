
import { AudioError } from '../../types/common/error';
import {
  createOptimizedAudioContext,
  createAudioBuffer,
  playAudioBuffer,
  validateWebAudioSupport
} from './AudioUtils';
import { MicrophoneManager } from './MicrophoneManager';
import { MicrophoneConfig, MicrophoneEventHandlers } from '../../types/common/microphone';

interface AudioManagerOptions {
  debug?: boolean;
  enableVolumeControl?: boolean;
  initialVolume?: number;
  microphoneConfig?: Partial<MicrophoneConfig>;
}

interface AudioEventHandlers {
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
  onError?: (error: AudioError) => void;
  onMicrophoneData?: (data: ArrayBuffer) => void;
  onMicrophoneStart?: () => void;
  onMicrophoneStop?: () => void;
}

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private analyzer: AnalyserNode | null = null;
  private startTimeRef = { current: 0 };
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private isRecording = false;
  private debug: boolean;
  private microphoneManager: MicrophoneManager | null = null;

  constructor(
    private options: AudioManagerOptions = {},
    private handlers: AudioEventHandlers = {}
  ) {
    this.debug = options.debug || false;
  }

  private log(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[AudioManager] ${message}`, data || '');
    }
  }

  public async initialize(): Promise<void> {
    try {
      // Validate Web Audio support
      const support = validateWebAudioSupport();
      if (!support.supported) {
        throw new Error(`Web Audio API not supported: ${support.missingFeatures.join(', ')}`);
      }

      // Create audio context
      this.audioContext = createOptimizedAudioContext();

      // Create gain node if volume control is enabled
      if (this.options.enableVolumeControl && this.audioContext) {
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.options.initialVolume || 1.0;
        this.gainNode.connect(this.audioContext.destination);
      }

      // Create analyzer node
      if (this.audioContext) {
        this.analyzer = this.audioContext.createAnalyser();
        this.analyzer.fftSize = 2048;
      }

      // Note: Microphone initialization is deferred until user interaction
      // due to browser security requirements

      this.log('Audio manager initialized');
    } catch (error) {
      this.handleError(error as Error, 'initialize');
      throw error;
    }
  }

  private async initializeMicrophone(): Promise<void> {
    try {
      const microphoneHandlers: MicrophoneEventHandlers = {
        onAudioData: (data) => this.handlers.onMicrophoneData?.(data),
        onRecordingStart: () => {
          this.isRecording = true;
          this.handlers.onMicrophoneStart?.();
        },
        onRecordingStop: () => {
          this.isRecording = false;
          this.handlers.onMicrophoneStop?.();
        },
        onError: (error) => this.handleError(error, 'microphone')
      };

      this.microphoneManager = new MicrophoneManager(
        { ...this.options.microphoneConfig, debug: this.debug },
        microphoneHandlers
      );

      await this.microphoneManager.initialize();
      this.log('Microphone manager initialized');
    } catch (error) {
      this.handleError(error as Error, 'initializeMicrophone');
      throw error;
    }
  }

  private handleError(error: Error, context: string): void {
    const audioError: AudioError = {
      name: 'AudioError',
      message: `${context}: ${error.message}`,
      type: 'audio',
      code: 'AUDIO_ERROR',
      details: {
        context,
        originalError: error,
        audioContextState: this.audioContext?.state
      }
    };

    if (this.debug) {
      console.error('Audio Error:', audioError);
    }

    this.handlers.onError?.(audioError);
  }

  public async queueAudio(data: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    try {
      const buffer = createAudioBuffer(this.audioContext, data);
      if (!buffer) {
        return;
      }

      const source = playAudioBuffer(
        this.audioContext,
        buffer,
        this.startTimeRef,
        this.analyzer || undefined
      );

      this.currentSource = source;
      this.isPlaying = true;

      source.onended = () => {
        this.isPlaying = false;
        this.currentSource = null;
        this.handlers.onAudioEnd?.();
      };

      this.handlers.onAudioStart?.();
    } catch (error) {
      this.handleError(error as Error, 'queueAudio');
      throw error;
    }
  }

  public stop(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.startTimeRef.current = 0;
  }

  public cleanup(): void {
    this.stop();
    
    // Cleanup microphone manager
    if (this.microphoneManager) {
      this.microphoneManager.cleanup();
      this.microphoneManager = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.gainNode = null;
    this.analyzer = null;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public addEventListener(_listener: (event: any) => void): () => void {
    // TODO: Implement event listener functionality
    return () => { };
  }

  public clearAudioQueue(): void {
    this.stop();
  }

  public dispose(): void {
    this.cleanup();
  }

  public getMicrophoneState() {
    return this.microphoneManager?.getState() || null;
  }

  public hasMicrophone(): boolean {
    return this.microphoneManager !== null;
  }

  public async checkMicrophonePermissions() {
    // Initialize microphone manager on first use if not already initialized
    if (!this.microphoneManager && this.options.microphoneConfig) {
      try {
        await this.initializeMicrophone();
      } catch (error) {
        this.handleError(error as Error, 'checkMicrophonePermissions - microphone initialization');
        throw error;
      }
    }
    
    if (!this.microphoneManager) {
      throw new Error('Microphone not configured. Provide microphoneConfig in AudioManagerOptions.');
    }
    return this.microphoneManager.checkPermissions();
  }

  public async startRecording(): Promise<void> {
    // Initialize microphone manager on first use if not already initialized
    if (!this.microphoneManager && this.options.microphoneConfig) {
      try {
        await this.initializeMicrophone();
      } catch (error) {
        this.handleError(error as Error, 'startRecording - microphone initialization');
        throw error;
      }
    }
    
    if (!this.microphoneManager) {
      throw new Error('Microphone not configured. Provide microphoneConfig in AudioManagerOptions.');
    }
    
    try {
      await this.microphoneManager.startRecording();
      this.log('Recording started');
    } catch (error) {
      this.handleError(error as Error, 'startRecording');
      throw error;
    }
  }

  public stopRecording(): void {
    if (!this.microphoneManager) {
      this.log('Microphone not initialized');
      return;
    }
    
    try {
      this.microphoneManager.stopRecording();
      this.log('Recording stopped');
    } catch (error) {
      this.handleError(error as Error, 'stopRecording');
    }
  }
}
