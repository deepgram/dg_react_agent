import React from 'react';
import { render } from '@testing-library/react';
import { DeepgramErrorBoundary } from '../wrappers/ErrorBoundary';

describe('DeepgramErrorBoundary', () => {
  it('renders children when no error', () => {
    const { getByText } = render(
      <DeepgramErrorBoundary>
        <div>Test Content</div>
      </DeepgramErrorBoundary>
    );
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('renders error message when error occurs', () => {
    const ThrowError = () => {
      throw new Error('Test Error');
    };

    const { getByText } = render(
      <DeepgramErrorBoundary>
        <ThrowError />
      </DeepgramErrorBoundary>
    );
    expect(getByText('Something went wrong')).toBeInTheDocument();
  });
});
