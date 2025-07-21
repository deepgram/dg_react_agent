import { __assign, __awaiter, __generator, __rest, __spreadArray } from "tslib";
import { forwardRef, useEffect, useImperativeHandle, useReducer, useRef } from 'react';
import { VoiceWebSocketManager } from '../../../utils/websocket/VoiceWebSocketManager';
import { AudioManager } from '../../../utils/audio/AudioManager';
import { initialState, stateReducer, } from '../../../utils/state/VoiceInteractionState';
import { DEFAULT_MICROPHONE_OPTIONS } from '../utils/constants';
// Environment check
var isBrowser = typeof window !== 'undefined';
// Default endpoints
var DEFAULT_ENDPOINTS = {
    transcriptionUrl: 'wss://api.deepgram.com/v1/listen',
    agentUrl: 'wss://agent.deepgram.com/v1/agent/converse',
};
/**
 * DeepgramVoiceInteraction component
 *
 * A headless React component for real-time transcription and/or agent interaction using Deepgram's WebSocket APIs.
 *
 * @component
 *
 * Framework Integration Notes:
 *
 * Next.js:
 * - Import and use the DeepgramWrapper component instead
 * - Add 'use client' directive in your component
 * - Handle environment variables with Next.js config
 * Example:
 * ```tsx
 * 'use client';
 * import { DeepgramWrapper } from 'deepgram-voice-interaction-react';
 *
 * export default function MyComponent() {
 *   return <DeepgramWrapper apiKey={process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY} />;
 * }
 * ```
 *
 * React:
 * - Standard import works out of the box
 * - No special configuration needed
 * Example:
 * ```tsx
 * import { DeepgramVoiceInteraction } from 'deepgram-voice-interaction-react';
 *
 * export default function MyComponent() {
 *   return <DeepgramVoiceInteraction apiKey={process.env.REACT_APP_DEEPGRAM_API_KEY} />;
 * }
 * ```
 *
 * Other Frameworks:
 * - Ensure browser environment is available
 * - Check WebSocket/AudioContext support
 * - Use appropriate environment variable handling
 *
 * IMPORTANT: The component can operate in three distinct modes depending on the options provided:
 *
 * 1. Dual Mode (Transcription + Agent):
 *    - Provide both `transcriptionOptions` and `agentOptions` props
 *    - Uses separate WebSocket connections for transcription and agent
 *    - Enables independent transcription with full customization options
 *    - Can display live transcripts while also having agent conversations
 *
 * 2. Transcription-Only Mode:
 *    - Provide `transcriptionOptions` prop, completely OMIT `agentOptions` prop
 *    - Only connects to transcription service
 *    - Ideal for applications that only need speech-to-text capabilities
 *    - Lighter weight without agent or audio playback functionality
 *
 * 3. Agent-Only Mode:
 *    - Provide `agentOptions` prop, completely OMIT `transcriptionOptions` prop
 *    - Only connects to agent service (agent handles its own transcription internally)
 *    - Ideal for voice assistant applications that don't need separate transcription results
 *    - Agent uses its own internal transcription via the `listenModel` option
 *
 * Error Handling:
 * - Wrap in ErrorBoundary for graceful fallbacks
 * - Check isReady state before operations
 * - Monitor onError callbacks
 *
 * Loading States:
 * - Use onReady callback to handle initialization
 * - Monitor connection states for each service
 * - Provide appropriate UI feedback
 */
