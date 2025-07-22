/**
 * Utility for intelligently chunking text into sentences
 */

// Common abbreviations that shouldn't trigger sentence breaks
const ABBREVIATIONS = new Set([
    // English
    'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr', 'Ph.D', 'M.D', 'B.A', 'M.A', 'B.S', 'M.S',
    'i.e', 'e.g', 'etc', 'vs', 'Inc', 'Ltd', 'Co', 'Corp',
    // Common international
    'M', 'Mme', 'Mlle', 'Dr', 'Prof', // French
    'Herr', 'Frau', 'Dr', 'Prof', // German
    'Sr', 'Sra', 'Dr', 'Prof', // Spanish
    'Sig', 'Sig.ra', 'Dott', 'Prof', // Italian
]);

// Sentence ending punctuation patterns
const SENTENCE_ENDINGS = /[.!?]+/g;

// Pattern to match ellipsis (should not split)
const ELLIPSIS_PATTERN = /\.{2,}/g;

// Pattern to match multiple exclamation/question marks
const MULTIPLE_PUNCT_PATTERN = /[!?]{2,}/g;

export interface SentenceChunk {
    text: string;
    index: number;
    isComplete: boolean;
}

/**
 * Chunks text into sentences intelligently
 * @param text The text to chunk
 * @param options Chunking options
 * @returns Array of sentence chunks
 */
export function chunkBySentences(
    text: string,
    options: {
        minChunkLength?: number;
        maxChunkLength?: number;
        preserveWhitespace?: boolean;
        debug?: boolean;
    } = {}
): SentenceChunk[] {
    const {
        minChunkLength = 5,
        maxChunkLength = 500,
        preserveWhitespace = false,
        debug = false
    } = options;

    const log = (message: string, data?: any) => {
        if (debug) {
            console.log(`[SentenceChunker] ${message}`, data || '');
        }
    };

    log(`Processing text (${text.length} chars): "${text}"`);
    log(`Config: maxLength=${maxChunkLength}, minLength=${minChunkLength}`);

    if (!text || text.trim().length === 0) {
        log('Empty text, returning empty array');
        return [];
    }

    // If text is under maxChunkLength, return it as a single chunk
    if (text.length <= maxChunkLength) {
        log('Text is under max length, returning as single chunk');
        let finalText = preserveWhitespace ? text : text.trim();
        // Remove trailing period (full stop) only
        if (finalText.endsWith('.')) {
            finalText = finalText.slice(0, -1).trim();
        }
        return [{
            text: finalText,
            index: 0,
            isComplete: true
        }];
    }

    log('Text exceeds max length, splitting into chunks');
    const chunks: SentenceChunk[] = [];
    let currentPosition = 0;
    let chunkIndex = 0;

    // Replace ellipsis with placeholder to avoid splitting
    const ellipsisPlaceholder = '\u0001ELLIPSIS\u0001';
    const processedText = text.replace(ELLIPSIS_PATTERN, ellipsisPlaceholder);

    // Find all potential sentence boundaries
    const boundaries: Array<{ index: number; match: string }> = [];
    let match: RegExpExecArray | null;

    SENTENCE_ENDINGS.lastIndex = 0;
    while ((match = SENTENCE_ENDINGS.exec(processedText)) !== null) {
        boundaries.push({ index: match.index + match[0].length, match: match[0] });
    }

    log(`Found ${boundaries.length} potential sentence boundaries`);

    // Process each potential boundary
    for (const boundary of boundaries) {
        const sentenceCandidate = processedText.slice(currentPosition, boundary.index).trim();
        log(`Evaluating boundary at position ${boundary.index}:`, sentenceCandidate);

        // Check if this is a real sentence ending
        if (shouldSplitAtBoundary(processedText, boundary.index, sentenceCandidate)) {
            // Restore ellipsis in the chunk
            let chunkText = sentenceCandidate.replace(new RegExp(ellipsisPlaceholder, 'g'), '...');

            if (!preserveWhitespace) {
                chunkText = chunkText.trim();
            }

            log(`Valid sentence boundary found, chunk length: ${chunkText.length}`);

            // Only add if meets minimum length requirement
            if (chunkText.length >= minChunkLength) {
                // Handle very long sentences by splitting at logical points
                if (chunkText.length > maxChunkLength) {
                    log(`Chunk exceeds max length (${chunkText.length} > ${maxChunkLength}), splitting further`);
                    const subChunks = splitLongSentence(chunkText, maxChunkLength);
                    log(`Split into ${subChunks.length} sub-chunks`);
                    chunks.push(...subChunks.map((subChunk, idx) => {
                        // Remove trailing period (full stop) only
                        let finalText = subChunk;
                        if (finalText.endsWith('.')) {
                            finalText = finalText.slice(0, -1).trim();
                        }
                        return {
                            text: finalText,
                            index: chunkIndex++,
                            isComplete: idx === subChunks.length - 1
                        };
                    }));
                } else {
                    // Remove trailing period (full stop) only
                    let finalText = chunkText;
                    if (finalText.endsWith('.')) {
                        finalText = finalText.slice(0, -1).trim();
                    }
                    log(`Adding chunk: "${finalText}"`);
                    chunks.push({
                        text: finalText,
                        index: chunkIndex++,
                        isComplete: true
                    });
                }
            } else {
                log(`Chunk too small (${chunkText.length} < ${minChunkLength}), skipping`);
            }

            currentPosition = boundary.index;
        } else {
            log('Not a valid sentence boundary, continuing');
        }
    }

    // Handle any remaining text
    if (currentPosition < processedText.length) {
        const remainingText = processedText.slice(currentPosition).replace(new RegExp(ellipsisPlaceholder, 'g'), '...');
        const trimmedRemaining = preserveWhitespace ? remainingText : remainingText.trim();

        if (trimmedRemaining.length > 0) {
            log(`Processing remaining text: "${trimmedRemaining}"`);
            // Remove trailing period (full stop) only
            let finalText = trimmedRemaining;
            if (finalText.endsWith('.')) {
                finalText = finalText.slice(0, -1).trim();
            }
            chunks.push({
                text: finalText,
                index: chunkIndex++,
                isComplete: false // Last chunk might be incomplete
            });
        }
    }

    log(`Final chunks (${chunks.length}):`, chunks);
    return chunks;
}

