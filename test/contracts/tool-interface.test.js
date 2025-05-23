import test from 'node:test';
import assert from 'node:assert/strict';
import { assertHasProperties } from '../utils/test-helpers.js';

/**
 * Tool インターフェース契約テスト
 * すべてのツールが Toolインターフェースの契約を遵守することを確認
 */

/**
 * Tool契約の検証関数
 * すべてのツール実装がこの契約を満たす必要がある
 */
async function validateToolContract(tool) {
  // 必須プロパティの存在確認
  assertHasProperties(tool, ['name', 'description', 'parameters', 'execute']);

  // nameの検証
  assert(typeof tool.name === 'string', 'name should be a string');
  assert(tool.name.length > 0, 'name should not be empty');
  assert(tool.name.length <= 50, 'name should be 50 characters or less');
  
  // snake_case形式であることを確認
  const snakeCasePattern = /^[a-z][a-z0-9_]*$/;
  assert(snakeCasePattern.test(tool.name), 
    `name should be in snake_case format, but got: ${tool.name}`);

  // descriptionの検証
  assert(typeof tool.description === 'string', 'description should be a string');
  assert(tool.description.length > 0, 'description should not be empty');

  // parametersの検証
  assert(typeof tool.parameters === 'object', 'parameters should be an object');
  assert(tool.parameters !== null, 'parameters should not be null');
  
  // 基本的なJSONスキーマ構造を確認
  if ('type' in tool.parameters) {
    assert(typeof tool.parameters.type === 'string', 'parameters.type should be a string');
  }
  
  if ('properties' in tool.parameters) {
    assert(typeof tool.parameters.properties === 'object', 
      'parameters.properties should be an object');
  }
  
  if ('required' in tool.parameters) {
    assert(Array.isArray(tool.parameters.required), 
      'parameters.required should be an array');
  }

  // executeの検証
  assert(typeof tool.execute === 'function', 'execute should be a function');
  
  // 最小限の引数でexecuteを呼び出してみる
  try {
    const result = tool.execute({});
    assert(result instanceof Promise || typeof result.then === 'function',
      'execute should return a Promise');
    
    const resolvedResult = await result;
    assert(typeof resolvedResult === 'string',
      'execute should resolve to a string');
  } catch (error) {
    // パラメータエラーは許容される
    if (!error.message.includes('required') && !error.message.includes('parameter')) {
      throw error;
    }
  }

  // 適切なパラメータでの動作確認
  const args = buildValidArgs(tool.parameters);
  const result = await tool.execute(args);
  assert(typeof result === 'string', 'execute should return a string');
  assert(result.length > 0, 'execute should return non-empty string');

  // 無効なパラメータでのエラー確認
  try {
    await tool.execute({});
    // 必須パラメータがある場合はエラーがスローされるべき
    if (tool.parameters.required && tool.parameters.required.length > 0) {
      assert.fail('execute should throw an error with invalid parameters');
    }
  } catch (error) {
    // エラーが期待される場合
    assert(error instanceof Error, 'execute should throw an Error instance');
  }

  // 実行時間の確認
  const start = Date.now();
  await tool.execute(args);
  const duration = Date.now() - start;
  
  // 10秒を超える実行は警告
  if (duration > 10000) {
    console.warn(`Tool ${tool.name} took ${duration}ms to execute, which may be too slow`);
  }
  
  // 30秒を超える実行はエラー
  assert(duration < 30000, 
    `Tool ${tool.name} took ${duration}ms to execute, which is too slow`);

  return true;
}

/**
 * JSONスキーマから有効な引数オブジェクトを構築
 */
function buildValidArgs(parameters) {
  const args = {};
  
  if (!parameters || !parameters.properties) {
    return args;
  }
  
  // 必須パラメータを設定
  if (parameters.required) {
    for (const requiredParam of parameters.required) {
      const paramDef = parameters.properties[requiredParam];
      args[requiredParam] = createValidValue(paramDef);
    }
  }
  
  return args;
}

/**
 * パラメータ定義から有効な値を作成
 */
function createValidValue(paramDef) {
  if (!paramDef || !paramDef.type) {
    return null;
  }
  
  switch (paramDef.type) {
    case 'string':
      return paramDef.default || 'test-value';
    case 'number':
      return paramDef.default || 42;
    case 'boolean':
      return paramDef.default !== undefined ? paramDef.default : true;
    case 'object':
      if (paramDef.description && paramDef.description.includes('app')) {
        // Obsidian Appインスタンスが期待される場合
        return createMockApp();
      }
      return paramDef.default || {};
    case 'array':
      return paramDef.default || [];
    default:
      return null;
  }
}

/**
 * 簡単なMockAppの作成（重複を避けるため簡略版）
 */
function createMockApp() {
  return {
    vault: {
      getAbstractFileByPath: () => null,
      create: async (path, content) => ({ path, content }),
      rename: async () => {},
      read: async () => '',
      modify: async () => {}
    },
    workspace: {
      getActiveViewOfType: () => null,
      getLeavesOfType: () => []
    },
    fileManager: {
      renameFile: async () => {}
    }
  };
}

/**
 * 具体的なツールテスト
 */
test.describe('Storyboard Tools Contract Compliance', () => {
  
  test('create_storyboard_file ツールの契約遵守', async () => {
    // 実際のツール定義をシミュレート
    const tool = {
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
      execute: async (args) => {
        const { app } = args;
        if (!app) throw new Error('app parameter is required');
        
        let fileName = '無題のファイル 1.storyboard';
        await app.vault.create(fileName, '### テストコンテンツ');
        return `ストーリーボードファイル "${fileName}" を作成しました`;
      }
    };

    await validateToolContract(tool);
  });

  test('rename_file_extension ツールの契約遵守', async () => {
    const tool = {
      name: 'rename_file_extension',
      description: 'Rename file extension with collision avoidance',
      parameters: {
        type: 'object',
        properties: {
          app: {
            type: 'object',
            description: 'Obsidian app instance'
          },
          filePath: {
            type: 'string',
            description: 'Current file path'
          },
          newExtension: {
            type: 'string',
            description: 'New file extension'
          }
        },
        required: ['app', 'filePath', 'newExtension']
      },
      execute: async (args) => {
        const { app, filePath, newExtension } = args;
        if (!app || !filePath || !newExtension) {
          throw new Error('Required parameters missing');
        }
        
        const newPath = filePath.replace(/\.[^.]+$/, `.${newExtension}`);
        return `ファイルの拡張子を変更しました: ${newPath}`;
      }
    };

    await validateToolContract(tool);
  });

  test('toggle_storyboard_view ツールの契約遵守', async () => {
    const tool = {
      name: 'toggle_storyboard_view',
      description: 'Toggle between storyboard and markdown view',
      parameters: {
        type: 'object',
        properties: {
          app: {
            type: 'object',
            description: 'Obsidian app instance'
          },
          filePath: {
            type: 'string',
            description: 'Target file path'
          }
        },
        required: ['app', 'filePath']
      },
      execute: async (args) => {
        const { app, filePath } = args;
        if (!app || !filePath) {
          throw new Error('Required parameters missing');
        }
        
        const isStoryboard = filePath.endsWith('.storyboard');
        const viewType = isStoryboard ? 'markdown' : 'storyboard';
        return `ビューを${viewType}に切り替えました`;
      }
    };

    await validateToolContract(tool);
  });
}); 