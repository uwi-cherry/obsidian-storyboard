import { Tool } from '../../core/tool';
import { initAgent, AgentOptions, ChatMessage, Attachment } from '../agent-tool/init-agent';
import { runAgent } from '../agent-tool/run-agent';
import { toolRegistry } from '../../core/tool-registry';

namespace Internal {
  export interface GenerateTextInput extends AgentOptions {
    message: string;
    history?: ChatMessage[];
    attachments?: Attachment[];
  }

  export interface GenerateTextOutput {
    text: string | null;
    history: ChatMessage[];
  }

  export const GENERATE_TEXT_METADATA = {
    name: 'generate_text',
    description: 'Generate text response from AI agent',
    parameters: {
      type: 'object',
      properties: {
        apiKey: { type: 'string', description: 'API key' },
        provider: { type: 'string', description: 'Service provider' },
        instructions: { type: 'string', description: 'System instructions', nullable: true },
        model: { type: 'string', description: 'Model name', nullable: true },
        message: { type: 'string', description: 'User message' },
        history: { type: 'array', description: 'Chat history', nullable: true },
        attachments: { type: 'array', description: 'Image attachments', nullable: true },
        tools: { type: 'array', description: 'Tools', nullable: true }
      },
      required: ['apiKey', 'provider', 'message']
    }
  } as const;

  export async function executeGenerateText(args: GenerateTextInput): Promise<string> {
    const { message, history = [], attachments = [], tools, ...agentOpts } = args;
    const agentTools = tools ?? toolRegistry.getAiEnabledTools();
    const agent = initAgent({ ...agentOpts, tools: agentTools });
    agent.history = history;
    const result = await runAgent(agent, message, attachments);
    const out: GenerateTextOutput = { text: result.finalOutput, history: result.history };
    return JSON.stringify(out);
  }
}

export const generateTextTool: Tool<Internal.GenerateTextInput> = {
  name: 'generate_text',
  description: 'Generate text response from AI agent',
  parameters: Internal.GENERATE_TEXT_METADATA.parameters,
  execute: Internal.executeGenerateText
};
