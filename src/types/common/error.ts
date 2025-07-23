export interface BaseError {
  name: string;
  message: string;
  type: 'connection' | 'audio' | 'api' | 'tts';
  code: string;
  details?: Record<string, any>;
}

export interface ConnectionErrorDetails {
  endpoint?: string;
  statusCode?: number;
  statusText?: string;
  originalError?: Error;
  isRateLimit?: boolean;
  reconnectAttempt?: number;
}

export interface AudioErrorDetails {
  context?: string;
  originalError?: Error;
  audioContextState?: AudioContextState;
}

export interface APIErrorDetails {
  endpoint?: string;
  statusCode?: number;
  statusText?: string;
  originalError?: Error;
}

export interface TTSErrorDetails {
  context?: string;
  originalError?: Error;
}

export class ConnectionError extends Error implements BaseError {
  public readonly name = 'ConnectionError';
  public readonly type = 'connection' as const;
  public readonly code: string;
  public readonly details?: ConnectionErrorDetails;

  constructor(message: string, details?: ConnectionErrorDetails) {
    super(message);
    this.code = details?.statusCode?.toString() || 'CONNECTION_ERROR';
    this.details = details;
  }
}

export class AudioError extends Error implements BaseError {
  public readonly name = 'AudioError';
  public readonly type = 'audio' as const;
  public readonly code = 'AUDIO_ERROR';
  public readonly details?: AudioErrorDetails;

  constructor(message: string, details?: AudioErrorDetails) {
    super(message);
    this.details = details;
  }
}

export class APIError extends Error implements BaseError {
  public readonly name = 'APIError';
  public readonly type = 'api' as const;
  public readonly code: string;
  public readonly details?: APIErrorDetails;

  constructor(message: string, details?: APIErrorDetails) {
    super(message);
    this.code = details?.statusCode?.toString() || 'API_ERROR';
    this.details = details;
  }
}

export class TTSError extends Error implements BaseError {
  public readonly name = 'TTSError';
  public readonly type = 'tts' as const;
  public readonly code = 'TTS_ERROR';
  public readonly details?: TTSErrorDetails;

  constructor(message: string, details?: TTSErrorDetails) {
    super(message);
    this.details = details;
  }
}

export type DeepgramError = ConnectionError | AudioError | APIError | TTSError; 