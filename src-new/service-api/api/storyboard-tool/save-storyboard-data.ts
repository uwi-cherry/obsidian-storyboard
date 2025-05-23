import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import { StoryboardData } from '../../../types/storyboard';

/**
 * 内部実装 - サービスAPI内部でのみ使用
 */
namespace Internal {
  /**
   * Save Storyboard Data の入力型
   */
  export interface SaveStoryboardDataInput {
    /** アプリインスタンス */
    app: App;
    /** ファイル */
    file: TFile;
    /** StoryboardData（JSON文字列） */
    data: string;
  }

  /**
   * StoryboardDataをマークダウンにフォーマット
   */
  function formatStoryboardToMarkdown(data: StoryboardData): string {
    let content = '';
    // キャラクターセクション
    content += '### キャラクター\n\n';
    if (data.characters && data.characters.length > 0) {
      data.characters.forEach((char) => {
        content += `#### ${char.name}\n`;
        content += `- 説明\n  - ${char.attributes['説明'] || ''}\n`;
      });
    }
    data.chapters.forEach(chapter => {
      content += `\n### ${chapter.bgmPrompt ?? ''}\n\n`;
      let prevEnd = '00:00:00';
      chapter.frames.forEach(frame => {
        content += `#### ${frame.speaker || ''}\n`;
        content += `${frame.dialogues || ''}\n`;
        if (frame.imageUrl !== undefined || frame.imagePrompt !== undefined) {
          content += `[${frame.imagePrompt ?? ''}](${frame.imageUrl ?? ''})\n`;
        }
        if (frame.endTime !== undefined || frame.prompt !== undefined) {
          const timecode = `${prevEnd}-${frame.endTime ?? ''}`;
          content += `> [!INFO] ${timecode}`.trimEnd() + '\n';
          if (frame.prompt !== undefined) {
            frame.prompt.split('\n').forEach(l => {
              content += `> ${l}\n`;
            });
          }
          prevEnd = frame.endTime ?? prevEnd;
        }
      });
    });
    return content.trimEnd() + (data.chapters.some(c => c.frames.length > 0) ? '\n' : '');
  }

  /**
   * Save Storyboard Data の実行関数
   */
  export async function executeSaveStoryboardData(args: SaveStoryboardDataInput): Promise<string> {
    const { app, file, data } = args;
    try {
      const storyboardData: StoryboardData = JSON.parse(data);
      const newMarkdownContent = formatStoryboardToMarkdown(storyboardData);
      await app.vault.modify(file, newMarkdownContent);
      return `ストーリーボードファイル "${file.name}" を保存しました`;
    } catch (error) {
      console.error('ストーリーボードファイル保存エラー:', error);
      return 'ストーリーボードファイルの保存に失敗しました';
    }
  }
}

/**
 * 外部公開用のツール定義
 */
export const saveStoryboardDataTool: Tool<Internal.SaveStoryboardDataInput> = {
  name: 'save_storyboard_data',
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