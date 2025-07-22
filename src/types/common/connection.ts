import { ConnectionError } from './error';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error' | 'closed';

export interface WebSocketEvent {
  type: 'state' | 'message' | 'binary' | 'error';
  state?: ConnectionState;
  data?: any;
  error?: ConnectionError;
}

export type WebSocketEventListener = (event: WebSocketEvent) => void;

export interface WebSocketManagerOptions {
  apiKey: string;
  url?: string;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  debug?: boolean;
}

export interface WebSocketEventHandlers {
  onOpen?: () => void;
  onMessage?: (data: any) => void;
  onClose?: () => void;
  onError?: (error: ConnectionError) => void;
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