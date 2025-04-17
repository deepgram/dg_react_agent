"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
} from "react";

import type {
  ConnectionState,
  ServiceType,
  EndpointConfig,
  DeepgramError,
  ConnectionOptions,
} from "../types/connection";

import { AgentMessageType } from "../types/agent";

/**
 * Default endpoints for Deepgram services
 */
const DEFAULT_ENDPOINTS = {
  transcriptionUrl: "wss://api.deepgram.com/v1/listen" as string,
  agentUrl: "wss://agent.deepgram.com/v1/agent/converse" as string
};

/**
 * Context value for DeepgramConnection
 */
interface DeepgramConnectionContextValue {
  // WebSocket references
  agentSocket: WebSocket | null;
  transcriptionSocket: WebSocket | null;
  
  // Connection states
  agentSocketState: ConnectionState;
  transcriptionSocketState: ConnectionState;
  
  // Connection methods
  connectToAgent: () => Promise<WebSocket>;
  connectToTranscription: () => Promise<WebSocket>;
  disconnectAgent: () => void;
  disconnectTranscription: () => void;
  
  // Keep-alive
  sendKeepAlive: () => void;
  
  // Error reporting
  reportError: (error: DeepgramError) => void;
}

// Create the context with undefined default
const DeepgramConnectionContext = createContext<DeepgramConnectionContextValue | undefined>(undefined);

/**
 * Properties for the DeepgramConnectionProvider
 */
interface DeepgramConnectionProviderProps {
  children: ReactNode;
  apiKey: string;
  endpointConfig?: EndpointConfig;
  onError?: (error: DeepgramError) => void;
  onConnectionStateChange?: (service: ServiceType, state: ConnectionState) => void;
  debug?: boolean;
}

/**
 * Provider component for Deepgram connections
 */
