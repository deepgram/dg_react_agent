import { AudioError } from '../../types/common/error';
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
export declare abstract class BaseAudioManager {
    protected options: BaseAudioManagerOptions;
    protected handlers: BaseAudioEventHandlers;
    protected audioContext: AudioContext | null;
    protected gainNode: GainNode | null;
    protected analyzer: AnalyserNode | null;
    protected debug: boolean;
    constructor(options?: BaseAudioManagerOptions, handlers?: BaseAudioEventHandlers);
    protected log(message: string, data?: any): void;
    initialize(): Promise<void>;
    protected handleError(error: Error, context: string): void;
    cleanup(): void;
    dispose(): void;
    protected abstract handleAudioData(data: ArrayBuffer): Promise<void>;
}
