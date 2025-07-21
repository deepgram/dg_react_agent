import React from 'react';
import { render } from '@testing-library/react';
import { DeepgramWrapper } from '../adapters/next';

describe('DeepgramWrapper', () => {
  it('renders DeepgramVoiceInteraction with props', () => {
    const props = {
      apiKey: 'test-key',
      transcriptionOptions: {},
      agentOptions: {},
      debug: true
    };

    const { container } = render(<DeepgramWrapper {...props} />);
    expect(container).toBeInTheDocument();
  });
});
