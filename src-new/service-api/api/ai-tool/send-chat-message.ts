import { Tool } from '../../core/tool';
import { AiAgent } from './ai-agent';
import { AiAgentRunner } from './ai-agent-runner';
import { Tool as AiTool } from './types';

namespace Internal {
  export interface Attachment {
    url: string;
    type: 'image' | 'mask' | 'reference';
    data?: string;
  }

  export interface SendChatMessageInput {
    message: string;
    onToken?: (token: string) => void;
    attachments?: Attachment[];
    apiKey?: string;
    provider?: 'fal' | 'replicate';
  }

  export const SEND_CHAT_MESSAGE_METADATA = {
    name: 'send_chat_message',
    description: 'Send chat message to AI agent',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'User message' }
      },
      required: ['message']
    }
  } as const;

  const chatHistory: Array<{ role: 'system' | 'user' | 'assistant' | 'function'; content?: string; name?: string }> = [];

  export async function executeSendChatMessage(args: SendChatMessageInput): Promise<string> {
    const { message, onToken, attachments = [], apiKey = '', provider = 'fal' } = args;

    const agent = new AiAgent({
      apiKey,
      provider,
      instructions: 'あなたは親切なアシスタントです。',
      tools: [] as AiTool[]
    });

    if (onToken) {
      const agentForCheck = new AiAgent({ ...agent, maxTokens: 1 });
      const check = await AiAgentRunner.run(agentForCheck, message, chatHistory, attachments);
      const last = check.history[check.history.length - 1];
      const isFunctionCall = last && last.role === 'function';
      if (!isFunctionCall) {
        const res = await AiAgentRunner.runStreamed(agent, message, onToken, chatHistory, attachments);
        return res.finalOutput ?? '';
      }
      const res = await AiAgentRunner.run(agent, message, chatHistory, attachments);
      return res.finalOutput ?? '';
    }

    const res = await AiAgentRunner.run(agent, message, chatHistory, attachments);
    return res.finalOutput ?? '';
  }
}

export const sendChatMessageTool: Tool<Internal.SendChatMessageInput> = {
  name: Internal.SEND_CHAT_MESSAGE_METADATA.name,
  description: Internal.SEND_CHAT_MESSAGE_METADATA.description,
  parameters: Internal.SEND_CHAT_MESSAGE_METADATA.parameters,
  execute: Internal.executeSendChatMessage
};

