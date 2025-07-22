export interface BaseError {
  name: string;
  message: string;
  type: 'audio' | 'connection' | 'api' | 'voice';
  code: string;
  details?: any;
}

export interface AudioError extends BaseError {
  type: 'audio';
  details?: {
    context?: AudioContext | string;
    deviceId?: string;
    stream?: MediaStream;
    originalError?: Error;
    audioContextState?: string;
  };
}

export interface ConnectionError extends BaseError {
  type: 'connection';
  details?: {
    url?: string;
    readyState?: number;
    closeCode?: number;
    closeReason?: string;
    originalError?: Error;
  };
}

export interface APIError extends BaseError {
  type: 'api';
  details: {
    originalError?: Error;
    originalResponse?: any;
    description?: string;
  };
}

export interface VoiceError extends BaseError {
  type: 'voice';
  details?: {
    originalError?: Error;
    context?: string;
  };
}

export type DeepgramError = AudioError | ConnectionError | APIError | VoiceError; 