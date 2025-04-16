// Listen for audio data from the worklet
this.workletNode.port.onmessage = (event) => {
  const message = event.data;
  
  if (message.type === 'audio') {
    this.log('Received audio data from worklet');
    this.emit({ type: 'data', data: message.data });
  } else if (message.type === 'started') {
    this.log('Recording started');
    this.isRecording = true;
    this.emit({ type: 'recording', isRecording: true });
  } else if (message.type === 'stopped') {
    this.log('Recording stopped');
    this.isRecording = false;
    this.emit({ type: 'recording', isRecording: false });
  } else if (message.type === 'log') {
    this.log(`[AudioWorklet] ${message.message}`);
  }
}; 