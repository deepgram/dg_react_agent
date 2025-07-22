/**
 * Utility to split text into chunks that Deepgram can handle
 * - Preserves sentence boundaries
 * - Handles common abbreviations
 * - Respects punctuation
 * - Enforces max chunk size
 */

const MAX_CHUNK_SIZE = 1000;

// Common abbreviations that shouldn't be treated as sentence endings
const ABBREVIATIONS = [
  'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr', 'etc', 'vs',
  'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Sept', 'Oct', 'Nov', 'Dec',
  'Inc', 'Ltd', 'Corp', 'Co', 'St', 'Ave', 'Rd', 'Blvd',
  'a.m', 'p.m', 'i.e', 'e.g'
];

// Build a regex that matches sentence endings but ignores abbreviations
const abbreviationPattern = ABBREVIATIONS.join('|').replace('.', '\\.');
const sentenceEndPattern = new RegExp(
  `(?<!${abbreviationPattern}|[A-Z])([.!?]+\\s+)`,
  'g'
);

export function splitIntoChunks(text: string): string[] {
  // Clean up the text first
  text = text.trim().replace(/\s+/g, ' ');

  if (text.length <= MAX_CHUNK_SIZE) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';

  // Split into sentences, preserving the separators
  const sentences = text.split(sentenceEndPattern).filter(Boolean);

  for (let sentence of sentences) {
    sentence = sentence.trim();
    if (!sentence) continue;

    // If this sentence alone is longer than max size, split on commas
    if (sentence.length > MAX_CHUNK_SIZE) {
      const subParts = sentence.split(/,\s+/);
      for (const part of subParts) {
        if (part.length > MAX_CHUNK_SIZE) {
          // If still too long, split on spaces
          const words = part.split(/\s+/);
          let subChunk = '';
          for (const word of words) {
            if ((subChunk + ' ' + word).length > MAX_CHUNK_SIZE) {
              if (subChunk) chunks.push(subChunk.trim());
              subChunk = word;
            } else {
              subChunk += (subChunk ? ' ' : '') + word;
            }
          }
          if (subChunk) chunks.push(subChunk.trim());
        } else {
          // Add comma-separated part if it fits
          if (currentChunk.length + part.length > MAX_CHUNK_SIZE) {
            chunks.push(currentChunk.trim());
            currentChunk = part;
          } else {
            currentChunk += (currentChunk ? ', ' : '') + part;
          }
        }
      }
    } else {
      // Normal sentence handling
      if (currentChunk.length + sentence.length > MAX_CHUNK_SIZE) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
  }

  // Add the last chunk if there is one
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.map(chunk => chunk.trim()).filter(Boolean);
} 