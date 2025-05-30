import { Tool } from '../../core/tool';
import type { Attachment as AttachmentType } from '../../../types/ui';
export type Attachment = AttachmentType;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content?: string;
  name?: string;
  function_call?: { name: string; arguments: string };
  attachments?: Attachment[];
}

export interface AgentOptions {
  apiKey: string;
  provider: 'fal' | 'replicate';
  instructions?: string;
  model?: string;
  tools?: Tool[];
}

export interface Agent {
  apiKey: string;
  provider: 'fal' | 'replicate';
  instructions: string;
  model: string;
  tools: Tool[];
  history: ChatMessage[];
}

export function initAgent(options: AgentOptions): Agent {
  return {
    apiKey: options.apiKey,
    provider: options.provider,
    instructions: options.instructions ?? 'You are a helpful assistant.',
    model: options.model ?? 'gpt-4o',
    tools: options.tools ?? [],
    history: []
  };
}
