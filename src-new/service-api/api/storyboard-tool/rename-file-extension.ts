import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import { TOOL_NAMES } from '../../../constants/tools-config';

namespace Internal {
  
  export interface RenameFileExtensionInput {
    
    app: App;
    
    file: TFile;
    
    newExt: string;
  }

  export const RENAME_FILE_EXTENSION_METADATA = {
    name: TOOL_NAMES.RENAME_FILE_EXTENSION,
    description: 'Rename file extension with collision avoidance',
    parameters: {
      type: 'object',
      properties: {
        app: {
          type: 'object',
          description: 'Obsidian app instance'
        },
        file: {
          type: 'object',
          description: 'Target file to rename'
        },
        newExt: {
          type: 'string',
          description: 'New file extension'
        }
      },
      required: ['app', 'file', 'newExt']
    }
  } as const;

  export async function executeRenameFileExtension(args: RenameFileExtensionInput): Promise<string> {
    const { app, file, newExt } = args;
    
    const parentPath = file.parent?.path ?? '';
    const baseName = file.basename;

    let counter = 0;
    let newPath = parentPath ? `${parentPath}/${baseName}.${newExt}` : `${baseName}.${newExt}`;
    while (app.vault.getAbstractFileByPath(newPath)) {
      counter += 1;
      newPath = parentPath ? `${parentPath}/${baseName}-${counter}.${newExt}` : `${baseName}-${counter}.${newExt}`;
    }

    try {
      await app.vault.rename(file, newPath);
      return JSON.stringify({
        newPath: newPath,
        message: `ファイル拡張子を ${newExt} に変更しました`
      });
    } catch (error) {
      throw new Error('ファイル拡張子の変更に失敗しました');
    }
  }
}

export const renameFileExtensionTool: Tool<Internal.RenameFileExtensionInput> = {
  name: TOOL_NAMES.RENAME_FILE_EXTENSION,
  description: 'Rename file extension with collision avoidance',
  parameters: {
    type: 'object',
    properties: {
      app: {
        type: 'object',
        description: 'Obsidian app instance'
      },
      file: {
        type: 'object',
        description: 'Target file to rename'
      },
      newExt: {
        type: 'string',
        description: 'New file extension'
      }
    },
    required: ['app', 'file', 'newExt']
  },
  execute: Internal.executeRenameFileExtension
}; 
