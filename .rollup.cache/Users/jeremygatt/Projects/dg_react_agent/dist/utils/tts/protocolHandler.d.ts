import { DeepgramTTSMessage } from '../../types/tts';
interface ProtocolHandlerOptions {
    debug?: boolean;
    enableTextChunking?: boolean;
    maxChunkSize?: number;
}
export declare class ProtocolHandler {
    private options;
    constructor(options?: ProtocolHandlerOptions);
    createSpeakMessage(text: string): DeepgramTTSMessage;
    createFlushMessage(): DeepgramTTSMessage;
    createClearMessage(): DeepgramTTSMessage;
    createCloseMessage(): DeepgramTTSMessage;
    chunkBySentence(text: string, maxChunkSize?: number): string[];
    wrapInSSML(text: string): string;
}
export {};