export function DeepgramConnectionProvider({
  children,
  apiKey,
  endpointConfig,
  onError,
  onConnectionStateChange,
  debug = false,
}: DeepgramConnectionProviderProps) {
  // Socket references
  const [agentSocket, setAgentSocket] = useState<WebSocket | null>(null);
  const [transcriptionSocket, setTranscriptionSocket] = useState<WebSocket | null>(null);
  
  // Connection states
  const [agentSocketState, setAgentSocketState] = useState<ConnectionState>("closed");
  const [transcriptionSocketState, setTranscriptionSocketState] = useState<ConnectionState>("closed");
  
  // Keep alive interval reference
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Merged config
  const config = useMemo(() => ({
    transcriptionUrl: DEFAULT_ENDPOINTS.transcriptionUrl,
    agentUrl: DEFAULT_ENDPOINTS.agentUrl,
    ...endpointConfig,
  }), [endpointConfig]);
  
  // Log helper
  const log = useCallback(
    (...args: any[]) => {
      if (debug) {
        console.log("[DeepgramConnection]", ...args);
      }
    },
    [debug]
  );
  
  // Error reporting
  const reportError = useCallback(
    (error: DeepgramError) => {
      log("Error:", error);
      
      if (onError) {
        onError(error);
      }
    },
    [log, onError]
  );
  
  // Handle connection state changes
  const updateAgentSocketState = useCallback(
    (state: ConnectionState) => {
      setAgentSocketState(state);
      
      if (onConnectionStateChange) {
        onConnectionStateChange("agent", state);
      }
    },
    [onConnectionStateChange]
  );
  
  const updateTranscriptionSocketState = useCallback(
    (state: ConnectionState) => {
      setTranscriptionSocketState(state);
      
      if (onConnectionStateChange) {
        onConnectionStateChange("transcription", state);
      }
    },
    [onConnectionStateChange]
  );
  
  // Clean up function for WebSockets
  const cleanupSocket = useCallback((socket: WebSocket | null) => {
    if (socket) {
      // Remove all event listeners
      socket.onopen = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;
      
      // Close the connection if still open
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    }
  }, []);
  
  // Send keep-alive to maintain the connection
  const sendKeepAlive = useCallback(() => {
    if (agentSocket && agentSocket.readyState === WebSocket.OPEN) {
      log("Sending keep-alive to agent");
      
      try {
        agentSocket.send(JSON.stringify({ type: AgentMessageType.KEEP_ALIVE }));
      } catch (error) {
        log("Error sending keep-alive:", error);
      }
    }
  }, [agentSocket, log]);
  
  // Set up automatic keep-alive
  useEffect(() => {
    if (agentSocket && agentSocket.readyState === WebSocket.OPEN) {
      // Clear any existing interval
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
      
      // Set up new keep-alive interval (every 10 seconds)
      keepAliveIntervalRef.current = setInterval(sendKeepAlive, 10000);
      
      return () => {
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
          keepAliveIntervalRef.current = null;
        }
      };
    }
  }, [agentSocket, sendKeepAlive]);
  
  // Clean up WebSockets when component unmounts
  useEffect(() => {
    return () => {
      cleanupSocket(agentSocket);
      cleanupSocket(transcriptionSocket);
      
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
    };
  }, [agentSocket, transcriptionSocket, cleanupSocket]);
  
  // Connect to the Deepgram Agent WebSocket
  const connectToAgent = useCallback(async (): Promise<WebSocket> => {
    // Clean up existing connection if any
    if (agentSocket) {
      cleanupSocket(agentSocket);
    }
    
    // Ensure we have a valid URL
    const url = (config.agentUrl || DEFAULT_ENDPOINTS.agentUrl) as string;
    
    log("Connecting to agent:", url);
    updateAgentSocketState("connecting");
    
    return new Promise((resolve, reject) => {
      try {
        // Create new WebSocket connection
        const socket = new WebSocket(url, ["token", apiKey]);
        socket.binaryType = "arraybuffer";
        
        // Set up event handlers
        socket.onopen = () => {
          log("Agent WebSocket connected");
          updateAgentSocketState("connected");
          resolve(socket);
        };
        
        socket.onclose = (event) => {
          log("Agent WebSocket closed:", event.code, event.reason);
          updateAgentSocketState("closed");
          
          // Clean up keep-alive
          if (keepAliveIntervalRef.current) {
            clearInterval(keepAliveIntervalRef.current);
            keepAliveIntervalRef.current = null;
          }
        };
        
        socket.onerror = (event) => {
          const error: DeepgramError = {
            service: "agent",
            code: "websocket_error",
            message: "WebSocket connection error",
            details: event,
          };
          
          log("Agent WebSocket error:", error);
          updateAgentSocketState("error");
          reportError(error);
          
          reject(error);
        };
        
        // Save the reference
        setAgentSocket(socket);
      } catch (error) {
        const deepgramError: DeepgramError = {
          service: "agent",
          code: "websocket_init_error",
          message: "Failed to initialize WebSocket connection",
          details: error,
        };
        
        log("Agent connection error:", deepgramError);
        updateAgentSocketState("error");
        reportError(deepgramError);
        
        reject(deepgramError);
      }
    });
  }, [
    agentSocket,
    cleanupSocket,
    config.agentUrl,
    apiKey,
    log,
    updateAgentSocketState,
    reportError
  ]);
  
  // Connect to the Deepgram Transcription WebSocket
  const connectToTranscription = useCallback(async (): Promise<WebSocket> => {
    // Clean up existing connection if any
    if (transcriptionSocket) {
      cleanupSocket(transcriptionSocket);
    }
    
    // Ensure we have a valid URL
    const url = (config.transcriptionUrl || DEFAULT_ENDPOINTS.transcriptionUrl) as string;
    
    log("Connecting to transcription:", url);
    updateTranscriptionSocketState("connecting");
    
    return new Promise((resolve, reject) => {
      try {
        // Create new WebSocket connection
        const socket = new WebSocket(url, ["token", apiKey]);
        socket.binaryType = "arraybuffer";
        
        // Set up event handlers
        socket.onopen = () => {
          log("Transcription WebSocket connected");
          updateTranscriptionSocketState("connected");
          resolve(socket);
        };
        
        socket.onclose = (event) => {
          log("Transcription WebSocket closed:", event.code, event.reason);
          updateTranscriptionSocketState("closed");
        };
        
        socket.onerror = (event) => {
          const error: DeepgramError = {
            service: "transcription",
            code: "websocket_error",
            message: "WebSocket connection error",
            details: event,
          };
          
          log("Transcription WebSocket error:", error);
          updateTranscriptionSocketState("error");
          reportError(error);
          
          reject(error);
        };
        
        // Save the reference
        setTranscriptionSocket(socket);
      } catch (error) {
        const deepgramError: DeepgramError = {
          service: "transcription",
          code: "websocket_init_error",
          message: "Failed to initialize WebSocket connection",
          details: error,
        };
        
        log("Transcription connection error:", deepgramError);
        updateTranscriptionSocketState("error");
        reportError(deepgramError);
        
        reject(deepgramError);
      }
    });
  }, [
    transcriptionSocket,
    cleanupSocket,
    config.transcriptionUrl,
    apiKey,
    log,
    updateTranscriptionSocketState,
    reportError
  ]);
  
  // Disconnect from the agent WebSocket
  const disconnectAgent = useCallback(() => {
    if (agentSocket) {
      log("Disconnecting from agent");
      cleanupSocket(agentSocket);
      setAgentSocket(null);
      updateAgentSocketState("closed");
    }
  }, [agentSocket, cleanupSocket, log, updateAgentSocketState]);
  
  // Disconnect from the transcription WebSocket
  const disconnectTranscription = useCallback(() => {
    if (transcriptionSocket) {
      log("Disconnecting from transcription");
      cleanupSocket(transcriptionSocket);
      setTranscriptionSocket(null);
      updateTranscriptionSocketState("closed");
    }
  }, [transcriptionSocket, cleanupSocket, log, updateTranscriptionSocketState]);
  
  // Create the context value
  const contextValue = useMemo<DeepgramConnectionContextValue>(
    () => ({
      agentSocket,
      transcriptionSocket,
      agentSocketState,
      transcriptionSocketState,
      connectToAgent,
      connectToTranscription,
      disconnectAgent,
      disconnectTranscription,
      sendKeepAlive,
      reportError,
    }),
    [
      agentSocket,
      transcriptionSocket,
      agentSocketState,
      transcriptionSocketState,
      connectToAgent,
      connectToTranscription,
      disconnectAgent,
      disconnectTranscription,
      sendKeepAlive,
      reportError,
    ]
  );
  
  return (
    <DeepgramConnectionContext.Provider value={contextValue}>
      {children}
    </DeepgramConnectionContext.Provider>
  );
}

/**
 * Hook to use the Deepgram connection context
 */
export function useDeepgramConnection() {
  const context = useContext(DeepgramConnectionContext);
  
  if (!context) {
    throw new Error("useDeepgramConnection must be used within a DeepgramConnectionProvider");
  }
  
  return context;
} 