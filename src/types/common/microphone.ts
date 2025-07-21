export interface MicrophoneConstraints {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  latency?: number;
}

export interface MicrophoneConfig {
  constraints: MicrophoneConstraints;
  bufferSize?: number;
  debug?: boolean;
}

export interface MicrophoneState {
  isInitialized: boolean;
  isRecording: boolean;
  hasPermission: boolean;
  permissionState: PermissionState | null;
  error: string | null;
}

export interface MicrophoneEventHandlers {
  onInitialized?: () => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onAudioData?: (data: ArrayBuffer) => void;
  onError?: (error: Error) => void;
  onPermissionChange?: (state: PermissionState) => void;
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

export const DEFAULT_MICROPHONE_CONFIG: MicrophoneConfig = {
  constraints: {
    sampleRate: 48000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: false,
    autoGainControl: false,
    latency: 0.01 // 10ms latency
  },
  bufferSize: 4096,
  debug: false
}; 