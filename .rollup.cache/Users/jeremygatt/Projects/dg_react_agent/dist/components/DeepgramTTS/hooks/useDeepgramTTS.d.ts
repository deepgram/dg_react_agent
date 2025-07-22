import { TTSMetrics, TTSError } from '../../../types/tts';
import { BaseComponentConfig } from '../../../utils/shared/config';
interface TTSConfig extends BaseComponentConfig {
    enableTextChunking?: boolean;
    maxChunkSize?: number;
    model?: string;
    onConnectionChange?: (isConnected: boolean) => void;
    onError?: (error: TTSError) => void;
    onMetrics?: (metrics: TTSMetrics) => void;
}
interface UseDeepgramTTSReturn {
    speak: (text: string) => Promise<void>;
    streamText: (text: string) => Promise<void>;
    flushStream: () => Promise<void>;
    stop: () => void;
    clear: () => Promise<void>;
    disconnect: () => void;
    isPlaying: boolean;
    isConnected: boolean;
    isReady: boolean;
    error: TTSError | null;
    metrics: TTSMetrics | null;
}
export declare function useDeepgramTTS(apiKey: string, options?: TTSConfig): UseDeepgramTTSReturn;
export {};
