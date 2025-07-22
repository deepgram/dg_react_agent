import { VoiceError } from '../voice/error';
export interface BaseError {
    name: string;
    message: string;
    type: 'audio' | 'connection' | 'api' | 'voice';
    code: string;
    details?: Record<string, any>;
}
export interface AudioErrorDetails {
    context?: string;
    deviceId?: string;
    stream?: MediaStream;
    audioContextState?: string;
    originalError?: Error;
}
export declare class AudioError extends Error implements BaseError {
    readonly name = "AudioError";
    readonly type: "audio";
    readonly code: string;
    readonly details?: AudioErrorDetails;
    constructor(message: string, details?: AudioErrorDetails);
}
export interface ConnectionErrorDetails {
    url?: string;
    readyState?: number;
    closeCode?: number;
    closeReason?: string;
    originalError?: Error;
}
export declare class ConnectionError extends Error implements BaseError {
    readonly name = "ConnectionError";
    readonly type: "connection";
    readonly code: string;
    readonly details?: ConnectionErrorDetails;
    constructor(message: string, details?: ConnectionErrorDetails);
}
export interface APIErrorDetails {
    endpoint?: string;
    statusCode?: number;
    statusText?: string;
    originalError?: Error;
}
export declare class APIError extends Error implements BaseError {
    readonly name = "APIError";
    readonly type: "api";
    readonly code: string;
    readonly details?: APIErrorDetails;
    constructor(message: string, details?: APIErrorDetails);
}
export type DeepgramError = AudioError | ConnectionError | APIError | VoiceError;