function DeepgramVoiceInteraction(props, ref) {
    var _this = this;
    // Internal state
    var _a = useReducer(stateReducer, initialState), state = _a[0], dispatch = _a[1];
    // Ref to hold the latest state value, avoiding stale closures in callbacks
    var stateRef = useRef(state);
    // Managers - these may be null if the service is not required
    var transcriptionManagerRef = useRef(null);
    var agentManagerRef = useRef(null);
    var audioManagerRef = useRef(null);
    // Tracking user speaking state
    var userSpeakingRef = useRef(false);
    // Track if we're waiting for user voice after waking from sleep
    var isWaitingForUserVoiceAfterSleep = useRef(false);
    // Refs to track previous state values to prevent redundant callback calls
    var prevIsReadyRef = useRef(undefined);
    var prevAgentStateRef = useRef(undefined);
    var prevIsPlayingRef = useRef(undefined);
    // Early return for non-browser environments
    if (!isBrowser) {
        console.warn('DeepgramVoiceInteraction requires a browser environment');
        return null;
    }
    var apiKey = props.apiKey, transcriptionOptions = props.transcriptionOptions, agentOptions = props.agentOptions, endpointConfig = props.endpointConfig, microphoneConfig = props.microphoneConfig, onReady = props.onReady, onConnectionStateChange = props.onConnectionStateChange, onTranscriptUpdate = props.onTranscriptUpdate, onAgentStateChange = props.onAgentStateChange, onAgentUtterance = props.onAgentUtterance, onUserMessage = props.onUserMessage, onUserStartedSpeaking = props.onUserStartedSpeaking, onUserStoppedSpeaking = props.onUserStoppedSpeaking, onPlaybackStateChange = props.onPlaybackStateChange, onMicrophoneData = props.onMicrophoneData, onError = props.onError, _b = props.debug, debug = _b === void 0 ? false : _b;
    // Debug logging
    var log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (debug) {
            console.log.apply(console, __spreadArray(['[DeepgramVoiceInteraction]'], args, false));
        }
    };
    // Targeted sleep/wake logging
    var sleepLog = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (debug) {
            console.log.apply(console, __spreadArray(['[SLEEP_CYCLE][CORE]'], args, false));
        }
    };
    // Update stateRef whenever state changes
    useEffect(function () {
        stateRef.current = state;
        // If we just entered the 'entering_sleep' state, schedule the final transition
        if (state.agentState === 'entering_sleep') {
            var timerId_1 = setTimeout(function () {
                sleepLog('Transitioning from entering_sleep to sleeping after timeout');
                // Ensure we are still in entering_sleep before finalizing
                // (Could have been woken up or stopped during the timeout)
                if (stateRef.current.agentState === 'entering_sleep') {
                    dispatch({ type: 'AGENT_STATE_CHANGE', state: 'sleeping' });
                }
            }, 50); // 50ms delay - adjust if needed
            // Cleanup timeout if component unmounts or state changes away from entering_sleep
            return function () { return clearTimeout(timerId_1); };
        }
    }, [state]);
    // Handle errors
    var handleError = function (error) {
        log('Error:', error);
        dispatch({ type: 'ERROR', message: error.message });
        onError === null || onError === void 0 ? void 0 : onError(error);
    };
    // Initialize the component based on provided options
    useEffect(function () {
        var _a;
        // Validate API key
        if (!apiKey) {
            handleError({
                service: 'transcription',
                code: 'invalid_api_key',
                message: 'API key is required',
            });
            return;
        }
        // Determine which services are being configured
        var isTranscriptionConfigured = !!transcriptionOptions;
        var isAgentConfigured = !!agentOptions;
        if (!isTranscriptionConfigured && !isAgentConfigured) {
            log('No services configured! Either transcriptionOptions or agentOptions must be provided.');
            handleError({
                service: 'transcription',
                code: 'invalid_configuration',
                message: 'Either transcriptionOptions or agentOptions must be provided',
            });
            return;
        }
        // Log which services are being configured
        log("Initializing in ".concat(isTranscriptionConfigured && isAgentConfigured
            ? 'DUAL MODE'
            : isTranscriptionConfigured
                ? 'TRANSCRIPTION-ONLY MODE'
                : 'AGENT-ONLY MODE'));
        // Prepare endpoints, using defaults ONLY if endpointConfig prop is not provided
        var currentEndpointConfig = endpointConfig || {};
        var endpoints = {
            transcriptionUrl: currentEndpointConfig.transcriptionUrl || DEFAULT_ENDPOINTS.transcriptionUrl,
            agentUrl: currentEndpointConfig.agentUrl || DEFAULT_ENDPOINTS.agentUrl,
        };
        // --- Event listener cleanup functions ---
        var transcriptionUnsubscribe = function () { };
        var agentUnsubscribe = function () { };
        var audioUnsubscribe = function () { };
        // --- TRANSCRIPTION SETUP (CONDITIONAL) ---
        if (isTranscriptionConfigured) {
            var transcriptionUrl = endpoints.transcriptionUrl;
            var transcriptionQueryParams = {};
            // Base transcription parameters
            var baseTranscriptionParams = __assign(__assign({}, transcriptionOptions), { sample_rate: transcriptionOptions.sample_rate || 48000, encoding: transcriptionOptions.encoding || 'linear16', channels: transcriptionOptions.channels || 1, model: transcriptionOptions.model, keyterm: transcriptionOptions.keyterm, keywords: transcriptionOptions.keywords });
            // Check for Nova-3 Keyterm Prompting conditions
            var useKeytermPrompting = baseTranscriptionParams.model === 'nova-3' &&
                Array.isArray(baseTranscriptionParams.keyterm) &&
                baseTranscriptionParams.keyterm.length > 0;
            if (useKeytermPrompting) {
                log('Nova-3 and keyterms detected. Building transcription URL with keyterm parameters.');
                // Build URL manually, appending keyterms
                var url = new URL(transcriptionUrl);
                var params_1 = new URLSearchParams();
                // Append all other options EXCEPT keyterm array itself
                for (var _i = 0, _b = Object.entries(baseTranscriptionParams); _i < _b.length; _i++) {
                    var _c = _b[_i], key = _c[0], value = _c[1];
                    if (key !== 'keyterm' && value !== undefined) {
                        params_1.append(key, String(value));
                    }
                }
                // Append each keyterm as a separate parameter
                (_a = baseTranscriptionParams.keyterm) === null || _a === void 0 ? void 0 : _a.forEach(function (term) {
                    if (term) {
                        // Ensure term is not empty
                        params_1.append('keyterm', term);
                    }
                });
                url.search = params_1.toString();
                transcriptionUrl = url.toString();
                log('Constructed transcription URL with keyterms:', transcriptionUrl);
                // queryParams remain empty as they are in the URL now
            }
            else {
                // Standard setup: Build queryParams object, excluding array types like keyterm and keywords
                log('Not using keyterm prompting. Building queryParams object excluding array types.');
                var keyterm = baseTranscriptionParams.keyterm, keywords = baseTranscriptionParams.keywords, otherParams = __rest(baseTranscriptionParams, ["keyterm", "keywords"]);
                // Ensure only primitive types are included in queryParams
                var filteredParams = {};
                for (var _d = 0, _e = Object.entries(otherParams); _d < _e.length; _d++) {
                    var _f = _e[_d], key = _f[0], value = _f[1];
                    if (typeof value === 'string' ||
                        typeof value === 'number' ||
                        typeof value === 'boolean') {
                        filteredParams[key] = value;
                    }
                    else {
                        log("Skipping non-primitive param ".concat(key, " for queryParams object."));
                    }
                }
                transcriptionQueryParams = filteredParams;
            }
            // Create Transcription WebSocket manager
            transcriptionManagerRef.current = new VoiceWebSocketManager({
                url: transcriptionUrl,
                apiKey: apiKey,
                service: 'transcription',
                queryParams: useKeytermPrompting ? undefined : transcriptionQueryParams,
                debug: debug,
            });
            // Set up event listeners for transcription WebSocket
            transcriptionUnsubscribe = transcriptionManagerRef.current.addEventListener(function (event) {
                if (event.type === 'state' && event.state) {
                    log('Transcription state:', event.state);
                    dispatch({
                        type: 'CONNECTION_STATE_CHANGE',
                        service: 'transcription',
                        state: event.state,
                    });
                    onConnectionStateChange === null || onConnectionStateChange === void 0 ? void 0 : onConnectionStateChange('transcription', event.state);
                }
                else if (event.type === 'message') {
                    handleTranscriptionMessage(event.data);
                }
                else if (event.type === 'error' && event.error) {
                    handleError(event.error);
                }
            });
        }
        else {
            log('Transcription service not configured, skipping setup');
        }
        // --- AGENT SETUP (CONDITIONAL) ---
        if (isAgentConfigured) {
            // Create Agent WebSocket manager
            agentManagerRef.current = new VoiceWebSocketManager({
                url: endpoints.agentUrl,
                apiKey: apiKey,
                service: 'agent',
                debug: debug,
            });
            // Set up event listeners for agent WebSocket
            agentUnsubscribe = agentManagerRef.current.addEventListener(function (event) {
                if (event.type === 'state' && event.state) {
                    log('Agent state:', event.state);
                    dispatch({ type: 'CONNECTION_STATE_CHANGE', service: 'agent', state: event.state });
                    onConnectionStateChange === null || onConnectionStateChange === void 0 ? void 0 : onConnectionStateChange('agent', event.state);
                    // Send settings message when connection is established
                    if (event.state === 'connected') {
                        sendAgentSettings();
                    }
                }
                else if (event.type === 'message') {
                    handleAgentMessage(event.data);
                }
                else if (event.type === 'binary') {
                    handleAgentAudio(event.data);
                }
                else if (event.type === 'error' && event.error) {
                    handleError(event.error);
                }
            });
        }
        else {
            log('Agent service not configured, skipping setup');
        }
        // --- AUDIO SETUP (NEEDED FOR EITHER SERVICE) ---
        // We need audio for recording (transcription) or playback (agent)
        if (isTranscriptionConfigured || isAgentConfigured) {
            // Create audio manager with microphone configuration
            var finalMicrophoneConfig = microphoneConfig ? __assign(__assign({}, DEFAULT_MICROPHONE_OPTIONS), microphoneConfig) : undefined;
            audioManagerRef.current = new AudioManager({
                debug: debug,
                microphoneConfig: finalMicrophoneConfig,
            }, {
                onMicrophoneData: onMicrophoneData,
                onMicrophoneStart: function () {
                    log('Microphone recording started');
                    dispatch({ type: 'RECORDING_STATE_CHANGE', isRecording: true });
                },
                onMicrophoneStop: function () {
                    log('Microphone recording stopped');
                    dispatch({ type: 'RECORDING_STATE_CHANGE', isRecording: false });
                },
                onError: handleError,
            });
            // Set up event listeners for audio manager
            audioUnsubscribe = audioManagerRef.current.addEventListener(function (event) {
                if (event.type === 'ready') {
                    log('Audio manager ready');
                }
                else if (event.type === 'recording') {
                    log('Recording state:', event.isRecording);
                    dispatch({ type: 'RECORDING_STATE_CHANGE', isRecording: event.isRecording });
                }
                else if (event.type === 'playing') {
                    log('Playing state:', event.isPlaying);
                    dispatch({ type: 'PLAYBACK_STATE_CHANGE', isPlaying: event.isPlaying });
                }
                else if (event.type === 'error' && event.error) {
                    handleError(event.error);
                }
                else if (event.type === 'data') {
                    sendAudioData(event.data);
                }
            });
            // Initialize audio manager
            audioManagerRef.current
                .initialize()
                .then(function () {
                log('AudioManager initialized successfully in useEffect');
                // Determine if the component is ready based on configured services
                // For now, we consider it ready as soon as the audio manager is ready
                // The actual WebSocket connections will be made in the start() method
                dispatch({ type: 'READY_STATE_CHANGE', isReady: true });
            })
                .catch(function (error) {
                handleError({
                    service: 'transcription',
                    code: 'audio_init_error',
                    message: 'Failed to initialize audio',
                    details: error,
                });
                dispatch({ type: 'READY_STATE_CHANGE', isReady: false });
            });
        }
        else {
            log('Neither transcription nor agent configured, skipping audio setup');
            // This should never happen due to the check at the beginning of the effect
        }
        // Clean up
        return function () {
            transcriptionUnsubscribe();
            agentUnsubscribe();
            audioUnsubscribe();
            if (transcriptionManagerRef.current) {
                transcriptionManagerRef.current.close();
                transcriptionManagerRef.current = null;
            }
            if (agentManagerRef.current) {
                agentManagerRef.current.close();
                agentManagerRef.current = null;
            }
            if (audioManagerRef.current) {
                audioManagerRef.current.dispose();
                audioManagerRef.current = null;
            }
            // Ensure state is reset on unmount
            dispatch({ type: 'READY_STATE_CHANGE', isReady: false });
            dispatch({ type: 'CONNECTION_STATE_CHANGE', service: 'transcription', state: 'disconnected' });
            dispatch({ type: 'CONNECTION_STATE_CHANGE', service: 'agent', state: 'disconnected' });
            dispatch({ type: 'AGENT_STATE_CHANGE', state: 'idle' });
            dispatch({ type: 'RECORDING_STATE_CHANGE', isRecording: false });
            dispatch({ type: 'PLAYBACK_STATE_CHANGE', isPlaying: false });
        };
    }, [apiKey, transcriptionOptions, agentOptions, endpointConfig, microphoneConfig, debug]);
    // Notify ready state changes ONLY when the value actually changes
    useEffect(function () {
        if (onReady && state.isReady !== prevIsReadyRef.current) {
            log('Notifying parent: isReady changed to', state.isReady);
            onReady(state.isReady);
            prevIsReadyRef.current = state.isReady;
        }
    }, [state.isReady, onReady]);
    // Notify agent state changes ONLY when the value actually changes
    useEffect(function () {
        if (onAgentStateChange && state.agentState !== prevAgentStateRef.current) {
            log('Notifying parent: agentState changed to', state.agentState);
            onAgentStateChange(state.agentState);
            prevAgentStateRef.current = state.agentState;
        }
    }, [state.agentState, onAgentStateChange]);
    // Notify playback state changes ONLY when the value actually changes
    useEffect(function () {
        if (onPlaybackStateChange && state.isPlaying !== prevIsPlayingRef.current) {
            log('Notifying parent: isPlaying changed to', state.isPlaying);
            onPlaybackStateChange(state.isPlaying);
            prevIsPlayingRef.current = state.isPlaying;
        }
    }, [state.isPlaying, onPlaybackStateChange]);
    // Handle transcription messages - only relevant if transcription is configured
    var handleTranscriptionMessage = function (data) {
        // Skip processing if transcription service isn't configured
        if (!transcriptionManagerRef.current) {
            log('Received unexpected transcription message but service is not configured:', data);
            return;
        }
        // Check if agent is in sleep mode
        var isSleepingOrEntering = agentManagerRef.current &&
            (stateRef.current.agentState === 'sleeping' ||
                stateRef.current.agentState === 'entering_sleep');
        if (data.type === 'VADEvent') {
            var isSpeaking = data.is_speech;
            if (isSleepingOrEntering) {
                sleepLog('Ignoring VAD event (state:', stateRef.current.agentState, ')');
                return;
            }
            if (isSpeaking && !userSpeakingRef.current) {
                userSpeakingRef.current = true;
                onUserStartedSpeaking === null || onUserStartedSpeaking === void 0 ? void 0 : onUserStartedSpeaking();
            }
            else if (!isSpeaking && userSpeakingRef.current) {
                userSpeakingRef.current = false;
                onUserStoppedSpeaking === null || onUserStoppedSpeaking === void 0 ? void 0 : onUserStoppedSpeaking();
            }
            return;
        }
        if (data.type === 'Results' || data.type === 'Transcript') {
            if (isSleepingOrEntering) {
                sleepLog('Ignoring transcript (state:', stateRef.current.agentState, ')');
                return;
            }
            var transcript = data;
            onTranscriptUpdate === null || onTranscriptUpdate === void 0 ? void 0 : onTranscriptUpdate(transcript);
            return;
        }
    };
    // Send agent settings after connection is established - only if agent is configured
    var sendAgentSettings = function () {
        if (!agentManagerRef.current || !agentOptions) {
            log('Cannot send agent settings: agent manager not initialized or agentOptions not provided');
            return;
        }
        // Build the Settings message based on agentOptions
        var settingsMessage = {
            type: 'Settings',
            audio: {
                input: {
                    encoding: 'linear16',
                    sample_rate: 48000,
                },
                output: {
                    encoding: 'linear16',
                    sample_rate: 48000,
                },
            },
            agent: {
                language: agentOptions.language || 'en',
                listen: {
                    provider: {
                        type: 'deepgram',
                        model: agentOptions.listenModel || 'nova-2',
                    },
                },
                think: __assign({ provider: {
                        type: agentOptions.thinkProviderType || 'open_ai',
                        model: agentOptions.thinkModel || 'gpt-4o-mini',
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
                        model: agentOptions.voice || 'aura-asteria-en',
                    },
                },
                greeting: agentOptions.greeting,
            },
        };
        log('Sending agent settings:', settingsMessage);
        agentManagerRef.current.sendJSON(settingsMessage);
    };
    // Handle agent messages - only relevant if agent is configured
    var handleAgentMessage = function (data) {
        // Skip processing if agent service isn't configured
        if (!agentManagerRef.current) {
            log('Received unexpected agent message but service is not configured:', data);
            return;
        }
        var isSleepingOrEntering = stateRef.current.agentState === 'sleeping' ||
            stateRef.current.agentState === 'entering_sleep';
        if (data.type === 'UserStartedSpeaking') {
            sleepLog('UserStartedSpeaking message received');
            if (isSleepingOrEntering) {
                sleepLog('Ignoring UserStartedSpeaking event (state:', stateRef.current.agentState, ')');
                return;
            }
            // Normal speech handling when not sleeping
            log('Clearing audio queue (barge-in)');
            clearAudio();
            onUserStartedSpeaking === null || onUserStartedSpeaking === void 0 ? void 0 : onUserStartedSpeaking();
            if (isWaitingForUserVoiceAfterSleep.current) {
                log('User started speaking after wake - resetting waiting flag');
                isWaitingForUserVoiceAfterSleep.current = false;
            }
            sleepLog('Dispatching AGENT_STATE_CHANGE to listening (from UserStartedSpeaking)');
            dispatch({ type: 'AGENT_STATE_CHANGE', state: 'listening' });
            return;
        }
        if (data.type === 'AgentThinking') {
            sleepLog('Dispatching AGENT_STATE_CHANGE to thinking');
            dispatch({ type: 'AGENT_STATE_CHANGE', state: 'thinking' });
            return;
        }
        if (data.type === 'AgentStartedSpeaking') {
            sleepLog('Dispatching AGENT_STATE_CHANGE to speaking');
            dispatch({ type: 'AGENT_STATE_CHANGE', state: 'speaking' });
            return;
        }
        if (data.type === 'AgentAudioDone') {
            sleepLog('Dispatching AGENT_STATE_CHANGE to idle (from AgentAudioDone)');
            dispatch({ type: 'AGENT_STATE_CHANGE', state: 'idle' });
            return;
        }
        // Handle conversation text
        if (data.type === 'ConversationText') {
            if (data.role === 'assistant') {
                var response = {
                    type: 'llm',
                    text: data.content || '',
                    metadata: data,
                };
                onAgentUtterance === null || onAgentUtterance === void 0 ? void 0 : onAgentUtterance(response);
                return;
            }
            else if (data.role === 'user') {
                var response = {
                    type: 'user',
                    text: data.content || '',
                    metadata: data,
                };
                onUserMessage === null || onUserMessage === void 0 ? void 0 : onUserMessage(response);
                return;
            }
        }
        // Handle errors
        if (data.type === 'Error') {
            handleError({
                service: 'agent',
                code: data.code || 'agent_error',
                message: data.description || 'Unknown agent error',
                details: data,
            });
            return;
        }
        // Handle warnings
        if (data.type === 'Warning') {
            log('Agent warning:', data.description, 'Code:', data.code);
            return;
        }
    };
    // Handle agent audio - only relevant if agent is configured
    var handleAgentAudio = function (data) {
        // Skip processing if agent service isn't configured
        if (!agentManagerRef.current) {
            log('Received unexpected agent audio but service is not configured');
            return;
        }
        log("handleAgentAudio called! Received buffer of ".concat(data.byteLength, " bytes"));
        // Skip audio playback if we're waiting for user voice after sleep
        if (isWaitingForUserVoiceAfterSleep.current) {
            log('Skipping audio playback because waiting for user voice after sleep');
            return;
        }
        if (audioManagerRef.current) {
            log('Passing buffer to AudioManager.queueAudio()');
            audioManagerRef.current
                .queueAudio(data)
                .then(function () {
                log('Successfully queued audio buffer for playback');
            })
                .catch(function (error) {
                log('Error queueing audio:', error);
            });
        }
        else {
            log('Cannot queue audio: audioManagerRef.current is null');
        }
    };
    // Send audio data to WebSockets - conditionally route based on configuration
    var sendAudioData = function (data) {
        var _a;
        // Send to transcription service if configured and connected
        if (((_a = transcriptionManagerRef.current) === null || _a === void 0 ? void 0 : _a.getState()) === 'connected') {
            transcriptionManagerRef.current.sendBinary(data);
        }
        // Send to agent service if configured, connected, and not in sleep mode
        if (agentManagerRef.current) {
            // Check if sleeping or entering sleep before sending to agent
            var isSleepingOrEntering = stateRef.current.agentState === 'sleeping' ||
                stateRef.current.agentState === 'entering_sleep';
            if (agentManagerRef.current.getState() === 'connected' && !isSleepingOrEntering) {
                agentManagerRef.current.sendBinary(data);
            }
            else if (isSleepingOrEntering) {
                sleepLog('Skipping sendAudioData to agent (state:', stateRef.current.agentState, ')');
            }
        }
    };
    // Start the connection
    var start = function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 14, , 15]);
                    log('Start method called');
                    if (!audioManagerRef.current) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    log('Ensuring AudioManager is initialized...');
                    return [4 /*yield*/, audioManagerRef.current.initialize()];
                case 2:
                    _a.sent();
                    log('AudioManager initialized');
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    // The initialize method is idempotent and returns early if already initialized
                    // If we get here, there was an actual error initializing
                    log('Error initializing AudioManager:', error_1);
                    throw error_1;
                case 4:
                    if (!transcriptionManagerRef.current) return [3 /*break*/, 6];
                    log('Connecting Transcription WebSocket...');
                    return [4 /*yield*/, transcriptionManagerRef.current.connect()];
                case 5:
                    _a.sent();
                    log('Transcription WebSocket connected');
                    return [3 /*break*/, 7];
                case 6:
                    log('Transcription manager not configured, skipping connection');
                    _a.label = 7;
                case 7:
                    if (!agentManagerRef.current) return [3 /*break*/, 9];
                    log('Connecting Agent WebSocket...');
                    return [4 /*yield*/, agentManagerRef.current.connect()];
                case 8:
                    _a.sent();
                    log('Agent WebSocket connected');
                    return [3 /*break*/, 10];
                case 9:
                    log('Agent manager not configured, skipping connection');
                    _a.label = 10;
                case 10:
                    if (!audioManagerRef.current) return [3 /*break*/, 12];
                    log('Starting recording...');
                    return [4 /*yield*/, audioManagerRef.current.startRecording()];
                case 11:
                    _a.sent();
                    log('Recording started');
                    return [3 /*break*/, 13];
                case 12:
                    log('AudioManager not initialized, cannot start recording');
                    throw new Error('Audio manager not available for recording');
                case 13:
                    log('Start method completed successfully');
                    return [3 /*break*/, 15];
                case 14:
                    error_2 = _a.sent();
                    log('Error within start method:', error_2);
                    handleError({
                        service: 'transcription',
                        code: 'start_error',
                        message: 'Failed to start voice interaction',
                        details: error_2,
                    });
                    dispatch({ type: 'READY_STATE_CHANGE', isReady: false });
                    throw error_2;
                case 15: return [2 /*return*/];
            }
        });
    }); };
    // Stop the connection
    var stop = function () { return __awaiter(_this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log('Stopping voice interaction');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    // Send CloseStream message to finalize any pending transcriptions (if configured)
                    if (transcriptionManagerRef.current) {
                        log('Sending CloseStream message to finalize transcription');
                        transcriptionManagerRef.current.sendCloseStream();
                    }
                    // Stop recording if audio manager is available
                    if (audioManagerRef.current) {
                        audioManagerRef.current.stopRecording();
                    }
                    // Add a small delay to allow final transcripts to be processed
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 2:
                    // Add a small delay to allow final transcripts to be processed
                    _a.sent();
                    // Close WebSockets if configured
                    if (transcriptionManagerRef.current) {
                        transcriptionManagerRef.current.close();
                    }
                    if (agentManagerRef.current) {
                        agentManagerRef.current.close();
                    }
                    // Signal not ready after stopping
                    dispatch({ type: 'READY_STATE_CHANGE', isReady: false });
                    return [2 /*return*/, Promise.resolve()];
                case 3:
                    error_3 = _a.sent();
                    log('Error stopping:', error_3);
                    handleError({
                        service: 'transcription',
                        code: 'stop_error',
                        message: 'Error while stopping transcription',
                        details: error_3,
                    });
                    dispatch({ type: 'READY_STATE_CHANGE', isReady: false });
                    return [2 /*return*/, Promise.reject(error_3)];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Update agent instructions - only if agent is configured
    var updateAgentInstructions = function (payload) {
        if (!agentManagerRef.current) {
            log('Cannot update instructions: agent manager not initialized or not configured');
            return;
        }
        log('Updating agent instructions:', payload);
        // Use UpdatePrompt message for the new agent API
        agentManagerRef.current.sendJSON({
            type: 'UpdatePrompt',
            prompt: payload.instructions || payload.context || '',
        });
    };
    // Clear all audio playback
    var clearAudio = function () {
        log('📢 clearAudio helper called');
        if (!audioManagerRef.current) {
            log('❌ Cannot clear audio: audioManagerRef.current is null');
            return;
        }
        try {
            log('🔴 Calling audioManager.clearAudioQueue()');
            audioManagerRef.current.clearAudioQueue();
            // Additional audio cleanup
            if (audioManagerRef.current['audioContext']) {
                log('🔄 Manipulating audio context time reference');
                var ctx = audioManagerRef.current['audioContext'];
                try {
                    var silentBuffer = ctx.createBuffer(1, 1024, ctx.sampleRate);
                    var silentSource = ctx.createBufferSource();
                    silentSource.buffer = silentBuffer;
                    silentSource.connect(ctx.destination);
                    silentSource.start();
                }
                catch (e) {
                    log('⚠️ Error creating silent buffer:', e);
                }
            }
        }
        catch (err) {
            log('❌ Error in clearAudio:', err);
        }
        log('📢 clearAudio helper completed');
    };
    // Interrupt the agent - only if agent is configured
    var interruptAgent = function () {
        log('🔴 interruptAgent method called');
        if (!agentManagerRef.current) {
            log('Cannot interrupt agent: agent manager not initialized or not configured');
            return;
        }
        clearAudio();
        log('🔴 Setting agent state to idle');
        sleepLog('Dispatching AGENT_STATE_CHANGE to idle (from interruptAgent)');
        dispatch({ type: 'AGENT_STATE_CHANGE', state: 'idle' });
        log('🔴 interruptAgent method completed');
    };
    // Put agent to sleep - only if agent is configured
    var sleep = function () {
        if (!agentManagerRef.current) {
            log('Cannot put agent to sleep: agent manager not initialized or not configured');
            return;
        }
        sleepLog('sleep() method called - initiating transition');
        isWaitingForUserVoiceAfterSleep.current = true;
        clearAudio();
        sleepLog('Dispatching AGENT_STATE_CHANGE to entering_sleep (from sleep())');
        dispatch({ type: 'AGENT_STATE_CHANGE', state: 'entering_sleep' });
    };
    // Wake agent from sleep - only if agent is configured
    var wake = function () {
        if (!agentManagerRef.current) {
            log('Cannot wake agent: agent manager not initialized or not configured');
            return;
        }
        if (stateRef.current.agentState !== 'sleeping') {
            sleepLog("wake() called but state is ".concat(stateRef.current.agentState, ", not 'sleeping'. Aborting wake."));
            return;
        }
        sleepLog('wake() method called from sleeping state');
        isWaitingForUserVoiceAfterSleep.current = false;
        sleepLog('Dispatching AGENT_STATE_CHANGE to listening (from wake())');
        dispatch({ type: 'AGENT_STATE_CHANGE', state: 'listening' });
    };
    // Toggle between sleep and wake states - only if agent is configured
    var toggleSleep = function () {
        if (!agentManagerRef.current) {
            log('Cannot toggle agent sleep state: agent manager not initialized or not configured');
            return;
        }
        sleepLog('toggleSleep() method called. Current state via ref:', stateRef.current.agentState);
        if (stateRef.current.agentState === 'sleeping') {
            wake();
        }
        else if (stateRef.current.agentState !== 'entering_sleep') {
            sleep();
        }
        else {
            sleepLog('toggleSleep() called while already entering_sleep. No action.');
        }
        sleepLog('Sleep toggle action dispatched or ignored');
    };
    // Inject a message directly to the agent
    var injectAgentMessage = function (message) {
        if (!agentManagerRef.current) {
            log('Cannot inject message: agent manager not initialized or not configured');
            return;
        }
        log('Injecting agent message:', message);
        agentManagerRef.current.sendJSON({
            type: 'InjectAgentMessage',
            content: message,
        });
    };
    // Expose methods via ref
    useImperativeHandle(ref, function () { return ({
        start: start,
        stop: stop,
        updateAgentInstructions: updateAgentInstructions,
        interruptAgent: interruptAgent,
        sleep: sleep,
        wake: wake,
        toggleSleep: toggleSleep,
        injectAgentMessage: injectAgentMessage,
        startRecording: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!audioManagerRef.current) {
                    throw new Error('Audio manager not initialized');
                }
                return [2 /*return*/, audioManagerRef.current.startRecording()];
            });
        }); },
        stopRecording: function () {
            if (!audioManagerRef.current) {
                log('Audio manager not initialized');
                return;
            }
            audioManagerRef.current.stopRecording();
        },
        checkMicrophonePermissions: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!audioManagerRef.current) {
                    throw new Error('Audio manager not initialized');
                }
                return [2 /*return*/, audioManagerRef.current.checkMicrophonePermissions()];
            });
        }); },
        getMicrophoneState: function () {
            if (!audioManagerRef.current) {
                return null;
            }
            return audioManagerRef.current.getMicrophoneState();
        },
    }); });
    // Render nothing (headless component)
    return null;
}
export default forwardRef(DeepgramVoiceInteraction);
//# sourceMappingURL=index.js.map