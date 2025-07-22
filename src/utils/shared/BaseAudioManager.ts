import { AudioError } from '../../types/common/error';
import {
  createOptimizedAudioContext,
  validateWebAudioSupport
} from '../audio/AudioUtils';

export interface BaseAudioManagerOptions {
  debug?: boolean;
  enableVolumeControl?: boolean;
  initialVolume?: number;
}

export interface BaseAudioEventHandlers {
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
  onError?: (error: AudioError) => void;
}

export abstract class BaseAudioManager {
  protected audioContext: AudioContext | null = null;
  protected gainNode: GainNode | null = null;
  protected analyzer: AnalyserNode | null = null;
  protected debug: boolean;

  constructor(
    protected options: BaseAudioManagerOptions = {},
    protected handlers: BaseAudioEventHandlers = {}
  ) {
    this.debug = options.debug || false;
  }

  protected log(message: string, data?: any): void {
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

      this.log('Audio manager initialized');
    } catch (error) {
      this.handleError(error as Error, 'initialize');
      throw error;
    }
  }

  protected handleError(error: Error, context: string): void {
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

  public cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.gainNode = null;
    this.analyzer = null;
  }

  public dispose(): void {
    this.cleanup();
  }

  protected abstract handleAudioData(data: ArrayBuffer): Promise<void>;
} 