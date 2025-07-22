import { BaseError } from '../common/error';
export type VoiceErrorCode = 'initialization_failed' | 'invalid_configuration' | 'invalid_state' | 'already_initialized' | 'connection_failed' | 'microphone_error' | 'audio_error' | 'websocket_error' | 'transcription_error' | 'agent_error' | 'stop_failed' | 'start_failed' | 'update_failed' | 'interrupt_failed' | 'sleep_failed' | 'wake_failed' | 'inject_failed' | 'agent_not_initialized' | 'agent_not_sleeping' | 'unknown';
export interface VoiceErrorDetails {
    originalError?: Error;
    context?: string;
}
export declare class VoiceError extends Error implements BaseError {
    readonly name = "VoiceError";
    readonly type: "voice";
    readonly code: VoiceErrorCode;
    readonly details?: VoiceErrorDetails;
    constructor(code: VoiceErrorCode, details?: VoiceErrorDetails);
    private static getMessageForCode;
}
