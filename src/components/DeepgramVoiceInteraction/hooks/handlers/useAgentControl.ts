import { useCallback } from 'react';
import { VoiceWebSocketManager } from '../../../../utils/websocket/VoiceWebSocketManager';
import { AudioManager } from '../../../../utils/audio/AudioManager';
import { AgentState, UpdateInstructionsPayload } from '../../../../types/voice';
import { MODEL_CONFIG } from '../../../../utils/shared/config';

interface AgentControlConfig {
  agentState: AgentState;
  isWaitingForUserVoiceAfterSleep: { current: boolean };
  setAgentState: (state: AgentState) => void;
  log: (message: string, level?: 'hook' | 'manager' | 'verbose') => void;
}

export function useAgentControl(
  config: AgentControlConfig,
  managers: {
    agent: React.RefObject<VoiceWebSocketManager>;
    audio: React.RefObject<AudioManager>;
  }
) {
  const {
    agentState,
    isWaitingForUserVoiceAfterSleep,
    setAgentState,
    log
  } = config;

  // Clear audio playback
  const clearAudio = useCallback((): void => {
    log('📢 clearAudio helper called');

    if (!managers.audio.current) {
      log('❌ Cannot clear audio: audio manager is null');
      return;
    }

    try {
      log('🔴 Calling audioManager.clearAudioQueue()');
      managers.audio.current.clearAudioQueue();
    } catch (err) {
      log(`❌ Error in clearAudio: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    log('📢 clearAudio helper completed');
  }, [log]);

  // Interrupt the agent
  const interruptAgent = useCallback((): void => {
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
  const sleep = useCallback((): void => {
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
  const wake = useCallback((): void => {
    if (!managers.agent.current) {
      log('Cannot wake agent: agent not configured');
      return;
    }

    if (agentState !== 'sleeping') {
      log(`Cannot wake agent: Current state is ${agentState}, not 'sleeping'`);
      return;
    }

    log('🌅 Waking agent...');
    isWaitingForUserVoiceAfterSleep.current = false;
    setAgentState('listening');
    log('✅ Agent awake and listening');
  }, [agentState, isWaitingForUserVoiceAfterSleep, log, setAgentState]);

  // Toggle between sleep and wake states
  const toggleSleep = useCallback((): void => {
    if (!managers.agent.current) {
      log('Cannot toggle sleep state: agent not configured');
      return;
    }

    log(`🔄 Toggling sleep state. Current state: ${agentState}`);
    if (agentState === 'sleeping') {
      wake();
    } else if (agentState !== 'entering_sleep') {
      sleep();
    } else {
      log('Already entering sleep mode, ignoring toggle');
    }
  }, [agentState, wake, sleep, log]);

  // Update agent instructions
  const updateAgentInstructions = useCallback((payload: UpdateInstructionsPayload): void => {
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
  const injectAgentMessage = useCallback((text: string): void => {
    if (!managers.agent.current) {
      log('Cannot inject message: Agent not configured');
      return;
    }

    log(`💬 Injecting agent message: ${text}`);
    managers.agent.current.sendJSON({
      type: 'InjectAgentMessage',
      content: text
    });
    log('✅ Message injected');
  }, [log]);

  return {
    clearAudio,
    interruptAgent,
    sleep,
    wake,
    toggleSleep,
    updateAgentInstructions,
    injectAgentMessage
  };
} 