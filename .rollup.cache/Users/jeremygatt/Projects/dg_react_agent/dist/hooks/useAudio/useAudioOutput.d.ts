import { UseAudioManagerOptions } from './useAudioManager';
import { AudioOutputEventHandlers } from '../../utils/audio/AudioOutputManager';
import { AudioError } from '../../types/common/error';
export interface UseAudioOutputOptions extends UseAudioManagerOptions {
    enableVolumeControl?: boolean;
    initialVolume?: number;
    onAudioStart?: AudioOutputEventHandlers['onAudioStart'];
    onAudioEnd?: AudioOutputEventHandlers['onAudioEnd'];
}
export interface UseAudioOutputReturn {
    queueAudio: (data: ArrayBuffer) => Promise<void>;
    stop: () => void;
    clearAudioQueue: () => void;
    isPlaying: boolean;
    isInitialized: boolean;
    error: AudioError | null;
}
export declare function useAudioOutput(options?: UseAudioOutputOptions): UseAudioOutputReturn;
