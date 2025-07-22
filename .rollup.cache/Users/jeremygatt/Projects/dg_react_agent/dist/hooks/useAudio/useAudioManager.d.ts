import { BaseAudioManager } from '../../utils/shared/BaseAudioManager';
import { AudioError } from '../../types/common/error';
export interface UseAudioManagerOptions {
    debug?: boolean;
    onError?: (error: AudioError) => void;
}
export interface UseAudioManagerReturn {
    initialize: () => Promise<void>;
    cleanup: () => void;
    isInitialized: boolean;
    error: AudioError | null;
}
export declare function useAudioManager(manager: BaseAudioManager | null, options?: UseAudioManagerOptions): UseAudioManagerReturn;
