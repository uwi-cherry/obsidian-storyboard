import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import { TOOL_NAMES } from '../../../constants/tools-config';
import { toolRegistry } from '../../core/tool-registry';
import { StoryboardData, StoryboardFrame } from '../../../types/storyboard';

namespace Internal {
  export interface AddStoryboardRowInput {
    app: App;
    file: TFile;
    chapterIndex: number;
    initialText?: string;
  }

  export interface AddStoryboardRowOutput {
    message: string;
  }

  export async function executeAddStoryboardRow(args: AddStoryboardRowInput): Promise<string> {
    const { app, file, chapterIndex, initialText = '' } = args;
    const dataStr = await toolRegistry.executeTool<string, string>(TOOL_NAMES.LOAD_STORYBOARD_DATA, { app, file });
    const data = JSON.parse(dataStr) as StoryboardData;
    const frame: StoryboardFrame = {
      dialogues: initialText,
      speaker: '',
      imageUrl: '',
      imagePrompt: '',
      prompt: '',
      endTime: '',
    };
    if (!data.chapters[chapterIndex]) {
      data.chapters[chapterIndex] = { bgmPrompt: '', frames: [] };
    }
    data.chapters[chapterIndex].frames.push(frame);
    await toolRegistry.executeTool(TOOL_NAMES.SAVE_STORYBOARD_DATA, {
      app,
      file,
      data: JSON.stringify(data)
    });
    const out: AddStoryboardRowOutput = { message: '行を追加しました' };
    return JSON.stringify(out);
  }
}

export const addStoryboardRowTool: Tool<Internal.AddStoryboardRowInput> = {
  name: TOOL_NAMES.ADD_STORYBOARD_ROW,
  description: 'Add one row to storyboard with default text',
  parameters: {
    type: 'object',
    properties: {
      app: { type: 'object', description: 'Obsidian app instance' },
      file: { type: 'object', description: 'Target storyboard file' },
      chapterIndex: { type: 'number', description: 'Chapter index' },
      initialText: { type: 'string', description: 'Initial dialogue text', nullable: true }
    },
    required: ['app', 'file', 'chapterIndex']
  },
  execute: Internal.executeAddStoryboardRow
};
