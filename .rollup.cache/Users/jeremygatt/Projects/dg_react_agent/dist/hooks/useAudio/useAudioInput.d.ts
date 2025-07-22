import { AudioError } from '../../types/common/error';
import type { MicrophoneConfig } from '../../types/common/microphone';
interface UseAudioInputOptions {
    debug?: boolean;
    microphoneConfig?: Partial<MicrophoneConfig>;
    autoInitialize?: boolean;
    onMicrophoneData?: (data: ArrayBuffer) => void;
    onMicrophoneStart?: () => void;
    onMicrophoneStop?: () => void;
    onError?: (error: AudioError) => void;
}
interface UseAudioInputReturn {
    initialize: () => Promise<void>;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    isRecording: boolean;
    isInitialized: boolean;
    error: AudioError | null;
}
/**
 * Hook for managing microphone input.
 * Handles initialization, recording, and cleanup of microphone resources.
 */
export declare function useAudioInput(options?: UseAudioInputOptions): UseAudioInputReturn;
export {};
