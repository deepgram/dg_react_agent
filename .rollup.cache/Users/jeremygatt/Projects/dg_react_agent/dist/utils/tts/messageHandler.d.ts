import { DeepgramTTSResponse, TTSError, AudioChunk } from '../../types/tts';
interface MessageHandlerOptions {
    onError?: (error: TTSError) => void;
    onAudioChunk?: (chunk: AudioChunk) => void;
    onComplete?: () => void;
    debug?: boolean;
}
export declare class MessageHandler {
    private handlers;
    private sequenceId;
    constructor(options?: MessageHandlerOptions);
    private log;
    handleMessage(message: DeepgramTTSResponse | ArrayBuffer): void;
    resetSequence(): void;
    getCurrentSequenceId(): number;
}
export {};
