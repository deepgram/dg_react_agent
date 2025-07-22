import { __awaiter, __generator } from "tslib";
import { useCallback, useMemo } from 'react';
import { useAudioManager } from './useAudioManager';
import { AudioOutputManager } from '../../utils/audio/AudioOutputManager';
export function useAudioOutput(options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    // Create audio manager instance
    var manager = useMemo(function () { return new AudioOutputManager({
        debug: options.debug,
        enableVolumeControl: options.enableVolumeControl,
        initialVolume: options.initialVolume
    }, {
        onError: options.onError,
        onAudioStart: options.onAudioStart,
        onAudioEnd: options.onAudioEnd
    }); }, [
        options.debug,
        options.enableVolumeControl,
        options.initialVolume,
        options.onError,
        options.onAudioStart,
        options.onAudioEnd
    ]);
    // Use base audio manager hook
    var _a = useAudioManager(manager, {
        debug: options.debug,
        onError: options.onError
    }), isInitialized = _a.isInitialized, error = _a.error, initialize = _a.initialize;
    // Audio playback methods
    var queueAudio = useCallback(function (data) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!isInitialized) return [3 /*break*/, 2];
                    return [4 /*yield*/, initialize()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [4 /*yield*/, manager.queueAudio(data)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [isInitialized, initialize, manager]);
    var stop = useCallback(function () {
        manager.stop();
    }, [manager]);
    var clearAudioQueue = useCallback(function () {
        manager.clearAudioQueue();
    }, [manager]);
    return {
        queueAudio: queueAudio,
        stop: stop,
        clearAudioQueue: clearAudioQueue,
        isPlaying: manager.getIsPlaying(),
        isInitialized: isInitialized,
        error: error
    };
}
//# sourceMappingURL=useAudioOutput.js.map