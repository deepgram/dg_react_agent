import { useCallback, useRef, useState } from 'react';
import { chunkBySentences, mergeSmallChunks, SentenceChunk } from '../../utils/shared/SentenceChunker';

interface TextChunk {
    text: string;
    timestamp: number;
    characterCount: number;
    isComplete: boolean;
}

interface UseTextOptions {
    maxChunkLength?: number;
    minChunkLength?: number;
    chunkDelay?: number;
    debug?: boolean;
    enableDebugChunking?: boolean;
    onChunkReady?: (chunk: string) => Promise<void>;
    onError?: (error: Error) => void;
}

interface UseTextReturn {
    addText: (text: string) => void;
    clearBuffer: () => void;
    stop: () => void;
    isProcessing: boolean;
    bufferSize: number;
    currentChunk: string | null;
}

const DEFAULT_OPTIONS = {
    maxChunkLength: 100,
    minChunkLength: 5,
    chunkDelay: 10000, // 10 seconds
};

/**
 * Hook for managing text processing, chunking, and queuing
 */
export function useText(options: UseTextOptions = {}): UseTextReturn {
    // Merge options with defaults
    const config = {
        ...DEFAULT_OPTIONS,
        ...options
    };

    // State and refs
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentChunk, setCurrentChunk] = useState<string | null>(null);
    const textQueue = useRef<TextChunk[]>([]);
    const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isStoppingRef = useRef(false);

    // Logging utility
    const log = useCallback((message: string) => {
        if (config.debug) {
            console.log(`[useText] ${message}`);
        }
    }, [config.debug]);

    // Process the next chunk in the queue
    const processNextChunk = useCallback(async () => {
        if (isStoppingRef.current || textQueue.current.length === 0 || !config.onChunkReady) {
            setIsProcessing(false);
            setCurrentChunk(null);
            return;
        }

        try {
            const chunk = textQueue.current[0];
            setCurrentChunk(chunk.text);
            log(`Processing chunk: "${chunk.text}" (${chunk.characterCount} chars)`);

            // Send the chunk
            await config.onChunkReady(chunk.text);
            log(`Chunk processed successfully`);

            // Remove the processed chunk
            textQueue.current.shift();

            // Schedule next chunk if there are more
            if (textQueue.current.length > 0) {
                log(`Waiting ${config.chunkDelay}ms before processing next chunk...`);
                processingTimeoutRef.current = setTimeout(() => {
                    processNextChunk();
                }, config.chunkDelay);
            } else {
                setIsProcessing(false);
                setCurrentChunk(null);
                log('Queue processing complete');
            }
        } catch (error) {
            log(`Error processing chunk: ${error instanceof Error ? error.message : 'Unknown error'}`);
            config.onError?.(error instanceof Error ? error : new Error('Unknown error'));
            setIsProcessing(false);
            setCurrentChunk(null);
        }
    }, [config.chunkDelay, config.onChunkReady, config.onError, log]);

    // Add text to the queue
    const addText = useCallback((text: string) => {
        if (!text || text.trim().length === 0) {
            log('Empty text, skipping');
            return;
        }

        log(`Adding text: ${text.length} characters`);

        // Split into sentence-boundary chunks
        const chunks = chunkBySentences(text, {
            maxChunkLength: config.maxChunkLength,
            minChunkLength: config.minChunkLength,
            preserveWhitespace: false,
            debug: config.enableDebugChunking
        });

        log(`Initial chunking: Split into ${chunks.length} sentence chunks`);
        chunks.forEach((chunk, i) => {
            log(`Sentence chunk ${i + 1}/${chunks.length}: ` +
                `"${chunk.text}" (${chunk.text.length} chars, complete: ${chunk.isComplete})`);
        });

        // Merge small chunks for better flow
        const mergedChunks = mergeSmallChunks(chunks, 20);

        log(`After merging: ${mergedChunks.length} chunks`);
        mergedChunks.forEach((chunk, i) => {
            log(`Merged chunk ${i + 1}/${mergedChunks.length}: ` +
                `"${chunk.text}" (${chunk.text.length} chars, complete: ${chunk.isComplete})`);
        });

        // Add chunks to queue
        const newChunks = mergedChunks.map(chunk => ({
            text: chunk.text,
            timestamp: Date.now(),
            characterCount: chunk.text.length,
            isComplete: chunk.isComplete
        }));

        textQueue.current.push(...newChunks);

        log(`Queue state after adding chunks:
            - Queue length: ${textQueue.current.length}
            - Total characters: ${textQueue.current.reduce((sum, c) => sum + c.characterCount, 0)}
            - Average chunk size: ${Math.round(textQueue.current.reduce((sum, c) => sum + c.characterCount, 0) / textQueue.current.length)}
        `);

        // Start processing if not already processing
        if (!isProcessing && !isStoppingRef.current) {
            setIsProcessing(true);
            processNextChunk();
        }
    }, [config.maxChunkLength, config.minChunkLength, isProcessing, log, processNextChunk, config.enableDebugChunking]);

    // Clear the text buffer
    const clearBuffer = useCallback(() => {
        textQueue.current = [];
        if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
            processingTimeoutRef.current = null;
        }
        setIsProcessing(false);
        setCurrentChunk(null);
        log('Buffer cleared');
    }, [log]);

    // Stop processing
    const stop = useCallback(() => {
        isStoppingRef.current = true;
        clearBuffer();
        log('Processing stopped');
        isStoppingRef.current = false;
    }, [clearBuffer, log]);

    return {
        addText,
        clearBuffer,
        stop,
        isProcessing,
        bufferSize: textQueue.current.length,
        currentChunk
    };
} 