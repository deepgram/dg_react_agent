/// <reference types="react" />
import { VoiceWebSocketManager } from '../../../../utils/websocket/VoiceWebSocketManager';
import { AudioManager } from '../../../../utils/audio/AudioManager';
import { AgentOptions } from '../../../../types/voice';
interface ConnectionManagerConfig {
    apiKey: string;
    transcriptionUrl: string;
    agentUrl: string;
    transcriptionOptions?: Record<string, any>;
    agentOptions?: AgentOptions;
    log: (message: string, level?: 'hook' | 'manager' | 'verbose') => void;
}
export declare function useConnectionManager(config: ConnectionManagerConfig, managers: {
    transcription: React.RefObject<VoiceWebSocketManager>;
    agent: React.RefObject<VoiceWebSocketManager>;
    audio: React.RefObject<AudioManager>;
}): {
    sendAgentSettings: () => void;
    start: () => Promise<void>;
    stop: () => Promise<void>;
};
export {};
