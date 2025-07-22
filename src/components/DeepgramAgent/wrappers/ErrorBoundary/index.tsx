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

export class DeepgramErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DeepgramAgent error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ 
          padding: '1rem', 
          border: '1px solid #ff6b6b', 
          borderRadius: '4px', 
          backgroundColor: '#ffe0e0' 
        }}>
          <h3>Deepgram Agent Error</h3>
          <p>Something went wrong with the agent component.</p>
          {this.state.error && (
            <details>
              <summary>Error Details</summary>
              <pre>{this.state.error.message}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
