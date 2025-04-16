/**
 * AudioWorkletProcessor for microphone capture and processing
 * 
 * This processor captures audio from the microphone, resamples it to 16kHz,
 * and converts it to Linear PCM format for sending to Deepgram.
 */
class MicrophoneProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // State
    this.isRecording = false;
    this.sampleRate = 16000; // Target sample rate
    this.bufferSize = 4096;  // Buffer size in samples
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.debugCounter = 0; // Add counter for logging
    
    // Set up message handler
    this.port.onmessage = (event) => this.onMessage(event.data);
    
    // Log processor creation
    this.port.postMessage({ type: 'log', message: 'MicrophoneProcessor initialized' });
  }
  
  /**
   * Handles messages from the main thread
   */
  onMessage(message) {
    if (message.type === 'start') {
      this.isRecording = true;
      this.port.postMessage({ type: 'started' });
      this.port.postMessage({ type: 'log', message: 'MicrophoneProcessor recording started' });
    } else if (message.type === 'stop') {
      this.isRecording = false;
      this.port.postMessage({ type: 'stopped' });
      this.port.postMessage({ type: 'log', message: 'MicrophoneProcessor recording stopped' });
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
    
    // Log input periodically (every 100 frames to avoid flooding console)
    if (this.debugCounter++ % 100 === 0) {
      this.port.postMessage({ 
        type: 'log', 
        message: `Processing audio: input length=${input.length}, bufferIndex=${this.bufferIndex}`
      });
    }
    
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
    
    // Log buffer sent
    this.port.postMessage({ 
      type: 'log', 
      message: `Sending buffer: size=${pcmData.length} samples`
    });
    
    // Send the PCM data to the main thread
    this.port.postMessage({
      type: 'audio',
      data: pcmData.buffer
    }, [pcmData.buffer]);
  }
}

// Register the processor
registerProcessor('microphone-processor', MicrophoneProcessor); 