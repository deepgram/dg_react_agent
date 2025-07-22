import { WebSocketManagerOptions, WebSocketEventHandlers, WebSocketEventListener, ConnectionState, WebSocketEvent } from '../../types/common/connection';
import { ConnectionError } from '../../types/common/error';

export abstract class BaseWebSocketManager {
  private static instanceCounter = 0;
  private static activeInstances = new Set<number>();
  protected readonly instanceId: number;
  private isCleanedUp = false;
  protected ws: WebSocket | null = null;
  protected connectionState: ConnectionState = 'disconnected';
  protected reconnectAttempts = 0;
  protected reconnectTimer: number | null = null;
  protected isManualClose = false;
  protected eventListeners: Set<WebSocketEventListener> = new Set();

  constructor(
    protected options: WebSocketManagerOptions,
    protected handlers: WebSocketEventHandlers = {}
  ) {
    this.instanceId = ++BaseWebSocketManager.instanceCounter;
    if (BaseWebSocketManager.activeInstances.has(this.instanceId)) {
      throw new Error(`WebSocket manager #${this.instanceId} already exists`);
    }
    BaseWebSocketManager.activeInstances.add(this.instanceId);
    this.log(`🏗️ WebSocketManager #${this.instanceId} created`);
  }

  protected log(message: string, data?: any): void {
    if (this.options.debug) {
      console.log(`[WebSocketManager] ${message}`, data || '');
    }
  }

  protected updateConnectionState(newState: ConnectionState): void {
    if (this.connectionState !== newState) {
      this.log(`🔄 Connection state: ${this.connectionState} → ${newState}`);
      this.connectionState = newState;
      this.handlers.onConnectionStateChange?.(newState);
      this.notifyListeners({ type: 'state', state: newState });
    }
  }

  protected abstract buildWebSocketURL(): string;

  protected createConnection(): void {
    try {
      this.log('🔌 Creating new WebSocket connection...');
      this.updateConnectionState('connecting');
      
      const url = this.buildWebSocketURL();
      
      this.log('🔑 Using subprotocol authentication with API key');
      this.log('🔗 Full URL:', url);
      this.log('🔑 API Key:', this.options.apiKey.substring(0, 10) + '...');
      
      this.ws = new WebSocket(url, ['token', this.options.apiKey]);
      this.log('📡 WebSocket readyState after creation:', this.ws.readyState);
      
      this.setupEventHandlers();
      
    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  protected setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.log('✅ WebSocket opened successfully');
      this.updateConnectionState('connected');
      this.reconnectAttempts = 0;
      this.handlers.onOpen?.();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
          if (event.data instanceof Blob) {
            event.data.arrayBuffer().then(buffer => {
              this.handlers.onMessage?.(buffer);
              this.notifyListeners({ type: 'binary', data: buffer });
            });
          } else {
            this.handlers.onMessage?.(event.data);
            this.notifyListeners({ type: 'binary', data: event.data });
          }
        } else if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          this.handlers.onMessage?.(data);
          this.notifyListeners({ type: 'message', data });
        }
      } catch (error) {
        this.handleMessageError(error as Error);
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.log(`🔴 WebSocket closed - Code: ${event.code}, Reason: ${event.reason || 'No reason'}`);
      this.updateConnectionState('disconnected');
      this.ws = null;
      
      this.handlers.onClose?.();

      if (!this.isManualClose && this.shouldReconnect()) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.handleConnectionError(new Error('WebSocket connection error'));
    };
  }

  protected handleConnectionError(error: Error): void {
    this.log('🚨 Connection error:', error);
    this.updateConnectionState('error');
    
    const connectionError: ConnectionError = {
      name: 'ConnectionError',
      message: error.message,
      type: 'connection',
      code: 'WEBSOCKET_ERROR',
      details: { originalError: error }
    };

    this.handlers.onError?.(connectionError);
    this.notifyListeners({ type: 'error', error: connectionError });
    
    if (this.shouldReconnect()) {
      this.scheduleReconnect();
    }
  }

  protected handleMessageError(error: Error): void {
    const connectionError = new ConnectionError('Failed to handle message', {
      originalError: error
    });
    this.notifyListeners({
      type: 'error',
      error: connectionError
    });
  }

  protected shouldReconnect(): boolean {
    const maxAttempts = this.options.maxReconnectAttempts ?? 3;
    return this.reconnectAttempts < maxAttempts;
  }

  protected scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const baseDelay = this.options.reconnectDelay ?? 1000;
    const delay = baseDelay * Math.pow(2, this.reconnectAttempts);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectAttempts++;
      this.createConnection();
    }, delay);
  }

  public connect(): void {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      return;
    }

    this.isManualClose = false;
    this.createConnection();
  }

  public disconnect(): void {
    if (this.isCleanedUp) {
      return;
    }
    this.isCleanedUp = true;
    this.isManualClose = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
    }
    BaseWebSocketManager.activeInstances.delete(this.instanceId);
    this.log(`🗑️ WebSocketManager #${this.instanceId} cleaned up`);
  }

  public sendMessage(message: any): void {
    if (this.connectionState !== 'connected' || !this.ws) {
      throw new Error('WebSocket is not connected');
    }

    try {
      const jsonMessage = JSON.stringify(message);
      this.ws.send(jsonMessage);
    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  public sendBinary(data: ArrayBuffer): void {
    if (this.connectionState !== 'connected' || !this.ws) {
      throw new Error('WebSocket is not connected');
    }

    try {
      this.ws.send(data);
    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  public getState(): ConnectionState {
    return this.connectionState;
  }

  public isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  public cleanup(): void {
    if (this.isCleanedUp) {
      return;
    }
    this.isCleanedUp = true;
    this.disconnect();
    BaseWebSocketManager.activeInstances.delete(this.instanceId);
    this.log(`🗑️ WebSocketManager #${this.instanceId} cleaned up`);
    this.eventListeners.clear();
  }

  public addEventListener(listener: WebSocketEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  protected notifyListeners(event: WebSocketEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        this.log(`Error in event listener: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }
} 