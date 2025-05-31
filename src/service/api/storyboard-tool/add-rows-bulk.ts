import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import { TOOL_NAMES } from '../../../constants/tools-config';
import { toolRegistry } from '../../core/tool-registry';
import { StoryboardData, StoryboardFrame } from '../../../types/storyboard';

namespace Internal {
  export interface AddStoryboardRowsBulkInput {
    app: App;
    file: TFile;
    chapterIndex: number;
    texts: string[];
  }

  export interface AddStoryboardRowsBulkOutput {
    added: number;
    message: string;
  }

  export async function executeAddStoryboardRowsBulk(args: AddStoryboardRowsBulkInput): Promise<string> {
    const { app, file, chapterIndex, texts } = args;
    const dataStr = await toolRegistry.executeTool(TOOL_NAMES.LOAD_STORYBOARD_DATA, { app, file });
    const data = JSON.parse(dataStr) as StoryboardData;
    if (!data.chapters[chapterIndex]) {
      data.chapters[chapterIndex] = { bgmPrompt: '', frames: [] };
    }
    for (const t of texts) {
      const frame: StoryboardFrame = { dialogues: t, speaker: '', imageUrl: '', imagePrompt: '', prompt: '', endTime: '' };
      data.chapters[chapterIndex].frames.push(frame);
    }
    await toolRegistry.executeTool(TOOL_NAMES.SAVE_STORYBOARD_DATA, { app, file, data: JSON.stringify(data) });
    const out: AddStoryboardRowsBulkOutput = { added: texts.length, message: '行を追加しました' };
    return JSON.stringify(out);
  }
}

export const addStoryboardRowsBulkTool: Tool<Internal.AddStoryboardRowsBulkInput> = {
  name: TOOL_NAMES.ADD_STORYBOARD_ROWS_BULK,
  description: 'Add multiple rows to storyboard at once',
  parameters: {
    type: 'object',
    properties: {
      app: { type: 'object', description: 'Obsidian app instance' },
      file: { type: 'object', description: 'Target storyboard file' },
      chapterIndex: { type: 'number', description: 'Chapter index' },
      texts: { type: 'array', description: 'List of dialogue texts', items: { type: 'string' } }
    },
    required: ['app', 'file', 'chapterIndex', 'texts']
  },
  execute: Internal.executeAddStoryboardRowsBulk
};
