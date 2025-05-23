import { Tool } from '../../core/tool';
import { TFile } from 'obsidian';

/**
 * 内部実装 - サービスAPI内部でのみ使用
 */
namespace Internal {
  /**
   * Rename File Extension の入力型
   */
  export interface RenameFileExtensionInput {
    /** アプリインスタンス */
    app: any;
    /** 対象ファイル */
    file: TFile;
    /** 新しい拡張子 */
    newExt: string;
  }

  /**
   * Rename File Extension のメタデータ
   */
  export const RENAME_FILE_EXTENSION_METADATA = {
    name: 'rename_file_extension',
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

  /**
   * Rename File Extension の実行関数
   */
  export async function executeRenameFileExtension(args: RenameFileExtensionInput): Promise<string> {
    const { app, file, newExt } = args;
    
    const parentPath = file.parent?.path ?? '';
    const baseName = file.basename;

    // 衝突回避のため存在チェックを行う
    let counter = 0;
    let newPath = `${parentPath ? parentPath + '/' : ''}${baseName}.${newExt}`;
    while (app.vault.getAbstractFileByPath(newPath)) {
      counter += 1;
      newPath = `${parentPath ? parentPath + '/' : ''}${baseName}-${counter}.${newExt}`;
    }

    try {
      await app.vault.rename(file, newPath);
      return `ファイル拡張子を ${newExt} に変更しました`;
    } catch (error) {
      console.error('ファイル拡張子の変更に失敗しました:', error);
      throw new Error('ファイル拡張子の変更に失敗しました');
    }
  }
}

/**
 * 外部公開用のツール定義
 * リフレクションシステムでのみ使用される
 */
export const renameFileExtensionTool: Tool<Internal.RenameFileExtensionInput> = {
  name: 'rename_file_extension',
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