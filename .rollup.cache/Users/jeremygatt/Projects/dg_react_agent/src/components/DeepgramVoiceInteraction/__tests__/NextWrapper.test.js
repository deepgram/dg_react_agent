import { __assign } from "tslib";
import React from 'react';
import { render } from '@testing-library/react';
import { DeepgramWrapper } from '../adapters/next';
describe('DeepgramWrapper', function () {
    it('renders DeepgramVoiceInteraction with props', function () {
        var props = {
            apiKey: 'test-key',
            transcriptionOptions: {},
            agentOptions: {},
            debug: true
        };
        var container = render(React.createElement(DeepgramWrapper, __assign({}, props))).container;
        expect(container).toBeInTheDocument();
    });
});
//# sourceMappingURL=NextWrapper.test.js.map