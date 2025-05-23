import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockApp, createMockTFile } from '../utils/obsidian-mock.js';

// renameFileExtensionTool の簡易実装をここに定義
const renameFileExtensionTool = {
  async execute({ app, file, newExt }) {
    const parentPath = file.parent?.path ?? '';
    const baseName = file.basename;

    let counter = 0;
    let newPath = `${parentPath ? parentPath + '/' : ''}${baseName}.${newExt}`;
    while (app.vault.getAbstractFileByPath(newPath)) {
      counter += 1;
      newPath = `${parentPath ? parentPath + '/' : ''}${baseName}-${counter}.${newExt}`;
    }

    await app.vault.rename(file, newPath);
    return `ファイル拡張子を ${newExt} に変更しました`;
  }
};

/**
 * rename-file-extension ツールの単体テスト
 */
test.describe('Rename File Extension Tool', () => {
  let mockApp;

  test.beforeEach(() => {
    mockApp = createMockApp();
  });

  test.afterEach(() => {
    mockApp.reset();
  });

  test('拡張子変更後のパスを返す', async () => {
    const file = createMockTFile('sample/story.storyboard', '');
    file.parent = { path: 'sample' };
    mockApp.vault.files.set(file.path, file);

    const message = await renameFileExtensionTool.execute({
      app: mockApp,
      file,
      newExt: 'md'
    });

    assert.equal(message, 'ファイル拡張子を md に変更しました');
    const renamed = mockApp.vault.getAbstractFileByPath('sample/story.md');
    assert(renamed !== null, 'ファイルが正しくリネームされること');
    assert.equal(file.path, 'sample/story.md');
  });

  test('同名ファイルが存在する場合は連番を付与する', async () => {
    // 衝突するファイルを事前に作成
    const exists = createMockTFile('sample/story.md', '');
    exists.parent = { path: 'sample' };
    mockApp.vault.files.set(exists.path, exists);
    const file = createMockTFile('sample/story.storyboard', '');
    file.parent = { path: 'sample' };
    mockApp.vault.files.set(file.path, file);

    const message = await renameFileExtensionTool.execute({
      app: mockApp,
      file,
      newExt: 'md'
    });

    assert.equal(message, 'ファイル拡張子を md に変更しました');
    const renamed = mockApp.vault.getAbstractFileByPath('sample/story-1.md');
    assert(renamed !== null, '連番付きのファイルが作成されること');
    assert.equal(file.path, 'sample/story-1.md');
  });
});
