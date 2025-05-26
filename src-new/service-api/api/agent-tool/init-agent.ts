export type Provider = 'fal' | 'replicate';

export interface Attachment {
  type: 'image' | 'mask' | 'reference';
  url: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content?: string;
  name?: string;
  attachments?: Attachment[];
}

export interface AgentOptions {
  apiKey: string;
  provider: Provider;
  instructions?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AgentState {
  options: AgentOptions;
  history: ChatMessage[];
}

export function initAgent(options: AgentOptions): AgentState {
  return {
    options: {
      ...options,
      instructions: options.instructions ?? 'You are a helpful assistant.',
      model: options.model ?? 'gpt-4o',
    },
    history: [],
  };
}
