import React from 'react';
import type { ErrorBoundaryProps, ErrorBoundaryState } from './types';

/**
 * ErrorBoundary component for DeepgramVoiceInteraction
 * Provides graceful error handling and fallback UI
 */
export class DeepgramErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('DeepgramVoiceInteraction error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ 
          padding: '20px', 
          border: '1px solid #ff0000',
          borderRadius: '4px',
          backgroundColor: '#fff5f5'
        }}>
          <h3 style={{ color: '#cc0000', margin: '0 0 10px 0' }}>
            Voice Interaction Error
          </h3>
          <p style={{ margin: '0', color: '#666' }}>
            {this.state.error?.message || 'An error occurred in the voice interaction component.'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
