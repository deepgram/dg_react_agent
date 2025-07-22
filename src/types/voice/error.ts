import { BaseError } from '../common/error';

export type VoiceErrorCode =
  | 'initialization_failed'
  | 'invalid_configuration'
  | 'invalid_state'
  | 'already_initialized'
  | 'connection_failed'
  | 'microphone_error'
  | 'audio_error'
  | 'websocket_error'
  | 'transcription_error'
  | 'agent_error'
  | 'stop_failed'
  | 'start_failed'
  | 'update_failed'
  | 'interrupt_failed'
  | 'sleep_failed'
  | 'wake_failed'
  | 'inject_failed'
  | 'agent_not_initialized'
  | 'agent_not_sleeping'
  | 'unknown';

export interface VoiceErrorDetails {
  originalError?: Error;
  context?: string;
}

export class VoiceError extends Error implements BaseError {
  readonly name = 'VoiceError';
  readonly type = 'voice' as const;
  readonly code: VoiceErrorCode;
  readonly details?: VoiceErrorDetails;

  constructor(code: VoiceErrorCode, details?: VoiceErrorDetails) {
    super(VoiceError.getMessageForCode(code));
    this.code = code;
    this.details = details;
  }

  private static getMessageForCode(code: VoiceErrorCode): string {
    switch (code) {
      case 'initialization_failed':
        return 'Failed to initialize voice interaction';
      case 'invalid_configuration':
        return 'Invalid voice interaction configuration';
      case 'invalid_state':
        return 'Invalid voice interaction state';
      case 'already_initialized':
        return 'Voice interaction already initialized';
      case 'connection_failed':
        return 'Failed to establish connection';
      case 'microphone_error':
        return 'Microphone error occurred';
      case 'audio_error':
        return 'Audio error occurred';
      case 'websocket_error':
        return 'WebSocket error occurred';
      case 'transcription_error':
        return 'Transcription error occurred';
      case 'agent_error':
        return 'Agent error occurred';
      case 'stop_failed':
        return 'Failed to stop voice interaction';
      default:
        return 'Unknown voice interaction error';
    }
  }
} 