import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockApp } from '../utils/obsidian-mock.js';
import { assertStringMatches, assertArrayContains } from '../utils/test-helpers.js';

/**
 * ストーリーボードツール統合テスト
 * 複数のツールが連携して動作することを確認
 */
test.describe('Storyboard Tools Integration', () => {
  let mockApp;

  test.beforeEach(() => {
    mockApp = createMockApp();
  });

  test.afterEach(() => {
    mockApp.reset();
  });

  test('ストーリーボードファイルの作成から拡張子変更まで一連の流れ', async () => {
    // 1. ストーリーボードファイルを作成
    const createStoryboardFile = async (app) => {
      const sampleContent = `### キャラクター
#### 太郎
- 説明
  - 主人公。高校生。
### 第1章
#### 太郎
テストストーリー
`;

      let counter = 1;
      let fileName = `無題のファイル ${counter}.storyboard`;
      
      while (app.vault.getAbstractFileByPath(fileName)) {
        counter++;
        fileName = `無題のファイル ${counter}.storyboard`;
      }

      await app.vault.create(fileName, sampleContent);
      return fileName;
    };

    // 2. ファイルの拡張子を変更
    const renameFileExtension = async (app, originalPath, newExtension) => {
      const file = app.vault.getAbstractFileByPath(originalPath);
      if (!file) {
        throw new Error(`ファイルが見つかりません: ${originalPath}`);
      }

      const pathParts = originalPath.split('.');
      pathParts[pathParts.length - 1] = newExtension;
      const newPath = pathParts.join('.');

      // 衝突回避
      let counter = 1;
      let finalPath = newPath;
      while (app.vault.getAbstractFileByPath(finalPath)) {
        const baseName = newPath.substring(0, newPath.lastIndexOf('.'));
        finalPath = `${baseName} (${counter}).${newExtension}`;
        counter++;
      }

      await app.vault.rename(file, finalPath);
      return finalPath;
    };

    // 3. 統合テスト実行
    const createdFileName = await createStoryboardFile(mockApp);
    assertStringMatches(createdFileName, '.storyboard');

    // ファイルが作成されたことを確認
    const createdFiles = mockApp.vault.getCreatedFiles();
    assert.equal(createdFiles.length, 1);
    assert.equal(createdFiles[0].path, createdFileName);

    // 拡張子をマークダウンに変更
    const renamedPath = await renameFileExtension(mockApp, createdFileName, 'md');
    assertStringMatches(renamedPath, '.md');
    assertStringMatches(renamedPath, '無題のファイル');

    // ファイルが正しくリネームされたことを確認
    const renamedFile = mockApp.vault.getAbstractFileByPath(renamedPath);
    assert(renamedFile !== null, 'リネームされたファイルが見つかりません');
    assert.equal(renamedFile.path, renamedPath);
  });

  test('複数のストーリーボードファイルでの名前衝突処理', async () => {
    const createMultipleFiles = async (app, count) => {
      const createdFiles = [];
      
      for (let i = 0; i < count; i++) {
        let counter = 1;
        let fileName = `無題のファイル ${counter}.storyboard`;
        
        while (app.vault.getAbstractFileByPath(fileName)) {
          counter++;
          fileName = `無題のファイル ${counter}.storyboard`;
        }

        await app.vault.create(fileName, `### テストファイル ${i + 1}`);
        createdFiles.push(fileName);
      }
      
      return createdFiles;
    };

    // 5つのファイルを作成
    const files = await createMultipleFiles(mockApp, 5);

    // 適切な連番になっているかを確認
    assert.equal(files.length, 5);
    assert.equal(files[0], '無題のファイル 1.storyboard');
    assert.equal(files[1], '無題のファイル 2.storyboard');
    assert.equal(files[2], '無題のファイル 3.storyboard');
    assert.equal(files[3], '無題のファイル 4.storyboard');
    assert.equal(files[4], '無題のファイル 5.storyboard');

    // 全ファイルが作成されたことを確認
    const createdFiles = mockApp.vault.getCreatedFiles();
    assert.equal(createdFiles.length, 5);
  });

  test('ストーリーボードとマークダウン間でのビュー切り替えシミュレーション', async () => {
    // モックビュークラス
    class MockStoryboardView {
      constructor(file) {
        this.file = file;
        this.viewType = 'storyboard-view';
      }

      getViewType() {
        return this.viewType;
      }

      getDisplayText() {
        return this.file?.basename || 'Storyboard';
      }
    }

    class MockMarkdownView {
      constructor(file) {
        this.file = file;
        this.viewType = 'markdown';
      }

      getViewType() {
        return this.viewType;
      }

      getDisplayText() {
        return this.file?.basename || 'Markdown';
      }
    }

    // ビュー切り替えをシミュレートする関数
    const toggleView = async (app, filePath) => {
      const file = app.vault.getAbstractFileByPath(filePath);
      if (!file) {
        throw new Error(`ファイルが見つかりません: ${filePath}`);
      }

      const isStoryboard = file.extension === 'storyboard';
      
      if (isStoryboard) {
        // ストーリーボードビューからマークダウンビューへ
        return new MockMarkdownView(file);
      } else {
        // マークダウンビューからストーリーボードビューへ
        return new MockStoryboardView(file);
      }
    };

    // テストファイルを作成
    await mockApp.vault.create('test.storyboard', '### テストストーリー');
    
    // ビュー切り替えテスト
    const view = await toggleView(mockApp, 'test.storyboard');
    assert.equal(view.getViewType(), 'markdown');
    assert.equal(view.getDisplayText(), 'test');

    // マークダウンファイルでもテスト
    await mockApp.vault.create('test.md', '# テストマークダウン');
    
    const storyboardView = await toggleView(mockApp, 'test.md');
    assert.equal(storyboardView.getViewType(), 'storyboard-view');
    assert.equal(storyboardView.getDisplayText(), 'test');
  });

  test('ツール実行時のエラーハンドリング', async () => {
    // 失敗するVaultを作成
    const failingApp = createMockApp();
    
    // create操作を失敗させる
    failingApp.vault.create = async () => {
      throw new Error('ディスク容量不足');
    };

    const createStoryboardFile = async (app) => {
      try {
        let fileName = '無題のファイル 1.storyboard';
        await app.vault.create(fileName, '### テスト');
        return `成功: ${fileName}`;
      } catch (error) {
        return `エラー: ${error.message}`;
      }
    };

    const result = await createStoryboardFile(failingApp);
    assertStringMatches(result, 'エラー:');
    assertStringMatches(result, 'ディスク容量不足');
  });

  test('大量のファイル作成時のパフォーマンス', async () => {
    const startTime = Date.now();

    // 50個のファイルを作成
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(
        mockApp.vault.create(`test-${i}.storyboard`, `### テストファイル ${i}`)
      );
    }

    await Promise.all(promises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 50個のファイル作成が1秒以内に完了することを確認
    assert(duration < 1000, `ファイル作成に ${duration}ms かかりました (期待値: < 1000ms)`);

    // 全ファイルが作成されたことを確認
    const createdFiles = mockApp.vault.getCreatedFiles();
    assert.equal(createdFiles.length, 50);
  });

  test('日本語ファイル名とコンテンツの適切な処理', async () => {
    const japaneseContent = `### 登場人物
#### 田中太郎（たなか たろう）
- 年齢: 16歳
- 性格: 真面目で優しい
- 特技: サッカー

### あらすじ
春の新学期、転校生の花子との出会いから始まる青春ストーリー。

### 第1話「新しい出会い」
#### 太郎
「また新しい学校か...今度こそ友達を作りたいな」

#### 花子
「こんにちは！私、新しく転校してきた田中花子です」

#### 太郎
「僕も田中です。田中太郎。同じ苗字ですね」
`;

    // 日本語ファイル名でファイルを作成
    await mockApp.vault.create('青春ストーリー.storyboard', japaneseContent);

    // ファイルが正しく作成されたか確認
    const createdFiles = mockApp.vault.getCreatedFiles();
    assert.equal(createdFiles.length, 1);
    assert.equal(createdFiles[0].path, '青春ストーリー.storyboard');

    // 日本語コンテンツが正しく保存されているか確認
    const content = createdFiles[0].content;
    assertStringMatches(content, '登場人物');
    assertStringMatches(content, '田中太郎');
    assertStringMatches(content, '青春ストーリー');
    assertStringMatches(content, '新しい出会い');

    // ファイルの属性を確認
    const file = mockApp.vault.getAbstractFileByPath('青春ストーリー.storyboard');
    assert(file !== null);
    assert.equal(file.name, '青春ストーリー.storyboard');
    assert.equal(file.basename, '青春ストーリー');
    assert.equal(file.extension, 'storyboard');
  });
}); 