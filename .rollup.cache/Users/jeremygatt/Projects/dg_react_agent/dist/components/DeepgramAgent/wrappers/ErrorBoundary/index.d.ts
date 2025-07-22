import React, { Component, ErrorInfo, ReactNode } from 'react';
/**
 * ErrorBoundary component for DeepgramAgent
 * Catches and handles errors that occur within the agent component tree
 */
interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
interface State {
    hasError: boolean;
    error?: Error;
}
export declare class DeepgramErrorBoundary extends Component<Props, State> {
    constructor(props: Props);
    static getDerivedStateFromError(error: Error): State;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    render(): string | number | boolean | Iterable<React.ReactNode> | React.JSX.Element | null | undefined;
}
export {};
