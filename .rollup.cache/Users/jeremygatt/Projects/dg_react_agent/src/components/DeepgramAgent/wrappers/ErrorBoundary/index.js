import { __extends } from "tslib";
import React, { Component } from 'react';
var DeepgramErrorBoundary = /** @class */ (function (_super) {
    __extends(DeepgramErrorBoundary, _super);
    function DeepgramErrorBoundary(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { hasError: false };
        return _this;
    }
    DeepgramErrorBoundary.getDerivedStateFromError = function (error) {
        return { hasError: true, error: error };
    };
    DeepgramErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        var _a, _b;
        console.error('DeepgramAgent error:', error, errorInfo);
        (_b = (_a = this.props).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error, errorInfo);
    };
    DeepgramErrorBoundary.prototype.render = function () {
        if (this.state.hasError) {
            return this.props.fallback || (React.createElement("div", { style: {
                    padding: '1rem',
                    border: '1px solid #ff6b6b',
                    borderRadius: '4px',
                    backgroundColor: '#ffe0e0'
                } },
                React.createElement("h3", null, "Deepgram Agent Error"),
                React.createElement("p", null, "Something went wrong with the agent component."),
                this.state.error && (React.createElement("details", null,
                    React.createElement("summary", null, "Error Details"),
                    React.createElement("pre", null, this.state.error.message)))));
        }
        return this.props.children;
    };
    return DeepgramErrorBoundary;
}(Component));
export { DeepgramErrorBoundary };
//# sourceMappingURL=index.js.map