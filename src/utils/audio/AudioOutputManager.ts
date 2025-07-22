import { BaseAudioManager, BaseAudioManagerOptions, BaseAudioEventHandlers } from '../shared/BaseAudioManager';
import { createAudioBuffer, playAudioBuffer } from './AudioUtils';

export interface AudioOutputManagerOptions extends BaseAudioManagerOptions {
  // Add any TTS-specific options here
}

export interface AudioOutputEventHandlers extends BaseAudioEventHandlers {
  // Add any TTS-specific handlers here
}

export class AudioOutputManager extends BaseAudioManager {
  private startTimeRef = { current: 0 };
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;

  constructor(
    options: AudioOutputManagerOptions = {},
    handlers: AudioOutputEventHandlers = {}
  ) {
    super(options, handlers);
  }

  protected async handleAudioData(data: ArrayBuffer): Promise<void> {
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
      this.handleError(error as Error, 'handleAudioData');
      throw error;
    }
  }

  public async queueAudio(data: ArrayBuffer): Promise<void> {
    return this.handleAudioData(data);
  }

  public stop(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.startTimeRef.current = 0;
  }

  public clearAudioQueue(): void {
    this.stop();
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public override cleanup(): void {
    this.stop();
    super.cleanup();
  }
} 