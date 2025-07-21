import React from 'react';
interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}
interface State {
    hasError: boolean;
    error: Error | null;
}
/**
 * ErrorBoundary component for DeepgramVoiceInteraction
 * Provides graceful error handling and fallback UI
 */
export declare class DeepgramErrorBoundary extends React.Component<Props, State> {
    state: State;
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    render(): React.ReactNode;
}
export {};
