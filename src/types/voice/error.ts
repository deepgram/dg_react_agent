import { BaseError } from '../common/error';

export type VoiceErrorCode = 
  | 'initialization_failed'
  | 'connection_failed'
  | 'audio_failed'
  | 'microphone_failed'
  | 'agent_failed'
  | 'transcription_failed'
  | 'invalid_state'
  | 'invalid_configuration'
  | 'unknown';

export class VoiceError extends Error implements BaseError {
  constructor(
    public code: VoiceErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'VoiceError';
    this.type = 'voice';
  }

  type: 'voice';
} 