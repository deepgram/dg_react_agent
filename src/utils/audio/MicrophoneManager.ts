import {
  MicrophoneConfig,
  MicrophoneState,
  MicrophoneEventHandlers,
  MicrophonePermissionResult,
  AudioWorkletMessage
} from '../../types/common/microphone';
import { MICROPHONE_CONFIG, AUDIO_CONTEXT_CONFIG } from '../shared/config';
import { AudioError } from '../../types/common/error';

/**
 * Manages microphone access, recording, and audio processing.
 * This class is responsible for:
 * 1. Microphone permissions and access
 * 2. Audio context and worklet setup
 * 3. Recording state management
 * 4. Audio data processing and streaming
 */
export class MicrophoneManager {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private state: MicrophoneState = {
    isInitialized: false,
    isRecording: false,
    hasPermission: false,
    permissionState: null,
    error: null
  };

  constructor(
    private readonly config: MicrophoneConfig = MICROPHONE_CONFIG,
    private readonly handlers: MicrophoneEventHandlers = {}
  ) {}

  /**
   * Checks and requests microphone permissions
   */
  public async checkPermissions(): Promise<MicrophonePermissionResult> {
    try {
      // Try permissions API first
      if (navigator.permissions) {
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

        return {
          granted: this.state.hasPermission,
          state: permissionStatus.state
        };
      }

      // Fallback: try direct access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: this.config.constraints
      });
      stream.getTracks().forEach(track => track.stop()); // Clean up test stream

      this.state.hasPermission = true;
      this.state.permissionState = 'granted';

      return {
        granted: true,
        state: 'granted'
      };
    } catch (error) {
      this.state.hasPermission = false;
      this.state.permissionState = 'denied';
      
      const audioError = new AudioError('Microphone permission denied', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      
      this.handlers.onError?.(audioError);
      throw audioError;
    }
  }

  /**
   * Initializes the audio context and worklet
   */
  public async initialize(): Promise<void> {
    try {
      if (this.state.isInitialized) {
        throw new AudioError('Microphone already initialized');
      }

      // Create audio context
      this.audioContext = new AudioContext(AUDIO_CONTEXT_CONFIG);

      // Resume if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Load worklet
      await this.loadWorklet();

      this.state.isInitialized = true;
      this.state.error = null;
      this.handlers.onInitialized?.();
    } catch (error) {
      const audioError = error instanceof AudioError ? error : new AudioError('Failed to initialize microphone', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      this.handlers.onError?.(audioError);
      throw audioError;
    }
  }

  /**
   * Starts recording from the microphone
   */
  public async startRecording(): Promise<void> {
    try {
      if (!this.state.isInitialized || !this.audioContext) {
        throw new AudioError('Microphone not initialized');
      }

      if (this.state.isRecording) {
        return; // Already recording
      }

      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: this.config.constraints
      });

      // Create and connect nodes
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.workletNode = new AudioWorkletNode(this.audioContext, 'microphone-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        channelCount: this.config.constraints.channelCount
      });

      // Handle worklet messages
      this.workletNode.port.onmessage = (event) => {
        const message = event.data as AudioWorkletMessage;
        
        if (message.type === 'audio' && message.data) {
          this.handlers.onAudioData?.(message.data);
        }
      };

      // Connect nodes
      this.sourceNode.connect(this.workletNode);

      // Start processing
      this.workletNode.port.postMessage({ type: 'start' });

      this.state.isRecording = true;
      this.handlers.onRecordingStart?.();
    } catch (error) {
      const audioError = error instanceof AudioError ? error : new AudioError('Failed to start recording', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      this.handlers.onError?.(audioError);
      throw audioError;
    }
  }

  /**
   * Stops recording
   */
  public stopRecording(): void {
    try {
      if (!this.state.isRecording) {
        return; // Not recording
      }

      // Stop worklet
      this.workletNode?.port.postMessage({ type: 'stop' });

      // Disconnect nodes
      this.sourceNode?.disconnect();
      this.workletNode?.disconnect();

      // Stop media stream
      this.mediaStream?.getTracks().forEach(track => track.stop());

      // Clear references
      this.sourceNode = null;
      this.workletNode = null;
      this.mediaStream = null;

      this.state.isRecording = false;
      this.handlers.onRecordingStop?.();
    } catch (error) {
      const audioError = error instanceof AudioError ? error : new AudioError('Failed to stop recording', {
        originalError: error instanceof Error ? error : new Error('Unknown error')
      });
      this.handlers.onError?.(audioError);
      throw audioError;
    }
  }

  /**
   * Cleans up all resources
   */
  public cleanup(): void {
    this.stopRecording();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.state = {
      isInitialized: false,
      isRecording: false,
      hasPermission: false,
      permissionState: null,
      error: null
    };
  }

  // State accessors
  public isRecording(): boolean {
    return this.state.isRecording;
  }

  public isInitialized(): boolean {
    return this.state.isInitialized;
  }

  public hasPermission(): boolean {
    return this.state.hasPermission;
  }

  public getState(): MicrophoneState {
    return { ...this.state };
  }

  private async loadWorklet(): Promise<void> {
    if (!this.audioContext) {
      throw new AudioError('Audio context not initialized');
    }

    // Define worklet code
    const workletCode = `
      class MicrophoneProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          
          this.isRecording = false;
          this.sampleRate = ${this.audioContext.sampleRate}; // Use actual audio context sample rate
          this.bufferSize = ${this.config.bufferSize};
          this.buffer = new Float32Array(this.bufferSize);
          this.bufferIndex = 0;
          
          this.port.onmessage = (event) => {
            if (event.data.type === 'start') {
              this.isRecording = true;
            } else if (event.data.type === 'stop') {
              this.isRecording = false;
            }
          };
        }
        
        process(inputs) {
          if (!this.isRecording || !inputs[0] || !inputs[0][0]) {
            return true;
          }
          
          const input = inputs[0][0];
          
          for (let i = 0; i < input.length; i++) {
            this.buffer[this.bufferIndex++] = input[i];
            
            if (this.bufferIndex >= this.bufferSize) {
              this.sendBuffer();
              this.bufferIndex = 0;
            }
          }
          
          return true;
        }
        
        sendBuffer() {
          const audioData = this.buffer.slice(0, this.bufferIndex);
          const pcmData = new Int16Array(audioData.length);
          
          for (let i = 0; i < audioData.length; i++) {
            const s = Math.max(-1, Math.min(1, audioData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          this.port.postMessage({
            type: 'audio',
            data: pcmData.buffer
          }, [pcmData.buffer]);
        }
      }
      
      registerProcessor('microphone-processor', MicrophoneProcessor);
    `;

    // Create blob URL
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);

    try {
      await this.audioContext.audioWorklet.addModule(workletUrl);
    } finally {
      URL.revokeObjectURL(workletUrl);
    }
  }
} 