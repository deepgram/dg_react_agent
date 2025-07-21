export interface BaseError {
  name: string;
  message: string;
  type: 'audio' | 'connection' | 'api';
  code: string;
  details?: any;
}

export interface AudioError extends BaseError {
  type: 'audio';
  details: {
    context: string;
    originalError: Error;
    audioContextState?: AudioContextState;
  };
}

export interface ConnectionError extends BaseError {
  type: 'connection';
  details: {
    originalError: Error;
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

export type DeepgramError = AudioError | ConnectionError | APIError; 