import React from 'react';
import { render } from '@testing-library/react';
import { DeepgramErrorBoundary } from '../wrappers/ErrorBoundary';
describe('DeepgramErrorBoundary', function () {
    it('renders children when no error', function () {
        var getByText = render(React.createElement(DeepgramErrorBoundary, null,
            React.createElement("div", null, "Test Content"))).getByText;
        expect(getByText('Test Content')).toBeInTheDocument();
    });
    it('renders error message when error occurs', function () {
        var ThrowError = function () {
            throw new Error('Test Error');
        };
        var getByText = render(React.createElement(DeepgramErrorBoundary, null,
            React.createElement(ThrowError, null))).getByText;
        expect(getByText('Something went wrong')).toBeInTheDocument();
    });
});
//# sourceMappingURL=ErrorBoundary.test.js.map