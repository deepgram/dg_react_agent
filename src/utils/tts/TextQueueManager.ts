/**
 * Text Queue Manager
 * 
 * Manages text chunking and sequential sending for Deepgram TTS API.
 * - Chunks text at 800 character boundaries
 * - Sends chunks sequentially with delays between them
 * - Maintains natural sentence boundaries
 */

import { chunkBySentences, mergeSmallChunks, SentenceChunk } from '../shared/SentenceChunker';

interface TextChunk {
    text: string;
    timestamp: number;
    characterCount: number;
}

export interface TextQueueListeners {
    onQueueLengthChange?: (length: number) => void;
    onCharacterCountChange?: (count: number) => void;
    onSendText?: (text: string) => void;
    onError?: (error: Error) => void;
}

export class TextQueueManager {
    private static instance: TextQueueManager | null = null;

    private textQueue: TextChunk[] = [];
    private listeners: TextQueueListeners = {};
    private processingInterval: ReturnType<typeof setTimeout> | null = null;
    private isProcessing = false;
    private debug: boolean;

    // Configuration
    private readonly MAX_CHUNK_LENGTH = 100; // Maximum characters per chunk (reduced for testing)
    private readonly MIN_CHUNK_LENGTH = 5;   // Minimum characters per chunk
    private readonly CHUNK_DELAY_MS = 10000; // 10 second delay between chunks
    private readonly MAX_QUEUE_SIZE = 100;   // Safety limit for queue size

    private constructor(debug: boolean = false) {
        this.debug = debug;
        this.log('Text Queue Manager initialized');
    }

    private log(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
        if (!this.debug) return;
        const prefix = '[TextQueueManager]';
        switch (level) {
            case 'warn':
                console.warn(`${prefix} ${message}`);
                break;
            case 'error':
                console.error(`${prefix} ${message}`);
                break;
            default:
                console.log(`${prefix} ${message}`);
        }
    }

    static getInstance(debug: boolean = false): TextQueueManager {
        if (!TextQueueManager.instance) {
            TextQueueManager.instance = new TextQueueManager(debug);
        }
        return TextQueueManager.instance;
    }

    setDebug(debug: boolean): void {
        this.debug = debug;
        this.log('Debug mode updated');
    }

    setListeners(listeners: TextQueueListeners): void {
        this.listeners = { ...this.listeners, ...listeners };
    }

    addText(text: string): void {
        this.log(`Adding text: ${text.length} characters: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

        if (!text || text.trim().length === 0) {
            this.log('Empty text, skipping');
            return;
        }

        // Split into sentence-boundary chunks
        const sentenceChunks = chunkBySentences(text, {
            maxChunkLength: this.MAX_CHUNK_LENGTH,
            minChunkLength: this.MIN_CHUNK_LENGTH,
            preserveWhitespace: false
        });

        this.log(`Initial chunking: Split into ${sentenceChunks.length} sentence chunks`);
        sentenceChunks.forEach((chunk, i) => {
            this.log(`Sentence chunk ${i + 1}/${sentenceChunks.length}: ` +
                `"${chunk.text}" (${chunk.text.length} chars, complete: ${chunk.isComplete})`);
        });

        // Merge small chunks for better flow
        const mergedChunks = mergeSmallChunks(sentenceChunks, 20);

        this.log(`After merging: ${mergedChunks.length} chunks (reduced from ${sentenceChunks.length})`);
        mergedChunks.forEach((chunk, i) => {
            this.log(`Merged chunk ${i + 1}/${mergedChunks.length}: ` +
                `"${chunk.text}" (${chunk.text.length} chars, complete: ${chunk.isComplete})`);
        });

        // Check queue size limit
        if (this.textQueue.length + mergedChunks.length > this.MAX_QUEUE_SIZE) {
            this.log(`Cannot add ${mergedChunks.length} chunks - would exceed max queue size`, 'warn');
            return;
        }

        // Add chunks to queue
        mergedChunks.forEach(chunk => {
            this.textQueue.push({
                text: chunk.text,
                characterCount: chunk.text.length,
                timestamp: Date.now()
            });
        });

        this.log(`Queue state after adding chunks:
            - Queue length: ${this.textQueue.length}
            - Total characters: ${this.textQueue.reduce((sum, c) => sum + c.characterCount, 0)}
            - Average chunk size: ${Math.round(this.textQueue.reduce((sum, c) => sum + c.characterCount, 0) / this.textQueue.length)}
        `);

        // Start processing if not already running
        if (!this.isProcessing) {
            this.processNextChunk();
        }

        // Notify listeners
        this.notifyQueueChange();
    }

    private async processNextChunk(): Promise<void> {
        if (this.textQueue.length === 0 || this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        const chunk = this.textQueue[0];

        try {
            this.log(`🎯 Starting to process chunk ${this.textQueue.indexOf(chunk) + 1}/${this.textQueue.length}:`);
            this.log(`📝 Chunk content: "${chunk.text}" (${chunk.characterCount} chars)`);
            
            // Send the chunk
            if (this.listeners.onSendText) {
                this.log('📤 Sending chunk to Deepgram...');
                await this.listeners.onSendText(chunk.text);
                this.log('✅ Chunk sent successfully, waiting for audio response...');
            } else {
                this.log('❌ No onSendText listener registered!', 'error');
            }

            // Remove the processed chunk
            this.textQueue.shift();
            this.notifyQueueChange();

            // If there are more chunks, schedule the next one
            if (this.textQueue.length > 0) {
                this.log(`⏳ Waiting ${this.CHUNK_DELAY_MS/1000} seconds before processing next chunk...`);
                setTimeout(() => {
                    this.isProcessing = false;
                    this.log('⏰ Delay complete, processing next chunk...');
                    this.processNextChunk();
                }, this.CHUNK_DELAY_MS);
            } else {
                this.isProcessing = false;
                this.log('🏁 Queue processing complete');
            }
        } catch (error) {
            this.isProcessing = false;
            this.log(`❌ Error processing chunk: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            if (this.listeners.onError) {
                this.listeners.onError(error instanceof Error ? error : new Error('Unknown error'));
            }
        }
    }

    private notifyQueueChange(): void {
        this.listeners.onQueueLengthChange?.(this.textQueue.length);
        const totalChars = this.textQueue.reduce((sum, chunk) => sum + chunk.characterCount, 0);
        this.listeners.onCharacterCountChange?.(totalChars);
    }

    clearQueue(): void {
        this.textQueue = [];
        this.isProcessing = false;
        this.notifyQueueChange();
        this.log('Queue cleared');
    }

    stop(): void {
        this.clearQueue();
        this.log('Processing stopped');
    }
}

// Export singleton instance
export const textQueueManager = TextQueueManager.getInstance(); 