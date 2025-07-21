import {
  MicrophoneConfig,
  MicrophoneState,
  MicrophoneEventHandlers,
  MicrophonePermissionResult,
  AudioWorkletMessage,
  DEFAULT_MICROPHONE_CONFIG
} from '../../types/common/microphone';

export class MicrophoneManager {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private state: MicrophoneState;
  private config: MicrophoneConfig;
  private handlers: MicrophoneEventHandlers;

  constructor(
    config: Partial<MicrophoneConfig> = {},
    handlers: MicrophoneEventHandlers = {}
  ) {
    this.config = { ...DEFAULT_MICROPHONE_CONFIG, ...config };
    this.handlers = handlers;
    this.state = {
      isInitialized: false,
      isRecording: false,
      hasPermission: false,
      permissionState: null,
      error: null
    };
  }

  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[MicrophoneManager] ${message}`, data || '');
    }
  }

  private handleError(error: Error, context: string): void {
    this.state.error = `${context}: ${error.message}`;
    this.log(`Error in ${context}:`, error);
    this.handlers.onError?.(error);
  }

  public async checkPermissions(): Promise<MicrophonePermissionResult> {
    try {
      // Check if permissions API is available
      if (!navigator.permissions) {
        // Fallback: try to access microphone directly
        this.log('Permissions API not available, attempting direct access');
        return this.requestPermissionFallback();
      }

      const permissionStatus = await navigator.permissions.query({ 
        name: 'microphone' as PermissionName 
      });
      
      this.state.permissionState = permissionStatus.state;
      this.state.hasPermission = permissionStatus.state === 'granted';

      // Listen for permission changes
      permissionStatus.addEventListener('change', () => {
        this.state.permissionState = permissionStatus.state;
        this.state.hasPermission = permissionStatus.state === 'granted';
        this.handlers.onPermissionChange?.(permissionStatus.state);
      });

      this.log('Permission status:', permissionStatus.state);

      return {
        granted: this.state.hasPermission,
        state: permissionStatus.state
      };
    } catch (error) {
      this.log('Permission check failed, falling back to direct access');
      return this.requestPermissionFallback();
    }
  }

  private async requestPermissionFallback(): Promise<MicrophonePermissionResult> {
    try {
      // Try to get user media to test permissions
      const testStream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1 }
      });
      
      // If successful, we have permission
      testStream.getTracks().forEach(track => track.stop());
      
      this.state.hasPermission = true;
      this.state.permissionState = 'granted';
      
      return {
        granted: true,
        state: 'granted'
      };
    } catch (error) {
      const err = error as DOMException;
      let permissionState: PermissionState = 'prompt';
      
      if (err.name === 'NotAllowedError') {
        permissionState = 'denied';
      }
      
      this.state.hasPermission = false;
      this.state.permissionState = permissionState;
      
      return {
        granted: false,
        state: permissionState,
        error: err.message
      };
    }
  }

  public async initialize(): Promise<void> {
    try {
      this.log('Initializing microphone manager');

      // Create audio context with optimal settings (no permission needed for this)
      this.audioContext = new AudioContext({
        sampleRate: this.config.constraints.sampleRate,
        latencyHint: this.config.constraints.latency || 'interactive'
      });

      // Resume audio context if it's suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Load the audio worklet processor
      await this.loadAudioWorklet();

      this.state.isInitialized = true;
      this.state.error = null;
      
      this.log('Microphone manager initialized successfully');
      this.handlers.onInitialized?.();
    } catch (error) {
      this.handleError(error as Error, 'initialize');
      throw error;
    }
  }

  private async loadAudioWorklet(): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    // Use inline worklet for better compatibility
    this.log('Loading inline audio worklet processor');
    await this.loadInlineWorklet();
    this.log('Audio worklet loaded successfully');
  }

  private async loadInlineWorklet(): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    // Create worklet processor code as a string
    const workletCode = `
/**
 * Inline AudioWorkletProcessor for microphone capture and processing
 */
class MicrophoneProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // State
    this.isRecording = false;
    this.sampleRate = 48000; // Target sample rate
    this.bufferSize = 4096;  // Buffer size in samples
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    
    // Set up message handler
    this.port.onmessage = (event) => this.onMessage(event.data);
  }
  
  /**
   * Handles messages from the main thread
   */
  onMessage(message) {
    if (message.type === 'start') {
      this.isRecording = true;
      this.port.postMessage({ type: 'started' });
    } else if (message.type === 'stop') {
      this.isRecording = false;
      this.port.postMessage({ type: 'stopped' });
    }
  }
  
  /**
   * Processes audio input and sends it to the main thread
   */
  process(inputs, outputs, parameters) {
    if (!this.isRecording || !inputs[0] || !inputs[0][0]) {
      return true;
    }
    
    const input = inputs[0][0];
    
    // Add input samples to our buffer
    for (let i = 0; i < input.length; i++) {
      this.buffer[this.bufferIndex++] = input[i];
      
      // When buffer is full, send it to the main thread
      if (this.bufferIndex >= this.bufferSize) {
        this.sendBufferToMainThread();
        this.bufferIndex = 0;
      }
    }
    
    return true;
  }
  
  /**
   * Converts the buffer to the required format and sends it to the main thread
   */
  sendBufferToMainThread() {
    // Create a copy of the buffer
    const audioData = this.buffer.slice(0, this.bufferIndex);
    
    // Convert to 16-bit PCM
    const pcmData = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      // Convert float [-1.0, 1.0] to 16-bit PCM [-32768, 32767]
      const s = Math.max(-1, Math.min(1, audioData[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Send the PCM data to the main thread
    this.port.postMessage({
      type: 'audio',
      data: pcmData.buffer
    }, [pcmData.buffer]);
  }
}

// Register the processor
registerProcessor('microphone-processor', MicrophoneProcessor);
`;

    // Create blob URL for the worklet
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);

    try {
      await this.audioContext.audioWorklet.addModule(workletUrl);
    } finally {
      // Clean up the blob URL
      URL.revokeObjectURL(workletUrl);
    }
  }

  public async startRecording(): Promise<void> {
    if (!this.state.isInitialized || !this.audioContext) {
      throw new Error('Microphone manager not initialized');
    }

    if (this.state.isRecording) {
      this.log('Already recording');
      return;
    }

    try {
      this.log('Starting microphone recording');

      // Get user media
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: this.config.constraints
      });

      // Create source node
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create worklet node
      this.workletNode = new AudioWorkletNode(
        this.audioContext,
        'microphone-processor',
        {
          numberOfInputs: 1,
          numberOfOutputs: 0,
          channelCount: this.config.constraints.channelCount || 1
        }
      );

      // Set up worklet message handling
      this.workletNode.port.onmessage = (event) => {
        this.handleWorkletMessage(event.data);
      };

      // Connect the audio graph
      this.sourceNode.connect(this.workletNode);

      // Start the worklet processor
      this.workletNode.port.postMessage({ type: 'start' });

      this.state.isRecording = true;
      this.state.error = null;
      
      this.log('Recording started successfully');
      this.handlers.onRecordingStart?.();
    } catch (error) {
      this.handleError(error as Error, 'startRecording');
      throw error;
    }
  }

  public stopRecording(): void {
    if (!this.state.isRecording) {
      this.log('Not currently recording');
      return;
    }

    try {
      this.log('Stopping microphone recording');

      // Stop the worklet processor
      if (this.workletNode) {
        this.workletNode.port.postMessage({ type: 'stop' });
        this.workletNode.disconnect();
        this.workletNode = null;
      }

      // Disconnect source node
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }

      // Stop media stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      this.state.isRecording = false;
      this.state.error = null;
      
      this.log('Recording stopped successfully');
      this.handlers.onRecordingStop?.();
    } catch (error) {
      this.handleError(error as Error, 'stopRecording');
    }
  }

  private handleWorkletMessage(message: AudioWorkletMessage): void {
    switch (message.type) {
      case 'started':
        this.log('Worklet processor started');
        break;
      case 'stopped':
        this.log('Worklet processor stopped');
        break;
      case 'audio':
        if (message.data) {
          this.handlers.onAudioData?.(message.data);
        }
        break;
      default:
        this.log('Unknown worklet message:', message);
    }
  }

  public getState(): MicrophoneState {
    return { ...this.state };
  }

  public isRecording(): boolean {
    return this.state.isRecording;
  }

  public isInitialized(): boolean {
    return this.state.isInitialized;
  }

  public hasPermission(): boolean {
    return this.state.hasPermission;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  public cleanup(): void {
    this.log('Cleaning up microphone manager');
    
    this.stopRecording();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.state.isInitialized = false;
    this.state.hasPermission = false;
    this.state.permissionState = null;
    this.state.error = null;
  }
} 