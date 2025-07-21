import { DeepgramError } from '../common/error';
import { AudioChunk } from '../common/audio';
import { ConnectionState } from '../common/connection';

export type { AudioChunk, ConnectionState };
export type TTSError = DeepgramError;

export type DebugLevel = 'off' | 'hook' | 'manager' | 'verbose';

export interface DeepgramTTSOptions {
  enableMetrics?: boolean;
  enableTextChunking?: boolean;
  maxChunkSize?: number;
  debug?: boolean | DebugLevel;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (error: TTSError) => void;
  onMetrics?: (metrics: TTSMetrics) => void;
}

export interface TTSMetrics {
  totalDuration: number;
  firstByteLatency: number;
  firstAudioLatency: number;
  totalBytes: number;
  averageChunkSize: number;
  chunkCount: number;
}

export interface DeepgramTTSMessage {
  type: string;
  text?: string;
}

export interface DeepgramTTSResponse {
  type: string;
  duration?: number;
  metadata?: any;
  err_code?: string;
  err_msg?: string;
  description?: string;
} 