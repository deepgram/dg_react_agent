import { __assign, __awaiter, __generator } from "tslib";
import { useCallback } from 'react';
import { AUDIO_CONFIG, MODEL_CONFIG } from '../../../../utils/shared/config';
export function useConnectionManager(config, managers) {
    var _this = this;
    var agentOptions = config.agentOptions, log = config.log;
    // Send agent settings
    var sendAgentSettings = useCallback(function () {
        if (!managers.agent.current || !agentOptions)
            return;
        var settings = {
            type: 'Settings',
            audio: {
                input: {
                    encoding: AUDIO_CONFIG.encoding,
                    sample_rate: AUDIO_CONFIG.sampleRate,
                },
                output: {
                    encoding: AUDIO_CONFIG.encoding,
                    sample_rate: AUDIO_CONFIG.sampleRate,
                },
            },
            agent: {
                language: agentOptions.language || 'en',
                listen: {
                    provider: {
                        type: 'deepgram',
                        model: agentOptions.listenModel || MODEL_CONFIG.agent.listen,
                    },
                },
                think: __assign({ provider: {
                        type: agentOptions.thinkProviderType || 'open_ai',
                        model: agentOptions.thinkModel || MODEL_CONFIG.agent.think,
                    }, prompt: agentOptions.instructions || 'You are a helpful voice assistant.' }, (agentOptions.thinkEndpointUrl && agentOptions.thinkApiKey
                    ? {
                        endpoint: {
                            url: agentOptions.thinkEndpointUrl,
                            headers: {
                                authorization: "bearer ".concat(agentOptions.thinkApiKey),
                            },
                        },
                    }
                    : {})),
                speak: {
                    provider: {
                        type: 'deepgram',
                        model: agentOptions.voice || MODEL_CONFIG.agent.speak,
                    },
                },
                greeting: agentOptions.greeting,
            },
        };
        managers.agent.current.sendJSON(settings);
    }, [agentOptions]);
    // Start the connection
    var start = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    log('▶️ Starting voice interaction...');
                    if (!managers.transcription.current) return [3 /*break*/, 2];
                    log('Connecting transcription WebSocket...');
                    return [4 /*yield*/, managers.transcription.current.connect()];
                case 1:
                    _a.sent();
                    log('Transcription WebSocket connected');
                    _a.label = 2;
                case 2:
                    if (!managers.agent.current) return [3 /*break*/, 4];
                    log('Connecting agent WebSocket...');
                    return [4 /*yield*/, managers.agent.current.connect()];
                case 3:
                    _a.sent();
                    log('Agent WebSocket connected');
                    _a.label = 4;
                case 4:
                    if (!managers.audio.current) return [3 /*break*/, 6];
                    log('Starting recording...');
                    return [4 /*yield*/, managers.audio.current.startRecording()];
                case 5:
                    _a.sent();
                    log('Recording started');
                    return [3 /*break*/, 7];
                case 6: throw new Error('Audio manager not available');
                case 7:
                    log('✅ Voice interaction started successfully');
                    return [3 /*break*/, 9];
                case 8:
                    error_1 = _a.sent();
                    log("\u274C Error starting voice interaction: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    throw error_1;
                case 9: return [2 /*return*/];
            }
        });
    }); }, [log]);
    // Stop the connection
    var stop = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    log('⏹️ Stopping voice interaction...');
                    // Send CloseStream message to finalize any pending transcriptions
                    if (managers.transcription.current) {
                        log('Sending CloseStream message to finalize transcription');
                        managers.transcription.current.sendCloseStream();
                    }
                    // Stop recording
                    if (managers.audio.current) {
                        managers.audio.current.stopRecording();
                    }
                    // Add a small delay to allow final transcripts to be processed
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 1:
                    // Add a small delay to allow final transcripts to be processed
                    _a.sent();
                    // Close WebSocket connections
                    if (managers.transcription.current) {
                        managers.transcription.current.disconnect();
                    }
                    if (managers.agent.current) {
                        managers.agent.current.disconnect();
                    }
                    log('✅ Voice interaction stopped');
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    log("\u274C Error stopping voice interaction: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error'));
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    }); }, [log]);
    return {
        sendAgentSettings: sendAgentSettings,
        start: start,
        stop: stop
    };
}
//# sourceMappingURL=useConnectionManager.js.map