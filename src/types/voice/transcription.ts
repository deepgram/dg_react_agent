/**
 * Types related to Deepgram's transcription API
 */

/**
 * Configuration for the Deepgram transcription API
 * Based on Deepgram /v1/listen query parameters
 */
export interface TranscriptionOptions {
  /**
   * Transcription model to use
   * e.g., "nova-2"
   */
  model?: string;

  /**
   * Language to transcribe
   * e.g., "en-US"
   */
  language?: string;

  /**
   * Enable speaker identification
   */
  diarize?: boolean;

  /**
   * Enable smart formatting of numbers, dates, etc.
   */
  smart_format?: boolean;

  /**
   * Add punctuation to the transcript
   */
  punctuate?: boolean;

  /**
   * Enable automatic endpoint detection
   * Can be boolean or milliseconds of silence
   */
  endpointing?: boolean | number;

  /**
   * Return interim (non-final) results
   */
  interim_results?: boolean;

  /**
   * Enable voice activity detection events
   */
  vad_events?: boolean;

  /**
   * Keywords to detect in the audio.
   * @see https://developers.deepgram.com/docs/keywords
   */
  keywords?: string[];

  /**
   * Keyterms to boost recognition for (Nova-3 English only).
   * Each string in the array will be sent as a separate 'keyterm' parameter.
   * Phrases with spaces are handled correctly.
   * @see https://developers.deepgram.com/docs/keyterm
   */
  keyterm?: string[];

  /**
   * Any other parameters supported by Deepgram API
   */
  [key: string]: any;
}

/**
 * Word object in a transcript
 */
export interface TranscriptWord {
  /**
   * The transcribed word
   */
  word: string;

  /**
   * Start time in seconds
   */
  start: number;

  /**
   * End time in seconds
   */
  end: number;

  /**
   * Confidence score (0-1)
   */
  confidence: number;

  /**
   * Speaker ID (if diarization is enabled)
   */
  speaker?: number;
}

/**
 * Alternative transcript
 */
export interface TranscriptAlternative {
  /**
   * The transcript text
   */
  transcript: string;

  /**
   * Confidence score (0-1)
   */
  confidence: number;

  /**
   * Words with timing information
   */
  words: TranscriptWord[];
}

/**
 * Transcript response from Deepgram
 */
export interface TranscriptResponse {
  /**
   * Indicates this is a transcript message
   */
  type: 'transcript';

  /**
   * Audio channel index
   */
  channel: number;

  /**
   * Whether this is a final result
   */
  is_final: boolean;

  /**
   * Whether speech has ended
   */
  speech_final: boolean;

  /**
   * Channel indexes for multi-channel audio
   */
  channel_index: number[];

  /**
   * Start time of this segment in seconds
   */
  start: number;

  /**
   * Duration of this segment in seconds
   */
  duration: number;

  /**
   * Alternative transcriptions, ordered by confidence
   */
  alternatives: TranscriptAlternative[];

  /**
   * Additional metadata
   */
  metadata?: any;
}

/**
 * Voice activity detection event
 */
export interface VADEvent {
  /**
   * Indicates this is a VAD event
   */
  type: 'vad';

  /**
   * Start time in seconds
   */
  start: number;

  /**
   * End time in seconds
   */
  end: number;

  /**
   * Whether speech is present
   */
  speech_detected: boolean;
}

/**
 * Union type for all transcription messages
 */
export type TranscriptionMessage = TranscriptResponse | VADEvent;
