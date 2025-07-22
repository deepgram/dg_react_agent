import { BaseAudioManager, BaseAudioManagerOptions, BaseAudioEventHandlers } from '../shared/BaseAudioManager';
export interface AudioOutputManagerOptions extends BaseAudioManagerOptions {
}
export interface AudioOutputEventHandlers extends BaseAudioEventHandlers {
}
export declare class AudioOutputManager extends BaseAudioManager {
    private startTimeRef;
    private currentSource;
    private isPlaying;
    constructor(options?: AudioOutputManagerOptions, handlers?: AudioOutputEventHandlers);
    protected handleAudioData(data: ArrayBuffer): Promise<void>;
    queueAudio(data: ArrayBuffer): Promise<void>;
    stop(): void;
    clearAudioQueue(): void;
    getIsPlaying(): boolean;
    cleanup(): void;
}
