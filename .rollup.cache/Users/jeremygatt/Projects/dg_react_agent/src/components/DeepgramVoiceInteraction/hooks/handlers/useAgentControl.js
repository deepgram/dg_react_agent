import { useCallback } from 'react';
import { MODEL_CONFIG } from '../../../../utils/shared/config';
export function useAgentControl(config, managers) {
    var agentState = config.agentState, isWaitingForUserVoiceAfterSleep = config.isWaitingForUserVoiceAfterSleep, setAgentState = config.setAgentState, log = config.log;
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
    }, [log]);
    // Interrupt the agent
    var interruptAgent = useCallback(function () {
        log('🔴 interruptAgent method called');
        if (!managers.agent.current) {
            log('Cannot interrupt agent: agent not configured');
            return;
        }
        clearAudio();
        log('🔴 Setting agent state to idle');
        setAgentState('idle');
        log('🔴 interruptAgent method completed');
    }, [clearAudio, log, setAgentState]);
    // Put agent to sleep
    var sleep = useCallback(function () {
        if (!managers.agent.current) {
            log('Cannot put agent to sleep: agent not configured');
            return;
        }
        log('💤 Putting agent to sleep...');
        isWaitingForUserVoiceAfterSleep.current = true;
        clearAudio();
        setAgentState('entering_sleep');
        log('✅ Agent entering sleep mode');
    }, [clearAudio, isWaitingForUserVoiceAfterSleep, log, setAgentState]);
    // Wake agent from sleep
    var wake = useCallback(function () {
        if (!managers.agent.current) {
            log('Cannot wake agent: agent not configured');
            return;
        }
        if (agentState !== 'sleeping') {
            log("Cannot wake agent: Current state is ".concat(agentState, ", not 'sleeping'"));
            return;
        }
        log('🌅 Waking agent...');
        isWaitingForUserVoiceAfterSleep.current = false;
        setAgentState('listening');
        log('✅ Agent awake and listening');
    }, [agentState, isWaitingForUserVoiceAfterSleep, log, setAgentState]);
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
        clearAudio: clearAudio,
        interruptAgent: interruptAgent,
        sleep: sleep,
        wake: wake,
        toggleSleep: toggleSleep,
        updateAgentInstructions: updateAgentInstructions,
        injectAgentMessage: injectAgentMessage
    };
}
//# sourceMappingURL=useAgentControl.js.map