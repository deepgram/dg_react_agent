import React from 'react';
import type { ErrorBoundaryProps, ErrorBoundaryState } from './types';
/**
 * ErrorBoundary component for DeepgramVoiceInteraction
 * Provides graceful error handling and fallback UI
 */
export declare class DeepgramErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState;
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    render(): React.ReactNode;
}
