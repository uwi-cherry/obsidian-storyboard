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

  function createEmptyProject(): UsdProject {
    return {
      USD_SCHEMA: 'Stage.1',
      schema_version: 1,
      name: 'New Project',
      stage: {
        name: 'Main Stage',
        type: 'Stage',
        tracks: [],
        global_start_time: { value: 0, rate: 30 },
        global_end_time: { value: 0, rate: 30 },
        metadata: {}
      },
      metadata: {
        timeCodesPerSecond: 30,
        resolution: { width: 1920, height: 1080 },
        upAxis: 'Y',
        metersPerUnit: 1.0
      }
    };
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

    const project = createEmptyProject();
    const content = JSON.stringify(project, null, 2);
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
