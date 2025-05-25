import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import { StoryboardData } from '../../../types/storyboard';
import { TOOL_NAMES } from '../../../constants/tools-config';

namespace Internal {
  
  export interface SaveStoryboardDataInput {
    
    app: App;
    
    file: TFile;
    
    data: string;
  }

  function formatStoryboardToMarkdown(data: StoryboardData): string {
    let content = '';
    content += '### キャラクター\n\n';
    if (data.characters && data.characters.length > 0) {
      data.characters.forEach((char) => {
        content += `#### ${char.name}\n`;
        content += `- 説明\n  - ${char.attributes['説明'] || ''}\n`;
      });
    }
    data.chapters.forEach(chapter => {
      content += `\n### ${chapter.bgmPrompt ?? ''}\n\n`;
      chapter.frames.forEach(frame => {
        content += `#### ${frame.speaker || ''}\n`;
        content += `${frame.dialogues || ''}\n`;
        if (frame.imageUrl !== undefined || frame.imagePrompt !== undefined) {
          content += `[${frame.imagePrompt ?? ''}](${frame.imageUrl ?? ''})\n`;
        }
        if (frame.startTime !== undefined || frame.duration !== undefined || frame.prompt !== undefined) {
          let infoLine = '> [!INFO]';
          if (frame.startTime !== undefined || frame.duration !== undefined) {
            const startTime = frame.startTime ?? 0;
            const duration = frame.duration ?? 0;
            infoLine += ` start: ${startTime}, duration: ${duration}`;
          }
          content += infoLine.trimEnd() + '\n';
          if (frame.prompt !== undefined) {
            frame.prompt.split('\n').forEach(l => {
              content += `> ${l}\n`;
            });
          }
        }
      });
    });
    return content.trimEnd() + (data.chapters.some(c => c.frames.length > 0) ? '\n' : '');
  }

  export async function executeSaveStoryboardData(args: SaveStoryboardDataInput): Promise<string> {
    const { app, file, data } = args;
    try {
      const storyboardData: StoryboardData = JSON.parse(data);
      const newMarkdownContent = formatStoryboardToMarkdown(storyboardData);
      await app.vault.modify(file, newMarkdownContent);
      return `ストーリーボードファイル "${file.name}" を保存しました`;
    } catch (error) {
      return 'ストーリーボードファイルの保存に失敗しました';
    }
  }
}

export const saveStoryboardDataTool: Tool<Internal.SaveStoryboardDataInput> = {
  name: TOOL_NAMES.SAVE_STORYBOARD_DATA,
  description: 'Save storyboard data to file',
  parameters: {
    type: 'object',
    properties: {
      app: {
        type: 'object',
        description: 'Obsidian app instance'
      },
      file: {
        type: 'object',
        description: 'Target file'
      },
      data: {
        type: 'string',
        description: 'Storyboard data as JSON string'
      }
    },
    required: ['app', 'file', 'data']
  },
  execute: Internal.executeSaveStoryboardData
}; 
