import { Tool } from '../../core/tool';
import { App, normalizePath } from 'obsidian';
import { TOOL_NAMES } from '../../../constants/tools-config';
import type { UsdProject } from '../../../types/usd';

namespace Internal {
  export interface CreateUsdFileInput {
    app: App;
    filename?: string;
  }

  export interface CreateUsdFileOutput {
    filePath: string;
    message: string;
  }

  function createEmptyUsdaContent(): string {
    return `#usda 1.0
(
    defaultPrim = "Main Stage"
    upAxis = "Y"
    metersPerUnit = 1
    timeCodesPerSecond = 30
)

def Xform "Main Stage" {
}`;
  }

  export async function executeCreateUsdFile(args: CreateUsdFileInput): Promise<string> {
    const { app, filename = 'untitled' } = args;

    const baseName = filename.endsWith('.usda') ? filename.slice(0, -5) : filename;
    let counter = 1;
    let path = normalizePath(`${baseName}.usda`);
    while (app.vault.getAbstractFileByPath(path)) {
      path = normalizePath(`${baseName} ${counter}.usda`);
      counter++;
    }

    const content = createEmptyUsdaContent();
    const file = await app.vault.create(path, content);

    const result: CreateUsdFileOutput = {
      filePath: file.path,
      message: `USDファイル「${file.name}」を作成しました`
    };

    return JSON.stringify(result);
  }
}

export const createUsdFileTool: Tool<Internal.CreateUsdFileInput> = {
  name: TOOL_NAMES.CREATE_USD_FILE,
  description: 'Create new USD file',
  parameters: {
    type: 'object',
    properties: {
      app: { type: 'object', description: 'Obsidian app instance' },
      filename: { type: 'string', description: 'Base file name', nullable: true }
    },
    required: ['app']
  },
  execute: Internal.executeCreateUsdFile
};
