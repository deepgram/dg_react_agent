import { DeepgramTTSOptions, TTSMetrics, TTSError } from '../../../types/tts';
interface UseDeepgramTTSReturn {
    speak: (text: string) => Promise<void>;
    streamText: (text: string) => Promise<void>;
    flushStream: () => Promise<void>;
    stop: () => void;
    clear: () => Promise<void>;
    isPlaying: boolean;
    isConnected: boolean;
    isReady: boolean;
    error: TTSError | null;
    metrics: TTSMetrics | null;
}
export declare function useDeepgramTTS(apiKey: string, options?: DeepgramTTSOptions): UseDeepgramTTSReturn;
export {};
