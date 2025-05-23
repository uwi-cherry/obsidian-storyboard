# 🧪 Obsidian Storyboard Plugin - テストスイート

このディレクトリには、Obsidian Storyboard Pluginの包括的なテストスイートが含まれています。

## 📁 ディレクトリ構造

```
test/
├── unit/                   # 単体テスト
│   └── *.test.js          # 個別コンポーネントのテスト
├── integration/           # 統合テスト
│   └── *.test.js          # 複数コンポーネント間の連携テスト
├── contracts/             # 契約テスト
│   └── *.test.js          # インターフェース仕様の検証
├── utils/                 # テストユーティリティ
│   ├── obsidian-mock.js   # Obsidian APIのモック
│   └── test-helpers.js    # 共通テストヘルパー
├── test-config.js         # テスト設定とセットアップ
├── index.test.js          # メインテストエントリーポイント
└── README.md              # このファイル
```

## 🚀 テスト実行方法

### 基本的なテスト実行

```bash
# すべてのテストを実行
npm test

# 特定のテストファイルを実行
npm test test/unit/create-storyboard-file.test.js

# ウォッチモードでテスト実行
npm run test:watch

# カバレッジ付きでテスト実行
npm run test:coverage
```

### 高度なテスト実行

```bash
# 詳細なメモリレポートを表示
SHOW_MEMORY_REPORT=1 npm test

# CI環境でのテスト実行
NODE_ENV=test npm test

# 統合テスト環境でのテスト実行
TEST_ENV=integration npm test
```

## 📋 テストの種類

### 1. 単体テスト (Unit Tests)
- 個別の関数やクラスの動作を検証
- モックやスタブを使用して依存関係を分離
- 実行速度が速く、デバッグが容易

**例:**
```javascript
// test/unit/create-storyboard-file.test.js
test('正常にストーリーボードファイルを作成できる', async () => {
  const mockApp = createMockApp();
  const result = await executeCreateStoryboardFile({ app: mockApp });
  assertStringMatches(result, '作成しました');
});
```

### 2. 統合テスト (Integration Tests)
- 複数のコンポーネントが連携して動作することを確認
- より現実的なシナリオでテスト
- エンドツーエンドに近い動作確認

**例:**
```javascript
// test/integration/storyboard-tools.test.js
test('ストーリーボードファイルの作成から拡張子変更まで一連の流れ', async () => {
  const fileName = await createStoryboardFile(mockApp);
  const renamedPath = await renameFileExtension(mockApp, fileName, 'md');
  assertStringMatches(renamedPath, '.md');
});
```

### 3. 契約テスト (Contract Tests)
- インターフェースの仕様を検証
- 実装が期待される契約を満たすことを確認
- APIの整合性を保証

**例:**
```javascript
// test/contracts/tool-interface.test.js
export function toolContract(createTool) {
  test('必須プロパティを持つ', () => {
    assertHasProperties(tool, ['name', 'description', 'parameters', 'execute']);
  });
}
```

## 🛠️ テストユーティリティ

### Obsidianモック (obsidian-mock.js)
Obsidian APIの軽量なモック実装を提供します。

```javascript
import { createMockApp } from './utils/obsidian-mock.js';

const mockApp = createMockApp();
await mockApp.vault.create('test.storyboard', 'content');
```

### テストヘルパー (test-helpers.js)
共通のアサーション関数や便利なテスト機能を提供します。

```javascript
import { assertStringMatches, assertThrows } from './utils/test-helpers.js';

assertStringMatches(result, 'expected pattern');
await assertThrows(() => someFunction(), 'expected error');
```

## 🏗️ テスト作成ガイドライン

### 1. テストファイルの命名規則
- `*.test.js` の形式で作成
- テスト対象のファイル名に対応させる
- 説明的な名前を使用する

### 2. テスト構造
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';

test.describe('テスト対象の説明', () => {
  let setupData;

  test.beforeEach(() => {
    setupData = createTestData();
  });

  test.afterEach(() => {
    cleanupTestData();
  });

  test('具体的なテストケースの説明', async () => {
    // Arrange - テストデータの準備
    // Act - テスト対象の実行
    // Assert - 結果の検証
  });
});
```

### 3. アサーションのベストプラクティス
- 明確で説明的なアサーションメッセージを使用
- 複数の側面を個別にテスト
- エラーケースも適切にテスト

```javascript
// 良い例
assert.equal(result.status, 'success', 'ツールの実行が成功すること');
assertStringMatches(result.message, 'ファイルを作成しました', '成功メッセージが含まれること');

// 避けるべき例
assert(result); // 何をテストしているか不明確
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. インポートエラー
```bash
Error: Cannot resolve module './utils/obsidian-mock.js'
```
**解決方法:** ファイルパスとファイル拡張子が正しいことを確認してください。

#### 2. メモリリーク警告
```bash
メモリリークの可能性: 15MB増加
```
**解決方法:** `test.afterEach()` でリソースを適切にクリーンアップしてください。

#### 3. テストタイムアウト
```bash
Test timeout after 5000ms
```
**解決方法:** `test-config.js` でタイムアウト値を調整するか、テストを最適化してください。

### デバッグ方法

```bash
# 詳細なログ出力
DEBUG=* npm test

# 特定のテストのみ実行
npm test -- --grep "ストーリーボードファイル"

# Node.jsデバッガーを使用
node --inspect-brk --test test/unit/create-storyboard-file.test.js
```

## 📊 カバレッジレポート

テストカバレッジは自動的に測定され、以下のコマンドで確認できます：

```bash
npm run test:coverage
```

目標カバレッジ:
- **ライン数:** 80%以上
- **関数:** 90%以上
- **ブランチ:** 70%以上

## 🤝 貢献ガイド

新しいテストを追加する場合：

1. 適切なディレクトリ（unit/integration/contracts）を選択
2. 既存のテストパターンに従う
3. 適切なアサーションとエラーハンドリングを実装
4. 日本語でのテスト説明を提供
5. 必要に応じてモックとヘルパーを活用

## 📚 参考資料

- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [Node.js Assert](https://nodejs.org/api/assert.html)
- [Obsidian Plugin API](https://docs.obsidian.md/Plugins)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Note:** このテストスイートはObsidian Storyboard Pluginの品質と信頼性を保証するために作成されています。新機能を追加する際は、対応するテストも必ず作成してください。 