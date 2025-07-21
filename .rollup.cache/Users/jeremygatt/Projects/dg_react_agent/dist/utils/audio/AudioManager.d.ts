import { AudioError } from '../../types/common/error';
import { MicrophoneConfig } from '../../types/common/microphone';
interface AudioManagerOptions {
    debug?: boolean;
    enableVolumeControl?: boolean;
    initialVolume?: number;
    microphoneConfig?: Partial<MicrophoneConfig>;
}
interface AudioEventHandlers {
    onAudioStart?: () => void;
    onAudioEnd?: () => void;
    onError?: (error: AudioError) => void;
    onMicrophoneData?: (data: ArrayBuffer) => void;
    onMicrophoneStart?: () => void;
    onMicrophoneStop?: () => void;
}
export declare class AudioManager {
    private options;
    private handlers;
    private audioContext;
    private gainNode;
    private analyzer;
    private startTimeRef;
    private currentSource;
    private isPlaying;
    private isRecording;
    private debug;
    private microphoneManager;
    constructor(options?: AudioManagerOptions, handlers?: AudioEventHandlers);
    private log;
    initialize(): Promise<void>;
    private initializeMicrophone;
    private handleError;
    queueAudio(data: ArrayBuffer): Promise<void>;
    stop(): void;
    cleanup(): void;
    getIsPlaying(): boolean;
    getIsRecording(): boolean;
    addEventListener(_listener: (event: any) => void): () => void;
    clearAudioQueue(): void;
    dispose(): void;
    getMicrophoneState(): import("../../types/common/microphone").MicrophoneState | null;
    hasMicrophone(): boolean;
    checkMicrophonePermissions(): Promise<import("../../types/common/microphone").MicrophonePermissionResult>;
    startRecording(): Promise<void>;
    stopRecording(): void;
}
export {};
