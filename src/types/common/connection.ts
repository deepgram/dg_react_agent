import { DeepgramError } from './error';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error' | 'closed';

export interface WebSocketManagerOptions {
  url: string;
  apiKey: string;
  service?: 'transcription' | 'agent';
  queryParams?: Record<string, string | number | boolean>;
  debug?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  connectionTimeout?: number;
}

export interface WebSocketEventHandlers {
  onOpen?: () => void;
  onMessage?: (data: ArrayBuffer | any) => void;
  onClose?: () => void;
  onError?: (error: DeepgramError) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
}

/**
 * Configuration for Deepgram API endpoints
 */
export interface EndpointConfig {
  /**
   * URL for the transcription WebSocket endpoint
   * Default: "wss://api.deepgram.com/v1/listen"
   */
  transcriptionUrl?: string;

  /**
   * URL for the agent WebSocket endpoint
   * Default: "wss://agent.deepgram.com/v1/agent/converse"
   */
  agentUrl?: string;
} 