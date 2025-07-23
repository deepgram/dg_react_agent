import { TTSMetrics } from '../../types/tts';

interface MetricsCollectorOptions {
  debug?: boolean;
}

export class MetricsCollector {
  private startTime: number | null = null;
  private firstByteTime: number | null = null;
  private firstAudioTime: number | null = null;
  private totalBytes = 0;
  private chunkCount = 0;

  constructor(private options: MetricsCollectorOptions = {}) {}



  public start(): void {
    this.startTime = performance.now();
    this.firstByteTime = null;
    this.firstAudioTime = null;
    this.totalBytes = 0;
    this.chunkCount = 0;
    
    // Removed verbose logging to keep console clean
  }

  public markFirstByte(): void {
    if (this.startTime && !this.firstByteTime) {
      this.firstByteTime = performance.now();
    }
  }

  public markFirstAudio(): void {
    if (this.startTime && !this.firstAudioTime) {
      this.firstAudioTime = performance.now();
    }
  }

  public addChunk(bytes: number): void {
    this.totalBytes += bytes;
    this.chunkCount++;
  }

  public getMetrics(): TTSMetrics {
    const now = performance.now();
    const startTime = this.startTime || now;

    return {
      totalDuration: now - startTime,
      firstByteLatency: this.firstByteTime ? this.firstByteTime - startTime : 0,
      firstAudioLatency: this.firstAudioTime ? this.firstAudioTime - startTime : 0,
      totalBytes: this.totalBytes,
      averageChunkSize: this.chunkCount > 0 ? this.totalBytes / this.chunkCount : 0,
      chunkCount: this.chunkCount
    };
  }

  public reset(): void {
    this.startTime = null;
    this.firstByteTime = null;
    this.firstAudioTime = null;
    this.totalBytes = 0;
    this.chunkCount = 0;
  }
} 