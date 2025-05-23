import { Tool } from '../../core/tool';
import { TFile } from 'obsidian';

/**
 * 内部実装 - サービスAPI内部でのみ使用
 */
namespace Internal {
  /**
   * Create Storyboard File の入力型
   */
  export interface CreateStoryboardFileInput {
    /** アプリインスタンス */
    app: any;
  }

  /**
   * Create Storyboard File の出力型
   */
  export interface CreateStoryboardFileOutput {
    /** 作成されたファイルのパス */
    filePath: string;
    /** 成功メッセージ */
    message: string;
  }

  /**
   * Create Storyboard File のメタデータ
   */
  export const CREATE_STORYBOARD_FILE_METADATA = {
    name: 'create_storyboard_file',
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

  /**
   * Create Storyboard File の実行関数
   */
  export async function executeCreateStoryboardFile(args: CreateStoryboardFileInput): Promise<string> {
    const { app } = args;
    
    // 空のファイルを作成（新規ファイル判定で検知されるように）
    const sampleContent = '';

    try {
      // 連番を付けてファイルを作成
      let counter = 1;
      let fileName = `無題のファイル ${counter}.storyboard`;
      
      // 既存のファイルをチェックして、使用可能な番号を見つける
      while (app.vault.getAbstractFileByPath(fileName)) {
        counter++;
        fileName = `無題のファイル ${counter}.storyboard`;
      }

      // 新しいファイルを作成
      const file = await app.vault.create(fileName, sampleContent);
      
      // 作成されたファイルのパスと成功メッセージをJSON形式で返す
      const result: CreateStoryboardFileOutput = {
        filePath: file.path,
        message: `ストーリーボードファイル "${fileName}" を作成しました`
      };
      
      return JSON.stringify(result);
    } catch (error) {
      console.error('サンプルファイルの作成に失敗しました:', error);
      const errorResult: CreateStoryboardFileOutput = {
        filePath: '',
        message: 'ストーリーボードファイルの作成に失敗しました'
      };
      return JSON.stringify(errorResult);
    }
  }
}

/**
 * 外部公開用のツール定義
 * リフレクションシステムでのみ使用される
 */
export const createStoryboardFileTool: Tool<Internal.CreateStoryboardFileInput> = {
  name: 'create_storyboard_file',
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