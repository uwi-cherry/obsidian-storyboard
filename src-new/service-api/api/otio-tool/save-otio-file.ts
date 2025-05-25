import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import { TOOL_NAMES } from '../../../constants/tools-config';
import type { OtioProject } from '../../../types/otio';

namespace Internal {
  export interface SaveOtioFileInput {
    app: App;
    file: TFile;
    project: OtioProject;
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

      }
    };
  }

  export async function executeSaveOtioFile(args: SaveOtioFileInput): Promise<string> {
    const { app, file, project } = args;
    const projectToSave: OtioProject = JSON.parse(JSON.stringify(project));

    if (!projectToSave.metadata) {
      projectToSave.metadata = createEmptyProject().metadata;
    }
    

    const content = JSON.stringify(projectToSave, null, 2);
    await app.vault.modify(file, content);
    return 'saved';
  }
}

export const saveOtioFileTool: Tool<Internal.SaveOtioFileInput> = {
  name: TOOL_NAMES.SAVE_OTIO_FILE,
  description: 'Save OTIO file',
  parameters: {
    type: 'object',
    properties: {
      app: { type: 'object', description: 'Obsidian app instance' },
      file: { type: 'object', description: 'Target file' },
      project: { type: 'object', description: 'Project data' }
    },
    required: ['app', 'file', 'project']
  },
  execute: Internal.executeSaveOtioFile
};
