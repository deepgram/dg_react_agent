export var DEFAULT_ENDPOINTS = {
    transcriptionUrl: 'wss://api.deepgram.com/v1/listen',
    agentUrl: 'wss://agent.deepgram.com/v1/agent/converse',
};
export var DEFAULT_AUDIO_OPTIONS = {
    sampleRate: 48000,
    outputSampleRate: 48000,
    normalizeVolume: true,
    normalizationFactor: 128,
};
export var DEFAULT_TRANSCRIPTION_OPTIONS = {
    model: 'nova-2',
    language: 'en-US',
    smart_format: true,
    interim_results: true,
    channels: 1,
    sample_rate: 48000,
};
export var DEFAULT_AGENT_OPTIONS = {
    language: 'en',
    listenModel: 'nova-2',
    thinkProviderType: 'open_ai',
    thinkModel: 'gpt-4o-mini',
    voice: 'aura-2-apollo-en',
    instructions: 'You are a helpful voice assistant.',
};
export var DEFAULT_MICROPHONE_OPTIONS = {
    sampleRate: 48000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: false,
    autoGainControl: false,
    latency: 0.01,
    bufferSize: 4096,
    debug: false,
};
//# sourceMappingURL=constants.js.map