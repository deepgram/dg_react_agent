export declare const DEFAULT_ENDPOINTS: {
    transcriptionUrl: string;
    agentUrl: string;
};
export declare const DEFAULT_AUDIO_OPTIONS: {
    sampleRate: number;
    outputSampleRate: number;
    normalizeVolume: boolean;
    normalizationFactor: number;
};
export declare const DEFAULT_TRANSCRIPTION_OPTIONS: {
    model: string;
    language: string;
    smart_format: boolean;
    interim_results: boolean;
    channels: number;
    sample_rate: number;
};
export declare const DEFAULT_AGENT_OPTIONS: {
    language: string;
    listenModel: string;
    thinkProviderType: string;
    thinkModel: string;
    voice: string;
    instructions: string;
};
export declare const DEFAULT_MICROPHONE_OPTIONS: {
    sampleRate: number;
    channelCount: number;
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
    latency: number;
    bufferSize: number;
    debug: boolean;
};
