'use client';

import React from 'react';
import type { DeepgramVoiceInteractionProps } from './types';
import DeepgramVoiceInteraction from '../../core';

/**
 * Next.js wrapper for DeepgramVoiceInteraction
 * This component handles SSR compatibility and provides a safe loading state
 */
export const DeepgramWrapper: React.FC<DeepgramVoiceInteractionProps> = (props: DeepgramVoiceInteractionProps) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle SSR
  if (!isMounted) {
    return null; // Or return a loading placeholder
  }

  return <DeepgramVoiceInteraction {...props} />;
};
