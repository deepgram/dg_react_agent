/**
 * Types related to connections and endpoints
 */

/**
 * Connection states for Deepgram services
 */
export type ConnectionState = 'connecting' | 'connected' | 'error' | 'closed';

/**
 * Service types used in status reporting
 */
export type ServiceType = 'transcription' | 'agent';

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

/**
 * Error object structure
 */
export interface DeepgramError {
  /**
   * Which service generated the error
   */
  service: ServiceType;
  
  /**
   * Error code (e.g., "connection_failed", "auth_error")
   */
  code: string;
  
  /**
   * Human-readable error message
   */
  message: string;
  
  /**
   * Additional error details (original error, etc.)
   */
  details?: any;
}

/**
 * Connection options for Deepgram services
 */
export interface ConnectionOptions {
  /**
   * API key for authentication
   */
  apiKey: string;
  
  /**
   * Optional configuration for endpoints
   */
  endpointConfig?: EndpointConfig;
  
  /**
   * Enable debug logging
   */
  debug?: boolean;
} 