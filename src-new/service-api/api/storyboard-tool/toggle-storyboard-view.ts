import { Tool } from '../../core/tool';
import { App, WorkspaceLeaf, MarkdownView } from 'obsidian';
import type { StoryboardFactory } from '../../../obsidian-api/storyboard/storyboard-factory';
import { TOOL_NAMES } from '../../../constants/tools-config';

namespace Internal {
  
  export interface ToggleStoryboardViewInput {
    
    app: App;
    
    leaf: WorkspaceLeaf;
    
    factory: StoryboardFactory;
  }

  export const TOGGLE_STORYBOARD_VIEW_METADATA = {
    name: TOOL_NAMES.TOGGLE_STORYBOARD_VIEW,
    description: 'Toggle between markdown and storyboard view',
    parameters: {
      type: 'object',
      properties: {
        app: {
          type: 'object',
          description: 'Obsidian app instance'
        },
        leaf: {
          type: 'object',
          description: 'Target workspace leaf'
        },
        factory: {
          type: 'object',
          description: 'Storyboard factory instance'
        }
      },
      required: ['app', 'leaf', 'factory']
    }
  } as const;

  export async function executeToggleStoryboardView(args: ToggleStoryboardViewInput): Promise<string> {
    const { app, leaf, factory } = args;

    if (!(leaf.view instanceof MarkdownView)) {
      return 'マークダウンビューではありません';
    }

    const view = leaf.view;
    const file = view.file;
    if (!file) {
      return 'ファイルがありません';
    }

    const currentMode = factory.getCurrentViewMode(leaf);

    if (currentMode === 'markdown') {
        if (file.extension !== 'storyboard') {
          const parentPath = file.parent?.path ?? '';
          const baseName = file.basename;
          let counter = 0;
          let newPath = parentPath && parentPath !== '/' ? `${parentPath}/${baseName}.storyboard` : `${baseName}.storyboard`;
          
          while (app.vault.getAbstractFileByPath(newPath) && app.vault.getAbstractFileByPath(newPath) !== file) {
            counter += 1;
            newPath = parentPath && parentPath !== '/' ? `${parentPath}/${baseName}-${counter}.storyboard` : `${baseName}-${counter}.storyboard`;
          }
          
          if (newPath !== file.path) {
            try {
              await app.vault.rename(file, newPath);
            } catch (renameError) {
              console.error(renameError);
            }
          }
        }
        await factory.switchToStoryboardViewMode(leaf, app);
        return 'ストーリーボードビューに切り替えました';
      } else {
        if (file.extension === 'storyboard') {
          const parentPath = file.parent?.path ?? '';
          const baseName = file.basename;
          let counter = 0;
          let newPath = parentPath && parentPath !== '/' ? `${parentPath}/${baseName}.md` : `${baseName}.md`;
          
          while (app.vault.getAbstractFileByPath(newPath) && app.vault.getAbstractFileByPath(newPath) !== file) {
            counter += 1;
            newPath = parentPath && parentPath !== '/' ? `${parentPath}/${baseName}-${counter}.md` : `${baseName}-${counter}.md`;
          }
          
          if (newPath !== file.path) {
            try {
              await app.vault.rename(file, newPath);
            } catch (renameError) {
              console.error(renameError);
            }
          }
        }
        factory.switchToMarkdownViewMode(leaf);
        return 'マークダウンビューに切り替えました';
      }
  }
}

export const toggleStoryboardViewTool: Tool<Internal.ToggleStoryboardViewInput> = {
  name: TOOL_NAMES.TOGGLE_STORYBOARD_VIEW,
  description: 'Toggle between markdown and storyboard view',
  parameters: {
    type: 'object',
    properties: {
      app: {
        type: 'object',
        description: 'Obsidian app instance'
      },
      leaf: {
        type: 'object',
        description: 'Target workspace leaf'
      },
      factory: {
        type: 'object',
        description: 'Storyboard factory instance'
      }
    },
    required: ['app', 'leaf', 'factory']
  },
  execute: Internal.executeToggleStoryboardView
}; 
