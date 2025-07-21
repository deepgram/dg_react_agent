import { TTSMetrics } from '../../types/tts';
interface MetricsCollectorOptions {
    debug?: boolean;
}
export declare class MetricsCollector {
    private options;
    private startTime;
    private firstByteTime;
    private firstAudioTime;
    private totalBytes;
    private chunkCount;
    constructor(options?: MetricsCollectorOptions);
    start(): void;
    markFirstByte(): void;
    markFirstAudio(): void;
    addChunk(bytes: number): void;
    getMetrics(): TTSMetrics;
    reset(): void;
}
export {};
