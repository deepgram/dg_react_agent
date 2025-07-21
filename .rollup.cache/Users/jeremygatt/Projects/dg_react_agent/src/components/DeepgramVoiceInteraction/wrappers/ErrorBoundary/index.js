import { __extends } from "tslib";
import React from 'react';
/**
 * ErrorBoundary component for DeepgramVoiceInteraction
 * Provides graceful error handling and fallback UI
 */
var DeepgramErrorBoundary = /** @class */ (function (_super) {
    __extends(DeepgramErrorBoundary, _super);
    function DeepgramErrorBoundary() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            hasError: false,
            error: null,
        };
        return _this;
    }
    DeepgramErrorBoundary.getDerivedStateFromError = function (error) {
        return {
            hasError: true,
            error: error,
        };
    };
    DeepgramErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        console.error('DeepgramVoiceInteraction error:', error, errorInfo);
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    };
    DeepgramErrorBoundary.prototype.render = function () {
        var _a;
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (React.createElement("div", { style: {
                    padding: '20px',
                    border: '1px solid #ff0000',
                    borderRadius: '4px',
                    backgroundColor: '#fff5f5'
                } },
                React.createElement("h3", { style: { color: '#cc0000', margin: '0 0 10px 0' } }, "Voice Interaction Error"),
                React.createElement("p", { style: { margin: '0', color: '#666' } }, ((_a = this.state.error) === null || _a === void 0 ? void 0 : _a.message) || 'An error occurred in the voice interaction component.')));
        }
        return this.props.children;
    };
    return DeepgramErrorBoundary;
}(React.Component));
export { DeepgramErrorBoundary };
//# sourceMappingURL=index.js.map