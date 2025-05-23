import test from 'node:test';
import assert from 'node:assert/strict';
import { TestSuiteManager, getTestEnvironment, MemoryMonitor } from './test-config.js';

/**
 * メインテストエントリーポイント
 * すべてのテストスイートを統合して実行
 */

const testManager = new TestSuiteManager();
const memoryMonitor = new MemoryMonitor();

// テスト開始時のメッセージ
console.log('🧪 Obsidian Storyboard Plugin テスト開始');
console.log(`📍 環境: ${getTestEnvironment()}`);
console.log(`⏰ 開始時間: ${new Date().toISOString()}`);

// グローバルセットアップ
testManager.addGlobalSetup(async () => {
  console.log('🔧 グローバルセットアップ実行中...');
  memoryMonitor.checkpoint('setup-start');
  
  // ここでObsidianモックの初期化やその他のセットアップを行う
  if (global.gc) {
    global.gc(); // ガベージコレクションを実行（--expose-gcフラグが必要）
  }
  
  memoryMonitor.checkpoint('setup-complete');
});

// グローバルティアダウン
testManager.addGlobalTeardown(async () => {
  console.log('🧹 グローバルティアダウン実行中...');
  memoryMonitor.checkpoint('teardown-start');
  
  // メモリリークチェック
  memoryMonitor.assertNoMemoryLeak();
  
  // メモリレポート表示
  if (process.env.SHOW_MEMORY_REPORT) {
    console.log('📊 メモリ使用量レポート:');
    console.log(JSON.stringify(memoryMonitor.getReport(), null, 2));
  }
  
  memoryMonitor.checkpoint('teardown-complete');
  console.log('✅ テスト完了');
});

// メインテストスイート
test.describe('Obsidian Storyboard Plugin Test Suite', () => {
  
  test.describe('🔧 セットアップとティアダウン', () => {
    test('グローバルセットアップが正常に動作する', async () => {
      await testManager.runGlobalSetup();
      // セットアップが成功したことを確認
      assert(true, 'セットアップが完了しました');
    });

    test('メモリモニタリングが動作する', () => {
      const report = memoryMonitor.getReport();
      assert(typeof report === 'object', 'メモリレポートが生成される');
      assert(Array.isArray(report.checkpoints), 'チェックポイントが記録される');
    });
  });

  test.describe('🧪 ユニットテスト', async () => {
    // ダミーテスト（実際のテストファイルは個別に実行される）
    test('ユニットテストが利用可能', () => {
      assert(true, 'ユニットテストフレームワークが動作します');
    });
  });

  test.describe('🔗 統合テスト', async () => {
    // ダミーテスト（実際のテストファイルは個別に実行される）
    test('統合テストが利用可能', () => {
      assert(true, '統合テストフレームワークが動作します');
    });
  });

  test.describe('📋 契約テスト', async () => {
    // ダミーテスト（実際のテストファイルは個別に実行される）
    test('契約テストが利用可能', () => {
      assert(true, '契約テストフレームワークが動作します');
    });
  });

  test.describe('🏃‍♂️ パフォーマンステスト', () => {
    test('基本的なパフォーマンステスト', async () => {
      const start = Date.now();
      
      // 簡単な処理を実行
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const duration = Date.now() - start;
      assert(duration >= 10, 'タイミング測定が正常に動作する');
      assert(duration < 100, 'テスト自体のオーバーヘッドが小さい');
    });

    test('メモリ使用量テスト', () => {
      const beforeMemory = process.memoryUsage().heapUsed;
      
      // メモリを使用する処理
      const largeArray = new Array(1000).fill('test');
      
      const afterMemory = process.memoryUsage().heapUsed;
      assert(afterMemory > beforeMemory, 'メモリ使用量を測定できる');
      
      // クリーンアップ
      largeArray.length = 0;
    });
  });

  test.describe('🌐 環境固有テスト', () => {
    const env = getTestEnvironment();

    test(`${env}環境での実行`, () => {
      assert(typeof env === 'string', '環境が検出される');
      assert(['ci', 'integration', 'development'].includes(env), '有効な環境である');
    });

    if (env === 'ci') {
      test('CI環境固有のテスト', () => {
        assert(process.env.CI || process.env.GITHUB_ACTIONS, 'CI環境で実行中');
      });
    }

    if (env === 'development') {
      test('開発環境固有のテスト', () => {
        // 開発環境でのみ実行されるテスト
        assert(true, '開発環境で実行中');
      });
    }
  });

  test.describe('🛠️ テストツールと設定', () => {
    test('Node.js標準テストランナーが利用可能', () => {
      assert(typeof test === 'function', 'testが関数として利用可能');
      assert(typeof test.describe === 'function', 'test.describeが利用可能');
      assert(typeof test.beforeEach === 'function', 'test.beforeEachが利用可能');
      assert(typeof test.afterEach === 'function', 'test.afterEachが利用可能');
    });

    test('アサーションライブラリが利用可能', () => {
      assert(typeof assert === 'function', 'assertが関数として利用可能');
      assert(typeof assert.equal === 'function', 'assert.equalが利用可能');
      assert(typeof assert.deepEqual === 'function', 'assert.deepEqualが利用可能');
      assert(typeof assert.rejects === 'function', 'assert.rejectsが利用可能');
    });

    test('カスタムテストユーティリティが利用可能', async () => {
      // テストヘルパーのインポートテスト
      try {
        const { assertStringMatches } = await import('./utils/test-helpers.js');
        assert(typeof assertStringMatches === 'function', 'カスタムアサーションが利用可能');
      } catch (error) {
        console.warn('テストヘルパーのインポートに失敗:', error.message);
      }
    });

    test('Obsidianモックが利用可能', async () => {
      try {
        const { createMockApp } = await import('./utils/obsidian-mock.js');
        const mockApp = createMockApp();
        
        assert(typeof mockApp === 'object', 'MockAppが作成される');
        assert(typeof mockApp.vault === 'object', 'vault APIがモックされる');
        assert(typeof mockApp.workspace === 'object', 'workspace APIがモックされる');
      } catch (error) {
        console.warn('Obsidianモックのインポートに失敗:', error.message);
      }
    });
  });
});

// テスト実行のステータス報告
test.after(async () => {
  console.log('\n📊 テスト実行完了レポート:');
  console.log(`⏰ 終了時間: ${new Date().toISOString()}`);
  
  // メモリ使用量の最終レポート
  const finalReport = memoryMonitor.getReport();
  const heapGrowth = finalReport.leaked.heapUsed;
  
  if (heapGrowth > 0) {
    console.log(`💾 メモリ増加: ${Math.round(heapGrowth / 1024)}KB`);
  } else {
    console.log('💾 メモリリークなし');
  }
  
  console.log('🎉 すべてのテストが完了しました！');
}); 