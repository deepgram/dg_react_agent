import { MICROPHONE_CONFIG } from '../../utils/shared/config';

export type MicrophoneConfig = typeof MICROPHONE_CONFIG;

export interface MicrophoneState {
  isInitialized: boolean;
  isRecording: boolean;
  hasPermission: boolean;
  permissionState: PermissionState | null;
  error: string | null;
}

export interface MicrophoneEventHandlers {
  onInitialized?: () => void;
  onPermissionChange?: (state: PermissionState) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onAudioData?: (data: ArrayBuffer) => void;
  onError?: (error: Error) => void;
}

export interface MicrophonePermissionResult {
  granted: boolean;
  state: PermissionState;
  error?: string;
}

export interface AudioWorkletMessage {
  type: 'start' | 'stop' | 'started' | 'stopped' | 'audio';
  data?: ArrayBuffer;
} 