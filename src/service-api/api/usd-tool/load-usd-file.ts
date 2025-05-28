import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import { TOOL_NAMES } from '../../../constants/tools-config';
import type { UsdProject } from '../../../types/usd';

namespace Internal {
  export interface LoadUsdFileInput {
    app: App;
    file: TFile;
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

  export async function executeLoadUsdFile(args: LoadUsdFileInput): Promise<string> {
    const { app, file } = args;
    const content = await app.vault.read(file);
    let project: UsdProject;

    if (!content.trim()) {
      project = createEmptyProject();
      await app.vault.modify(file, JSON.stringify(project, null, 2));
      return JSON.stringify(project);
    }

    project = JSON.parse(content);
    if (!project.metadata) {
      project.metadata = createEmptyProject().metadata;
    }
    

    return JSON.stringify(project);
  }
}

export const loadUsdFileTool: Tool<Internal.LoadUsdFileInput> = {
  name: TOOL_NAMES.LOAD_USD_FILE,
  description: 'Load USD file',
  parameters: {
    type: 'object',
    properties: {
      app: { type: 'object', description: 'Obsidian app instance' },
      file: { type: 'object', description: 'Target file' }
    },
    required: ['app', 'file']
  },
  execute: Internal.executeLoadUsdFile
};
