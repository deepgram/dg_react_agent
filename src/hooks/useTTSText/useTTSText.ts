/**
 * TTSText Hook
 * 
 * A specialized hook for managing text processing in Text-to-Speech applications.
 * Handles text chunking, queuing, and processing with specific considerations for TTS:
 * 
 * - Maintains natural sentence boundaries
 * - Enforces TTS-appropriate chunk sizes
 * - Manages processing delays between chunks
 * - Provides TTS-specific metrics and state
 * 
 * @example
 * ```tsx
 * function TTSComponent({ apiKey }) {
 *   const {
 *     addText,
 *     clearText,
 *     pause,
 *     resume,
 *     status,
 *     metrics
 *   } = useTTSText({
 *     onChunkReady: async (chunk) => {
 *       // Send to TTS service
 *       await ttsService.speak(chunk);
 *     },
 *     debug: true
 *   });
 * 
 *   return (
 *     <div>
 *       <button onClick={() => addText("Hello, this is a long text...")}>
 *         Speak
 *       </button>
 *       <div>Status: {status}</div>
 *       <div>Words processed: {metrics.wordCount}</div>
 *     </div>
 *   );
 * }
 * ```
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useText } from '../useText/useText';

export type TTSTextStatus = 'idle' | 'processing' | 'paused' | 'error';

export interface TTSTextMetrics {
    totalCharacters: number;
    processedCharacters: number;
    totalChunks: number;
    processedChunks: number;
    averageChunkSize: number;
    wordCount: number;
    estimatedDuration: number; // in seconds, based on average speaking rate
}

export interface TTSTextOptions {
    /**
     * Maximum characters per chunk. Default: 100
     * Smaller chunks provide more responsive playback but more API calls
     */
    maxChunkSize?: number;

    /**
     * Minimum characters per chunk. Default: 5
     * Prevents tiny chunks that might sound unnatural
     */
    minChunkSize?: number;

    /**
     * Delay between chunks in milliseconds. Default: 10000 (10s)
     * Should be long enough to allow previous chunk to complete
     */
    chunkDelay?: number;

    /**
     * Average speaking rate in characters per second
     * Used for duration estimation. Default: 15
     */
    speakingRate?: number;

    /**
     * Called when a chunk is ready to be processed
     * Should return a promise that resolves when the chunk has been handled
     */
    onChunkReady?: (chunk: string) => Promise<void>;

    /**
     * Called when processing encounters an error
     */
    onError?: (error: Error) => void;

    /**
     * Called when metrics are updated
     */
    onMetricsUpdate?: (metrics: TTSTextMetrics) => void;

    /**
     * Enable debug logging
     */
    debug?: boolean;

    /**
     * Enable detailed debug logging for the sentence chunker
     */
    enableDebugChunking?: boolean;
}

export interface UseTTSTextReturn {
    /**
     * Add text to the processing queue
     * Text will be chunked and processed according to configuration
     */
    addText: (text: string) => void;

    /**
     * Clear all pending text and stop processing
     */
    clearText: () => void;

    /**
     * Pause processing after current chunk completes
     */
    pause: () => void;

    /**
     * Resume processing from last paused position
     */
    resume: () => void;

    /**
     * Current processing status
     */
    status: TTSTextStatus;

    /**
     * Current processing metrics
     */
    metrics: TTSTextMetrics;

    /**
     * Text chunk currently being processed
     */
    currentChunk: string | null;

    /**
     * Whether there is text in the queue
     */
    hasQueuedText: boolean;
}

const DEFAULT_OPTIONS: Required<Omit<TTSTextOptions, 'onChunkReady' | 'onError' | 'onMetricsUpdate'>> = {
    maxChunkSize: 100,
    minChunkSize: 5,
    chunkDelay: 10000,
    speakingRate: 15,
    debug: false,
    enableDebugChunking: false
};

/**
 * Hook for managing text processing in TTS applications
 */
