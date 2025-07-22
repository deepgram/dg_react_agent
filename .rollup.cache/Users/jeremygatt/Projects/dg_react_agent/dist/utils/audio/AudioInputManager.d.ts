import { BaseAudioManager, BaseAudioManagerOptions, BaseAudioEventHandlers } from '../shared/BaseAudioManager';
import { MicrophoneConfig } from '../../types/common/microphone';
export interface AudioInputManagerOptions extends BaseAudioManagerOptions {
    microphoneConfig?: Partial<MicrophoneConfig>;
}
export interface AudioInputEventHandlers extends BaseAudioEventHandlers {
    onMicrophoneData?: (data: ArrayBuffer) => void;
    onMicrophoneStart?: () => void;
    onMicrophoneStop?: () => void;
}
export declare class AudioInputManager extends BaseAudioManager {
    private _isRecording;
    private microphoneManager;
    constructor(options?: AudioInputManagerOptions, handlers?: AudioInputEventHandlers);
    private initializeMicrophone;
    protected handleAudioData(_data: ArrayBuffer): Promise<void>;
    startRecording(): Promise<void>;
    stopRecording(): void;
    checkMicrophonePermissions(): Promise<import("../../types/common/microphone").MicrophonePermissionResult>;
    getMicrophoneState(): import("../../types/common/microphone").MicrophoneState | null;
    hasMicrophone(): boolean;
    /**
     * Check if currently recording
     */
    isRecording(): boolean;
    cleanup(): void;
}
