import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import { TOOL_NAMES } from '../../../constants/tools-config';

namespace Internal {
  
  export interface CreateStoryboardFileInput {

    app: App;
  }

  export interface CreateStoryboardFileOutput {
    
    filePath: string;
    
    message: string;
  }

  export const CREATE_STORYBOARD_FILE_METADATA = {
    name: TOOL_NAMES.CREATE_STORYBOARD_FILE,
    description: 'Create a new storyboard file with sample content',
    parameters: {
      type: 'object',
      properties: {
        app: {
          type: 'object',
          description: 'Obsidian app instance'
        }
      },
      required: ['app']
    }
  } as const;

  export async function executeCreateStoryboardFile(args: CreateStoryboardFileInput): Promise<string> {
    const { app } = args;
    
    const sampleContent = '';

    try {
      let counter = 1;
      let fileName = `無題のファイル ${counter}.storyboard`;
      
      while (app.vault.getAbstractFileByPath(fileName)) {
        counter++;
        fileName = `無題のファイル ${counter}.storyboard`;
      }

      const file = await app.vault.create(fileName, sampleContent);
      
      const result: CreateStoryboardFileOutput = {
        filePath: file.path,
        message: `ストーリーボードファイル "${fileName}" を作成しました`
      };
      
      return JSON.stringify(result);
    } catch (error) {
      const errorResult: CreateStoryboardFileOutput = {
        filePath: '',
        message: 'ストーリーボードファイルの作成に失敗しました'
      };
      return JSON.stringify(errorResult);
    }
  }
}

export const createStoryboardFileTool: Tool<Internal.CreateStoryboardFileInput> = {
  name: TOOL_NAMES.CREATE_STORYBOARD_FILE,
  description: 'Create a new storyboard file with sample content',
  parameters: {
    type: 'object',
    properties: {
      app: {
        type: 'object',
        description: 'Obsidian app instance'
      }
    },
    required: ['app']
  },
  execute: Internal.executeCreateStoryboardFile
}; 