export function useTTSText(options: TTSTextOptions = {}): UseTTSTextReturn {
    // Merge options with defaults
    const config = useMemo(() => ({
        ...DEFAULT_OPTIONS,
        ...options
    }), [options]);

    // State
    const [status, setStatus] = useState<TTSTextStatus>('idle');
    const [metrics, setMetrics] = useState<TTSTextMetrics>({
        totalCharacters: 0,
        processedCharacters: 0,
        totalChunks: 0,
        processedChunks: 0,
        averageChunkSize: 0,
        wordCount: 0,
        estimatedDuration: 0
    });

    // Refs for pause/resume
    const isPausedRef = useRef(false);
    const metricsRef = useRef(metrics);

    // Update metrics ref when metrics change
    useEffect(() => {
        metricsRef.current = metrics;
    }, [metrics]);

    // Logging utility
    const log = useCallback((message: string) => {
        if (config.debug) {
            console.log(`[useTTSText] ${message}`);
        }
    }, [config.debug]);

    // Calculate metrics for new text
    const calculateMetrics = useCallback((text: string) => {
        const wordCount = text.trim().split(/\s+/).length;
        const charCount = text.length;
        const estimatedDuration = charCount / config.speakingRate;

        return {
            wordCount,
            charCount,
            estimatedDuration
        };
    }, [config.speakingRate]);

    // Update metrics when a chunk is processed
    const updateMetrics = useCallback((processedChunk: string) => {
        const newMetrics = {
            ...metricsRef.current,
            processedCharacters: metricsRef.current.processedCharacters + processedChunk.length,
            processedChunks: metricsRef.current.processedChunks + 1,
            averageChunkSize: Math.round(
                (metricsRef.current.processedCharacters + processedChunk.length) / 
                (metricsRef.current.processedChunks + 1)
            )
        };

        setMetrics(newMetrics);
        config.onMetricsUpdate?.(newMetrics);
    }, [config.onMetricsUpdate]);

    // Use the base text processing hook
    const {
        addText: baseAddText,
        clearBuffer,
        stop,
        isProcessing,
        currentChunk,
        bufferSize
    } = useText({
        maxChunkLength: config.maxChunkSize,
        minChunkLength: config.minChunkSize,
        chunkDelay: config.chunkDelay,
        debug: config.debug,
        enableDebugChunking: config.enableDebugChunking,
        onChunkReady: async (chunk) => {
            if (isPausedRef.current) {
                setStatus('paused');
                return;
            }

            try {
                log(`Processing chunk: "${chunk}"`);
                await config.onChunkReady?.(chunk);
                updateMetrics(chunk);
            } catch (error) {
                setStatus('error');
                throw error;
            }
        },
        onError: (error) => {
            setStatus('error');
            config.onError?.(error);
        }
    });

    // Add text with metrics calculation
    const addText = useCallback((text: string) => {
        if (!text || text.trim().length === 0) return;

        const { wordCount, charCount, estimatedDuration } = calculateMetrics(text);

        // Update total metrics
        const newMetrics = {
            ...metricsRef.current,
            totalCharacters: metricsRef.current.totalCharacters + charCount,
            totalChunks: metricsRef.current.totalChunks + 1,
            wordCount: metricsRef.current.wordCount + wordCount,
            estimatedDuration: metricsRef.current.estimatedDuration + estimatedDuration
        };

        setMetrics(newMetrics);
        config.onMetricsUpdate?.(newMetrics);

        // Add text to processing queue
        baseAddText(text);
        setStatus('processing');
    }, [baseAddText, calculateMetrics, config.onMetricsUpdate]);

    // Clear text and reset metrics
    const clearText = useCallback(() => {
        clearBuffer();
        setStatus('idle');
        setMetrics({
            totalCharacters: 0,
            processedCharacters: 0,
            totalChunks: 0,
            processedChunks: 0,
            averageChunkSize: 0,
            wordCount: 0,
            estimatedDuration: 0
        });
    }, [clearBuffer]);

    // Pause processing
    const pause = useCallback(() => {
        isPausedRef.current = true;
        setStatus('paused');
        log('Processing paused');
    }, [log]);

    // Resume processing
    const resume = useCallback(() => {
        isPausedRef.current = false;
        if (bufferSize > 0) {
            setStatus('processing');
            log('Processing resumed');
        } else {
            setStatus('idle');
        }
    }, [bufferSize, log]);

    // Update status based on processing state
    useEffect(() => {
        if (status !== 'paused' && status !== 'error') {
            setStatus(isProcessing ? 'processing' : 'idle');
        }
    }, [isProcessing, status]);

    return {
        addText,
        clearText,
        pause,
        resume,
        status,
        metrics,
        currentChunk,
        hasQueuedText: bufferSize > 0
    };
} 