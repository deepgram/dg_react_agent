import { MicrophoneConfig, MicrophoneState, MicrophoneEventHandlers, MicrophonePermissionResult } from '../../types/common/microphone';
export declare class MicrophoneManager {
    private audioContext;
    private mediaStream;
    private sourceNode;
    private workletNode;
    private state;
    private config;
    private handlers;
    constructor(config?: Partial<MicrophoneConfig>, handlers?: MicrophoneEventHandlers);
    private log;
    private handleError;
    checkPermissions(): Promise<MicrophonePermissionResult>;
    private requestPermissionFallback;
    initialize(): Promise<void>;
    private loadAudioWorklet;
    private loadInlineWorklet;
    startRecording(): Promise<void>;
    stopRecording(): void;
    private handleWorkletMessage;
    getState(): MicrophoneState;
    isRecording(): boolean;
    isInitialized(): boolean;
    hasPermission(): boolean;
    getAudioContext(): AudioContext | null;
    cleanup(): void;
}
