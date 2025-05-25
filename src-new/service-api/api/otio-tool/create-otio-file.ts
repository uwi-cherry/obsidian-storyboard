import { Tool } from '../../core/tool';
import { App, normalizePath } from 'obsidian';
import { TOOL_NAMES } from '../../../constants/tools-config';
import type { OtioProject } from '../../../types/otio';

namespace Internal {
  export interface CreateOtioFileInput {
    app: App;
    filename?: string;
  }

  export interface CreateOtioFileOutput {
    filePath: string;
    message: string;
  }

  function createEmptyProject(): OtioProject {
    return {
      OTIO_SCHEMA: 'Timeline.1',
      schema_version: 1,
      name: 'New Project',
      timeline: {
        name: 'Main Timeline',
        kind: 'Timeline',
        tracks: [],
        global_start_time: { value: 0, rate: 30 },
        global_end_time: { value: 0, rate: 30 },
        metadata: {}
      },
      metadata: {
        fps: 30,
        resolution: { width: 1920, height: 1080 },
        psd_references: []
      }
    };
  }

  export async function executeCreateOtioFile(args: CreateOtioFileInput): Promise<string> {
    const { app, filename = 'untitled' } = args;

    let baseName = filename.endsWith('.otio') ? filename.slice(0, -5) : filename;
    let counter = 1;
    let path = normalizePath(`${baseName}.otio`);
    while (app.vault.getAbstractFileByPath(path)) {
      path = normalizePath(`${baseName} ${counter}.otio`);
      counter++;
    }

    const project = createEmptyProject();
    const content = JSON.stringify(project, null, 2);
    const file = await app.vault.create(path, content);

    const result: CreateOtioFileOutput = {
      filePath: file.path,
      message: `OTIOファイル「${file.name}」を作成しました`
    };

    return JSON.stringify(result);
  }
}

export const createOtioFileTool: Tool<Internal.CreateOtioFileInput> = {
  name: TOOL_NAMES.CREATE_OTIO_FILE,
  description: 'Create new OTIO file',
  parameters: {
    type: 'object',
    properties: {
      app: { type: 'object', description: 'Obsidian app instance' },
      filename: { type: 'string', description: 'Base file name', nullable: true }
    },
    required: ['app']
  },
  execute: Internal.executeCreateOtioFile
};