/**
 * Determines if a boundary should be treated as a sentence ending
 */
function shouldSplitAtBoundary(text: string, boundaryIndex: number, sentenceCandidate: string): boolean {
    // Don't split if sentence is too short
    if (sentenceCandidate.trim().length < 3) {
        return false;
    }

    // Check if the period might be part of an abbreviation
    const words = sentenceCandidate.trim().split(/\s+/);
    const lastWord = words[words.length - 1];

    if (lastWord && lastWord.endsWith('.')) {
        const wordWithoutPeriod = lastWord.slice(0, -1);
        if (ABBREVIATIONS.has(wordWithoutPeriod)) {
            return false;
        }
    }

    // Check what comes after the boundary
    if (boundaryIndex < text.length) {
        const nextChar = text[boundaryIndex];
        const nextNonWhitespace = text.slice(boundaryIndex).trim()[0];

        // If next character is lowercase, might not be a sentence boundary
        if (nextNonWhitespace && /[a-z]/.test(nextNonWhitespace)) {
            // Unless it's after multiple punctuation marks (e.g., "What?! really?")
            const precedingPunct = text.slice(Math.max(0, boundaryIndex - 5), boundaryIndex);
            if (!MULTIPLE_PUNCT_PATTERN.test(precedingPunct)) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Splits a long sentence into smaller chunks at logical break points
 */
function splitLongSentence(sentence: string, maxLength: number): string[] {
    const chunks: string[] = [];

    // Try to split at commas, semicolons, or conjunctions
    const splitPoints = [
        /,\s+/g,           // Commas
        /;\s+/g,           // Semicolons
        /\s+and\s+/gi,     // Conjunctions
        /\s+but\s+/gi,
        /\s+or\s+/gi,
        /\s+—\s+/g,        // Em dashes
        /\s+-\s+/g,        // Hyphens used as dashes
    ];

    let remaining = sentence;

    while (remaining.length > maxLength) {
        let splitFound = false;

        // Try each split point pattern
        for (const pattern of splitPoints) {
            pattern.lastIndex = 0;
            const matches: Array<{ index: number; length: number }> = [];
            let match: RegExpExecArray | null;

            while ((match = pattern.exec(remaining)) !== null) {
                if (match.index < maxLength && match.index > maxLength * 0.3) {
                    matches.push({ index: match.index, length: match[0].length });
                }
            }

            // Use the match closest to our target length
            if (matches.length > 0) {
                const bestMatch = matches.reduce((best, current) =>
                    Math.abs(current.index - maxLength * 0.7) < Math.abs(best.index - maxLength * 0.7) ? current : best
                );

                chunks.push(remaining.slice(0, bestMatch.index).trim());
                remaining = remaining.slice(bestMatch.index + bestMatch.length).trim();
                splitFound = true;
                break;
            }
        }

        // If no good split point found, split at word boundary
        if (!splitFound) {
            const words = remaining.split(/\s+/);
            let currentChunk = '';
            let wordIndex = 0;

            while (wordIndex < words.length && (currentChunk + ' ' + words[wordIndex]).length <= maxLength) {
                currentChunk = currentChunk ? currentChunk + ' ' + words[wordIndex] : words[wordIndex];
                wordIndex++;
            }

            if (currentChunk) {
                chunks.push(currentChunk);
                remaining = words.slice(wordIndex).join(' ');
            } else {
                // Single word exceeds max length, force split
                chunks.push(remaining.slice(0, maxLength));
                remaining = remaining.slice(maxLength);
            }
        }
    }

    if (remaining) {
        chunks.push(remaining);
    }

    return chunks;
}

/**
 * Utility to merge small chunks if needed
 */
export function mergeSmallChunks(chunks: SentenceChunk[], minLength: number = 20): SentenceChunk[] {
    const merged: SentenceChunk[] = [];
    let buffer = '';
    let bufferStartIndex = 0;

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        if (buffer) {
            buffer += ' ' + chunk.text;
        } else {
            buffer = chunk.text;
            bufferStartIndex = chunk.index;
        }

        // Merge if next chunk exists and current buffer is small
        const shouldMerge = i < chunks.length - 1 && buffer.length < minLength;

        if (!shouldMerge) {
            merged.push({
                text: buffer,
                index: bufferStartIndex,
                isComplete: chunk.isComplete
            });
            buffer = '';
        }
    }

    return merged;
} 