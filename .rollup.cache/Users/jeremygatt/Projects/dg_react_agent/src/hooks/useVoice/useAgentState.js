import { useCallback, useState } from 'react';
import { MODEL_CONFIG } from '../../utils/shared/config';
export function useAgentState(managers, options) {
    if (options === void 0) { options = {}; }
    var _a = useState('idle'), agentState = _a[0], setAgentState = _a[1];
    var _b = useState(false), isWaitingForUserVoiceAfterSleep = _b[0], setIsWaitingForUserVoiceAfterSleep = _b[1];
    var log = useCallback(function (message) {
        if (options.debug) {
            console.log("[AgentState] ".concat(message));
        }
    }, [options.debug]);
    // Clear audio playback
    var clearAudio = useCallback(function () {
        log('📢 clearAudio helper called');
        if (!managers.audio.current) {
            log('❌ Cannot clear audio: audio manager is null');
            return;
        }
        try {
            log('🔴 Calling audioManager.clearAudioQueue()');
            managers.audio.current.clearAudioQueue();
        }
        catch (err) {
            log("\u274C Error in clearAudio: ".concat(err instanceof Error ? err.message : 'Unknown error'));
        }
        log('📢 clearAudio helper completed');
    }, [managers.audio, log]);
    // Interrupt the agent
    var interruptAgent = useCallback(function () {
        var _a;
        log('🔴 interruptAgent method called');
        if (!managers.agent.current) {
            log('Cannot interrupt agent: agent not configured');
            return;
        }
        clearAudio();
        log('🔴 Setting agent state to idle');
        setAgentState('idle');
        (_a = options.onAgentStateChange) === null || _a === void 0 ? void 0 : _a.call(options, 'idle');
        log('🔴 interruptAgent method completed');
    }, [clearAudio, log, options.onAgentStateChange]);
    // Put agent to sleep
    var sleep = useCallback(function () {
        var _a;
        if (!managers.agent.current) {
            log('Cannot put agent to sleep: agent not configured');
            return;
        }
        log('💤 Putting agent to sleep...');
        setIsWaitingForUserVoiceAfterSleep(true);
        clearAudio();
        setAgentState('entering_sleep');
        (_a = options.onAgentStateChange) === null || _a === void 0 ? void 0 : _a.call(options, 'entering_sleep');
        log('✅ Agent entering sleep mode');
    }, [clearAudio, log, options.onAgentStateChange]);
    // Wake agent from sleep
    var wake = useCallback(function () {
        var _a;
        if (!managers.agent.current) {
            log('Cannot wake agent: agent not configured');
            return;
        }
        if (agentState !== 'sleeping') {
            log("Cannot wake agent: Current state is ".concat(agentState, ", not 'sleeping'"));
            return;
        }
        log('🌅 Waking agent...');
        setIsWaitingForUserVoiceAfterSleep(false);
        setAgentState('listening');
        (_a = options.onAgentStateChange) === null || _a === void 0 ? void 0 : _a.call(options, 'listening');
        log('✅ Agent awake and listening');
    }, [agentState, log, options.onAgentStateChange]);
    // Toggle between sleep and wake states
    var toggleSleep = useCallback(function () {
        if (!managers.agent.current) {
            log('Cannot toggle sleep state: agent not configured');
            return;
        }
        log("\uD83D\uDD04 Toggling sleep state. Current state: ".concat(agentState));
        if (agentState === 'sleeping') {
            wake();
        }
        else if (agentState !== 'entering_sleep') {
            sleep();
        }
        else {
            log('Already entering sleep mode, ignoring toggle');
        }
    }, [agentState, wake, sleep, log]);
    // Update agent instructions
    var updateAgentInstructions = useCallback(function (payload) {
        if (!managers.agent.current) {
            log('Cannot update instructions: Agent not configured');
            return;
        }
        log('🔄 Updating agent instructions...');
        managers.agent.current.sendJSON({
            type: 'Configure',
            listenModel: MODEL_CONFIG.agent.listen,
            thinkModel: MODEL_CONFIG.agent.think,
            voice: MODEL_CONFIG.agent.speak,
            instructions: payload.instructions,
            context: payload.context
        });
        log('✅ Agent instructions updated');
    }, [log]);
    // Inject a message directly to the agent
    var injectAgentMessage = useCallback(function (text) {
        if (!managers.agent.current) {
            log('Cannot inject message: Agent not configured');
            return;
        }
        log("\uD83D\uDCAC Injecting agent message: ".concat(text));
        managers.agent.current.sendJSON({
            type: 'InjectAgentMessage',
            content: text
        });
        log('✅ Message injected');
    }, [log]);
    return {
        agentState: agentState,
        isWaitingForUserVoiceAfterSleep: isWaitingForUserVoiceAfterSleep,
        clearAudio: clearAudio,
        interruptAgent: interruptAgent,
        sleep: sleep,
        wake: wake,
        toggleSleep: toggleSleep,
        updateAgentInstructions: updateAgentInstructions,
        injectAgentMessage: injectAgentMessage
    };
}
//# sourceMappingURL=useAgentState.js.map