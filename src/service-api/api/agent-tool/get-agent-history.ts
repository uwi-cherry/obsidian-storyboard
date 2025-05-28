import { Agent, ChatMessage } from './init-agent';

export function getAgentHistory(agent: Agent): ChatMessage[] {
  return agent.history;
}
