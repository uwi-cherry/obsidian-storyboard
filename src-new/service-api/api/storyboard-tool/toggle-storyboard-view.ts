import { Tool } from '../../core/tool';
import { WorkspaceLeaf, MarkdownView } from 'obsidian';

/**
 * 内部実装 - サービスAPI内部でのみ使用
 */
namespace Internal {
  /**
   * Toggle Storyboard View の入力型
   */
  export interface ToggleStoryboardViewInput {
    /** アプリインスタンス */
    app: any;
    /** 対象リーフ */
    leaf: WorkspaceLeaf;
    /** ストーリーボードファクトリ */
    factory: any;
  }

  /**
   * Toggle Storyboard View のメタデータ
   */
  export const TOGGLE_STORYBOARD_VIEW_METADATA = {
    name: 'toggle_storyboard_view',
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

  /**
   * Toggle Storyboard View の実行関数
   */
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
    
    try {
      if (currentMode === 'markdown') {
        // markdown -> storyboard へ切り替え
        if (file.extension !== 'storyboard') {
          // ファイル拡張子を変更
          const parentPath = file.parent?.path ?? '';
          const baseName = file.basename;
          let counter = 0;
          let newPath = `${parentPath ? parentPath + '/' : ''}${baseName}.storyboard`;
          
          // より安全な重複チェック
          while (app.vault.getAbstractFileByPath(newPath) && app.vault.getAbstractFileByPath(newPath) !== file) {
            counter += 1;
            newPath = `${parentPath ? parentPath + '/' : ''}${baseName}-${counter}.storyboard`;
          }
          
          // 現在のファイルと同じパスでない場合のみrenameを実行
          if (newPath !== file.path) {
            try {
              await app.vault.rename(file, newPath);
            } catch (renameError) {
              console.error('ファイル名変更に失敗:', renameError);
              // ファイル名変更に失敗しても、ビュー切り替えは続行
            }
          }
        }
        await factory.switchToStoryboardViewMode(leaf, app);
        return 'ストーリーボードビューに切り替えました';
      } else {
        // storyboard -> markdown へ切り替え
        if (file.extension === 'storyboard') {
          // ファイル拡張子を変更
          const parentPath = file.parent?.path ?? '';
          const baseName = file.basename;
          let counter = 0;
          let newPath = `${parentPath ? parentPath + '/' : ''}${baseName}.md`;
          
          // より安全な重複チェック
          while (app.vault.getAbstractFileByPath(newPath) && app.vault.getAbstractFileByPath(newPath) !== file) {
            counter += 1;
            newPath = `${parentPath ? parentPath + '/' : ''}${baseName}-${counter}.md`;
          }
          
          // 現在のファイルと同じパスでない場合のみrenameを実行
          if (newPath !== file.path) {
            try {
              await app.vault.rename(file, newPath);
            } catch (renameError) {
              console.error('ファイル名変更に失敗:', renameError);
              // ファイル名変更に失敗しても、ビュー切り替えは続行
            }
          }
        }
        factory.switchToMarkdownViewMode(leaf);
        return 'マークダウンビューに切り替えました';
      }
    } catch (error) {
      console.error('ビュー切り替えに失敗しました:', error);
      throw error; // エラーを上位に伝播させる
    }
  }
}

/**
 * 外部公開用のツール定義
 * リフレクションシステムでのみ使用される
 */
export const toggleStoryboardViewTool: Tool<Internal.ToggleStoryboardViewInput> = {
  name: 'toggle_storyboard_view',
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