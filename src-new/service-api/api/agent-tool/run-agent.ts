import { falChat } from '../gateway/fal-ai';
import { replicateChat } from '../gateway/replicate';
import { AgentState, ChatMessage, Attachment } from './init-agent';

export async function runAgent(
  agent: AgentState,
  userMessage: string,
  history: ChatMessage[] = [],
  attachments: Attachment[] = [],
  onToken?: (token: string) => void
): Promise<string> {
  history.push({ role: 'user', content: userMessage, attachments });

  const messages: ChatMessage[] = [
    { role: 'system', content: agent.options.instructions },
    ...history,
  ];

  const payload: Record<string, unknown> = {
    model: agent.options.model ?? 'gpt-4o',
    messages,
    max_tokens: agent.options.maxTokens ?? 512,
    temperature: agent.options.temperature ?? 0.8,
  };

  const response = agent.options.provider === 'fal'
    ? await falChat(agent.options.apiKey, payload)
    : await replicateChat(agent.options.apiKey, payload);

  const content: string = response.choices?.[0]?.message?.content ?? '';
  history.push({ role: 'assistant', content });

  if (onToken) onToken(content);

  return content;
}
