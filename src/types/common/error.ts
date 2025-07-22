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

export class AudioError extends Error implements BaseError {
  readonly name = 'AudioError';
  readonly type = 'audio' as const;
  readonly code: string;
  readonly details?: AudioErrorDetails;

  constructor(message: string, details?: AudioErrorDetails) {
    super(message);
    this.code = 'AUDIO_ERROR';
    this.details = details;
  }
}

export interface ConnectionErrorDetails {
  url?: string;
  readyState?: number;
  closeCode?: number;
  closeReason?: string;
  originalError?: Error;
}

export class ConnectionError extends Error implements BaseError {
  readonly name = 'ConnectionError';
  readonly type = 'connection' as const;
  readonly code: string;
  readonly details?: ConnectionErrorDetails;

  constructor(message: string, details?: ConnectionErrorDetails) {
    super(message);
    this.code = 'CONNECTION_ERROR';
    this.details = details;
  }
}

export interface APIErrorDetails {
  endpoint?: string;
  statusCode?: number;
  statusText?: string;
  originalError?: Error;
}

export class APIError extends Error implements BaseError {
  readonly name = 'APIError';
  readonly type = 'api' as const;
  readonly code: string;
  readonly details?: APIErrorDetails;

  constructor(message: string, details?: APIErrorDetails) {
    super(message);
    this.code = 'API_ERROR';
    this.details = details;
  }
}

export type DeepgramError = AudioError | ConnectionError | APIError | VoiceError; 