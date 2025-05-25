import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import { TOOL_NAMES } from '../../../constants/tools-config';
import type { OtioProject } from '../../../types/otio';

namespace Internal {
  export interface LoadOtioFileInput {
    app: App;
    file: TFile;
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

  export async function executeLoadOtioFile(args: LoadOtioFileInput): Promise<string> {
    const { app, file } = args;
    const content = await app.vault.read(file);
    let project: OtioProject;

    if (!content.trim()) {
      project = createEmptyProject();
      await app.vault.modify(file, JSON.stringify(project, null, 2));
      return JSON.stringify(project);
    }

    project = JSON.parse(content);
    if (!project.metadata) {
      project.metadata = createEmptyProject().metadata;
    }
    if (project.metadata.psd_references === undefined) {
      project.metadata.psd_references = [];
    }

    return JSON.stringify(project);
  }
}

export const loadOtioFileTool: Tool<Internal.LoadOtioFileInput> = {
  name: TOOL_NAMES.LOAD_OTIO_FILE,
  description: 'Load OTIO file',
  parameters: {
    type: 'object',
    properties: {
      app: { type: 'object', description: 'Obsidian app instance' },
      file: { type: 'object', description: 'Target file' }
    },
    required: ['app', 'file']
  },
  execute: Internal.executeLoadOtioFile
};
