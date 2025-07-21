import { DeepgramTTSResponse, TTSError, AudioChunk } from '../../types/tts';
interface MessageHandlerOptions {
    debug?: boolean;
}
interface MessageEventHandlers {
    onAudioData?: (chunk: AudioChunk) => void;
    onMetadata?: (metadata: any) => void;
    onFlushed?: () => void;
    onCleared?: () => void;
    onError?: (error: TTSError) => void;
}
export declare class MessageHandler {
    private options;
    private handlers;
    private sequenceId;
    constructor(options?: MessageHandlerOptions, handlers?: MessageEventHandlers);
    handleMessage(data: ArrayBuffer | DeepgramTTSResponse): void;
    private handleBinaryData;
    private handleJSONResponse;
    private handleError;
    resetSequence(): void;
    getCurrentSequenceId(): number;
}
export {};
