export interface AudioChunk {
  data: ArrayBuffer;
  timestamp: number;
  sequenceId: number;
}

export interface AudioProcessingOptions {
  sampleRate: number;
  channels: number;
  encoding: string;
}

export interface AudioManagerOptions {
  debug?: boolean;
  enableVolumeControl?: boolean;
  initialVolume?: number;
}

export interface AudioEventHandlers {
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
  onError?: (error: Error) => void;
} 