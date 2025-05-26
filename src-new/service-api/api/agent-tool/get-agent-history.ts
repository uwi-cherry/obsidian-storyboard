import { AgentState, ChatMessage } from './init-agent';

export function getAgentHistory(agent: AgentState): ChatMessage[] {
  return agent.history;
}
