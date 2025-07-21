'use client';
import { __assign } from "tslib";
import React from 'react';
import DeepgramVoiceInteraction from './index';
/**
 * Next.js wrapper for DeepgramVoiceInteraction
 * This component handles SSR compatibility and provides a safe loading state
 */
export var DeepgramWrapper = function (props) {
    var _a = React.useState(false), isMounted = _a[0], setIsMounted = _a[1];
    React.useEffect(function () {
        setIsMounted(true);
    }, []);
    // Handle SSR
    if (!isMounted) {
        return null; // Or return a loading placeholder
    }
    return React.createElement(DeepgramVoiceInteraction, __assign({}, props));
};
//# sourceMappingURL=NextWrapper.js.map