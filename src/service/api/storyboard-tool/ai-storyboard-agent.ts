import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import { TOOL_NAMES } from '../../../constants/tools-config';
import { toolRegistry } from '../../core/tool-registry';
import { getStyleInstructions, getPluginSettings } from '../../../constants/plugin-settings';

namespace Internal {
  export interface RunStoryboardAiAgentInput {
    app: App;
    file: TFile;
    prompt: string;
    chapterIndex: number;
  }

  export interface RunStoryboardAiAgentOutput {
    added: number;
    message: string;
  }

  export async function executeRunStoryboardAiAgent(args: RunStoryboardAiAgentInput): Promise<string> {
    const { app, file, prompt, chapterIndex } = args;
    const dataStr = await toolRegistry.executeTool<string, string>(TOOL_NAMES.LOAD_STORYBOARD_DATA, { app, file });
    const settings = getPluginSettings();
    const instructions = getStyleInstructions();
    const apiKey = settings?.falApiKey ?? '';
    const message = `${prompt}\n`;
    const gen = await toolRegistry.executeTool(TOOL_NAMES.GENERATE_TEXT, {
      apiKey,
      provider: 'fal',
      model: 'openai/gpt-4o',
      instructions,
      message,
      history: []
    });
    const { text } = JSON.parse(gen) as { text: string };
    if (!text) {
      return JSON.stringify({ added: 0, message: 'AIから結果が得られませんでした' });
    }
    const lines = text.split(/\n+/).map(l => l.trim()).filter(l => l);
    await toolRegistry.executeTool(TOOL_NAMES.ADD_STORYBOARD_ROWS_BULK, {
      app,
      file,
      chapterIndex,
      texts: lines
    });
    const out: RunStoryboardAiAgentOutput = { added: lines.length, message: 'AIによる行追加完了' };
    return JSON.stringify(out);
  }
}

export const runStoryboardAiAgentTool: Tool<Internal.RunStoryboardAiAgentInput> = {
  name: TOOL_NAMES.RUN_STORYBOARD_AI_AGENT,
  description: 'Run AI agent to edit storyboard',
  parameters: {
    type: 'object',
    properties: {
      app: { type: 'object', description: 'Obsidian app instance' },
      file: { type: 'object', description: 'Target storyboard file' },
      prompt: { type: 'string', description: 'User prompt for AI' },
      chapterIndex: { type: 'number', description: 'Target chapter index' }
    },
    required: ['app', 'file', 'prompt', 'chapterIndex']
  },
  execute: Internal.executeRunStoryboardAiAgent
};
