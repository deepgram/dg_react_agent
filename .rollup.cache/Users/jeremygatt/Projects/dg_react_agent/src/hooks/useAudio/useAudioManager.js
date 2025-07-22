import { __awaiter, __generator } from "tslib";
import { useCallback, useEffect, useRef, useState } from 'react';
export function useAudioManager(manager, options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    // State
    var _a = useState(false), isInitialized = _a[0], setIsInitialized = _a[1];
    var _b = useState(null), error = _b[0], setError = _b[1];
    // Cleanup tracking
    var isCleaningUpRef = useRef(false);
    // Error handler
    var handleError = useCallback(function (error) {
        var _a;
        setError(error);
        (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, error);
    }, [options.onError]);
    // Initialize method
    var initialize = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!manager) {
                        handleError({
                            name: 'AudioError',
                            message: 'Audio manager not provided',
                            type: 'audio',
                            code: 'MANAGER_NOT_INITIALIZED'
                        });
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, manager.initialize()];
                case 2:
                    _a.sent();
                    setIsInitialized(true);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    handleError(error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [manager, handleError]);
    // Cleanup method
    var cleanup = useCallback(function () {
        if (!manager)
            return;
        try {
            manager.cleanup();
            setIsInitialized(false);
        }
        catch (error) {
            handleError(error);
        }
    }, [manager, handleError]);
    // Cleanup on unmount
    useEffect(function () {
        return function () {
            if (!isCleaningUpRef.current && manager) {
                isCleaningUpRef.current = true;
                cleanup();
            }
        };
    }, [manager, cleanup]);
    return {
        initialize: initialize,
        cleanup: cleanup,
        isInitialized: isInitialized,
        error: error
    };
}
//# sourceMappingURL=useAudioManager.js.map