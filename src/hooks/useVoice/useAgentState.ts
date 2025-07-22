import { useCallback, useState } from 'react';
import { AgentState, UpdateInstructionsPayload } from '../../types/voice';
import { VoiceWebSocketManager } from '../../utils/websocket/VoiceWebSocketManager';
import { AudioOutputManager } from '../../utils/audio/AudioOutputManager';
import { MODEL_CONFIG } from '../../utils/shared/config';

interface UseAgentStateOptions {
  onAgentStateChange?: (state: AgentState) => void;
  debug?: boolean;
}

interface UseAgentStateReturn {
  agentState: AgentState;
  isWaitingForUserVoiceAfterSleep: boolean;
  clearAudio: () => void;
  interruptAgent: () => void;
  sleep: () => void;
  wake: () => void;
  toggleSleep: () => void;
  updateAgentInstructions: (payload: UpdateInstructionsPayload) => void;
  injectAgentMessage: (text: string) => void;
}

export function useAgentState(
  managers: {
    agent: React.RefObject<VoiceWebSocketManager>;
    audio: React.RefObject<AudioOutputManager>;
  },
  options: UseAgentStateOptions = {}
): UseAgentStateReturn {
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [isWaitingForUserVoiceAfterSleep, setIsWaitingForUserVoiceAfterSleep] = useState(false);

  const log = useCallback((message: string) => {
    if (options.debug) {
      console.log(`[AgentState] ${message}`);
    }
  }, [options.debug]);

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
  }, [managers.audio, log]);

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
    options.onAgentStateChange?.('idle');
    log('🔴 interruptAgent method completed');
  }, [clearAudio, log, options.onAgentStateChange]);

  // Put agent to sleep
  const sleep = useCallback((): void => {
    if (!managers.agent.current) {
      log('Cannot put agent to sleep: agent not configured');
      return;
    }

    log('💤 Putting agent to sleep...');
    setIsWaitingForUserVoiceAfterSleep(true);
    clearAudio();
    setAgentState('entering_sleep');
    options.onAgentStateChange?.('entering_sleep');
    log('✅ Agent entering sleep mode');
  }, [clearAudio, log, options.onAgentStateChange]);

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
    setIsWaitingForUserVoiceAfterSleep(false);
    setAgentState('listening');
    options.onAgentStateChange?.('listening');
    log('✅ Agent awake and listening');
  }, [agentState, log, options.onAgentStateChange]);

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
    agentState,
    isWaitingForUserVoiceAfterSleep,
    clearAudio,
    interruptAgent,
    sleep,
    wake,
    toggleSleep,
    updateAgentInstructions,
    injectAgentMessage
  };
} 