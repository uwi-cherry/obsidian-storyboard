import { falChatCompletions } from '../gateway/fal-ai';
import { replicateChatCompletions } from '../gateway/replicate';
import { Agent, ChatMessage, Attachment } from './init-agent';

function buildApiMessages(messages: ChatMessage[]): Array<{ role: string; content?: any; name?: string }> {
  return messages.map(({ role, content, name, attachments }) => {
    if (attachments && attachments.length > 0) {
      const parts: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> = [];
      if (content) parts.push({ type: 'text', text: content });
      for (const att of attachments) {
        parts.push({ type: 'text', text: `[${att.type}]` });
        parts.push({ type: 'image_url', image_url: { url: att.url } });
      }
      return { role, content: parts, name };
    }
    return { role, content, name };
  });
}

function buildFunctions(agent: Agent) {
  return agent.tools.map(t => ({ name: t.name, description: t.description, parameters: t.parameters }));
}

export interface RunResult {
  finalOutput: string | null;
  history: ChatMessage[];
}

export async function runAgent(agent: Agent, userMessage: string, attachments: Attachment[] = []): Promise<RunResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: agent.instructions },
    ...agent.history,
    { role: 'user', content: userMessage, attachments }
  ];

  const payload: Record<string, unknown> = {
    model: agent.model,
    messages: buildApiMessages(messages),
    max_tokens: 512,
    temperature: 0.8
  };

  if (agent.tools.length) {
    Object.assign(payload, { functions: buildFunctions(agent), function_call: 'auto' });
  }

  const data = agent.provider === 'fal'
    ? await falChatCompletions(agent.apiKey, payload)
    : await replicateChatCompletions(agent.apiKey, payload);

  const msg = data.choices?.[0]?.message as ChatMessage | undefined;
  if (msg) {
    agent.history.push({ role: 'user', content: userMessage, attachments });
    agent.history.push(msg);
  }

  return { finalOutput: msg?.content?.trim() ?? null, history: agent.history };
}
