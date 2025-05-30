import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import { TOOL_NAMES } from '../../../constants/tools-config';

namespace Internal {
  export interface SaveUsdFileInput {
    app: App;
    file: TFile;
    content: string;
  }

  export async function executeSaveUsdFile(args: SaveUsdFileInput): Promise<string> {
    const { app, file, content } = args;
    await app.vault.modify(file, content);
    return 'saved';
  }
}

export const saveUsdFileTool: Tool<Internal.SaveUsdFileInput> = {
  name: TOOL_NAMES.SAVE_USD_FILE,
  description: 'Save USD file',
  parameters: {
    type: 'object',
    properties: {
      app: { type: 'object', description: 'Obsidian app instance' },
      file: { type: 'object', description: 'Target file' },
      content: { type: 'string', description: 'USDA file content' }
    },
    required: ['app', 'file', 'content']
  },
  execute: Internal.executeSaveUsdFile
};
