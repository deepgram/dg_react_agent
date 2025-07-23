'use client';

import React, { useState, useEffect } from 'react';
import { useDeepgramTTS } from '../../hooks/useDeepgramTTS';
import type { DeepgramTTSOptions, TTSError, TTSMetrics } from '../../../../types/tts';

interface UseDeepgramTTSReturn {
  speak: (text: string) => Promise<void>;
  streamText: (text: string) => Promise<void>;
  flushStream: () => Promise<void>;
  stop: () => void;
  clear: () => Promise<void>;
  disconnect: () => void;
  isPlaying: boolean;
  isConnected: boolean;
  isReady: boolean;
  isLoading: boolean;
  error: TTSError | null;
  metrics: TTSMetrics | null;
}

interface NextDeepgramTTSProps extends Omit<DeepgramTTSOptions, 'apiKey'> {
  apiKey?: string;
  fallback?: React.ReactNode;
  children: (tts: UseDeepgramTTSReturn & { isClientReady: boolean }) => React.ReactNode;
}

/**
 * Next.js adapter for Deepgram TTS
 * 
 * Handles SSR/hydration issues and provides a clean interface for Next.js applications.
 * Use this component when you need to ensure proper hydration and avoid SSR mismatches.
 * 
 * @example
 * ```tsx
 * import { NextDeepgramTTS } from 'deepgram-tts-react/next';
 * 
 * export default function MyPage() {
 *   return (
 *     <NextDeepgramTTS
 *       apiKey={process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY}
 *       model="aura-2-thalia-en"
 *       debug="verbose"
 *     >
 *       {({ speak, stop, isLoading, isConnected, error, isClientReady }) => (
 *         <div>
 *           {!isClientReady ? (
 *             <p>Loading TTS...</p>
 *           ) : (
 *             <>
 *               <button 
 *                 onClick={() => speak('Hello from Next.js!')}
 *                 disabled={isLoading || !isConnected}
 *               >
 *                 {isLoading ? 'Speaking...' : 'Speak'}
 *               </button>
 *               <button onClick={stop} disabled={!isLoading}>
 *                 Stop
 *               </button>
 *               {error && <p>Error: {error.message}</p>}
 *               <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
 *             </>
 *           )}
 *         </div>
 *       )}
 *     </NextDeepgramTTS>
 *   );
 * }
 * ```
 */
export function NextDeepgramTTS({
  apiKey,
  fallback = <div>Loading TTS...</div>,
  children,
  ...options
}: NextDeepgramTTSProps) {
  const [isClient, setIsClient] = useState(false);
  const [clientApiKey, setClientApiKey] = useState<string | undefined>(undefined);

  // Handle hydration
  useEffect(() => {
    setIsClient(true);
    
    // Get API key from environment or prop
    const key = apiKey || process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    if (!key) {
      console.error('NextDeepgramTTS: No API key provided. Set NEXT_PUBLIC_DEEPGRAM_API_KEY or pass apiKey prop.');
    }
    setClientApiKey(key);
  }, [apiKey]);

  // Initialize TTS hook only on client side
  const { debug, ...restOptions } = options;
  const tts = useDeepgramTTS(
    clientApiKey || '',
    isClient && clientApiKey 
      ? { ...restOptions, debug: debug === 'off' ? 'hook' : debug } as any
      : { ...restOptions, debug: 'hook' } as any
  );

  // Don't render TTS functionality until we're on the client
  if (!isClient || !clientApiKey) {
    return <>{fallback}</>;
  }

  return <>{children({ ...tts, isClientReady: isClient && !!clientApiKey })}</>;
}

/**
 * Hook version of the Next.js adapter
 * 
 * Use this hook when you want more control over the rendering but still need
 * SSR-safe initialization of the TTS functionality.
 * 
 * @example
 * ```tsx
 * import { useNextDeepgramTTS } from 'deepgram-tts-react/next';
 * 
 * export default function MyComponent() {
 *   const { speak, stop, isLoading, isConnected, error, isClientReady } = useNextDeepgramTTS({
 *     apiKey: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY,
 *     model: 'aura-2-thalia-en'
 *   });
 * 
 *   if (!isClientReady) {
 *     return <div>Loading TTS...</div>;
 *   }
 * 
 *   return (
 *     <button 
 *       onClick={() => speak('Hello!')}
 *       disabled={isLoading || !isConnected}
 *     >
 *       {isLoading ? 'Speaking...' : 'Speak'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useNextDeepgramTTS(
  options: Omit<DeepgramTTSOptions, 'apiKey'> & { apiKey?: string }
): UseDeepgramTTSReturn & { isClientReady: boolean } {
  const [isClient, setIsClient] = useState(false);
  const [clientApiKey, setClientApiKey] = useState<string | undefined>(undefined);

  // Handle hydration
  useEffect(() => {
    setIsClient(true);
    
    // Get API key from environment or prop
    const key = options.apiKey || process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    if (!key) {
      console.error('useNextDeepgramTTS: No API key provided. Set NEXT_PUBLIC_DEEPGRAM_API_KEY or pass apiKey in options.');
    }
    setClientApiKey(key);
  }, [options.apiKey]);

  // Initialize TTS hook only on client side
  const { apiKey: _, debug, ...restOptions } = options;
  const tts = useDeepgramTTS(
    clientApiKey || '',
    isClient && clientApiKey 
      ? { ...restOptions, debug: debug === 'off' ? 'hook' : debug } as any
      : { ...restOptions, debug: 'hook' } as any
  );

  return {
    ...tts,
    isClientReady: isClient && !!clientApiKey
  };
} 