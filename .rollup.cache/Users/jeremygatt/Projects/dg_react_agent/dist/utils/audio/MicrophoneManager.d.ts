import { MicrophoneConfig, MicrophoneState, MicrophoneEventHandlers, MicrophonePermissionResult } from '../../types/common/microphone';
/**
 * Manages microphone access, recording, and audio processing.
 * This class is responsible for:
 * 1. Microphone permissions and access
 * 2. Audio context and worklet setup
 * 3. Recording state management
 * 4. Audio data processing and streaming
 */
export declare class MicrophoneManager {
    private readonly config;
    private readonly handlers;
    private audioContext;
    private mediaStream;
    private sourceNode;
    private workletNode;
    private state;
    constructor(config?: MicrophoneConfig, handlers?: MicrophoneEventHandlers);
    /**
     * Checks and requests microphone permissions
     */
    checkPermissions(): Promise<MicrophonePermissionResult>;
    /**
     * Initializes the audio context and worklet
     */
    initialize(): Promise<void>;
    /**
     * Starts recording from the microphone
     */
    startRecording(): Promise<void>;
    /**
     * Stops recording
     */
    stopRecording(): void;
    /**
     * Cleans up all resources
     */
    cleanup(): void;
    isRecording(): boolean;
    isInitialized(): boolean;
    hasPermission(): boolean;
    getState(): MicrophoneState;
    private loadWorklet;
}
