/**
 * テスト設定とグローバルセットアップ
 */

// グローバルテスト設定
const TEST_CONFIG = {
  // タイムアウト設定
  timeout: {
    unit: 5000,      // 5秒
    integration: 10000, // 10秒
    contract: 3000,  // 3秒
  },
  
  // モック設定
  mocks: {
    obsidian: {
      enableAutomaticCleanup: true,
      enableMemoryTracking: true,
    }
  },
  
  // ログレベル
  logLevel: process.env.NODE_ENV === 'test' ? 'error' : 'info',
  
  // パフォーマンステスト設定
  performance: {
    maxExecutionTime: 1000,
    enableProfiling: false,
  }
};

// テスト環境の検出
export function getTestEnvironment() {
  if (process.env.NODE_ENV === 'test') {
    return 'ci';
  }
  if (process.env.TEST_ENV === 'integration') {
    return 'integration';
  }
  return 'development';
}

// テストタイプごとのタイムアウト設定
export function getTimeout(testType) {
  return TEST_CONFIG.timeout[testType] || TEST_CONFIG.timeout.unit;
}

// メモリ使用量監視
export class MemoryMonitor {
  constructor() {
    this.initialMemory = process.memoryUsage();
    this.checkpoints = [];
  }

  checkpoint(label) {
    const memory = process.memoryUsage();
    this.checkpoints.push({
      label,
      memory,
      timestamp: Date.now()
    });
  }

  getReport() {
    const currentMemory = process.memoryUsage();
    return {
      initial: this.initialMemory,
      current: currentMemory,
      checkpoints: this.checkpoints,
      leaked: {
        heapUsed: currentMemory.heapUsed - this.initialMemory.heapUsed,
        heapTotal: currentMemory.heapTotal - this.initialMemory.heapTotal,
        external: currentMemory.external - this.initialMemory.external,
      }
    };
  }

  assertNoMemoryLeak(threshold = 10 * 1024 * 1024) { // 10MB
    const report = this.getReport();
    const heapGrowth = report.leaked.heapUsed;
    
    if (heapGrowth > threshold) {
      console.warn(`メモリリークの可能性: ${Math.round(heapGrowth / 1024 / 1024)}MB増加`);
      console.warn('メモリ使用量レポート:', report);
    }
  }
}

// テストデータファクトリー
export class TestDataFactory {
  static createStoryboardContent(characterCount = 2, chapterCount = 1) {
    let content = '### キャラクター\n';
    
    for (let i = 1; i <= characterCount; i++) {
      content += `#### キャラクター${i}\n`;
      content += `- 説明\n`;
      content += `  - テストキャラクター${i}の説明\n`;
    }
    
    for (let chapter = 1; chapter <= chapterCount; chapter++) {
      content += `### 第${chapter}章\n`;
      
      for (let char = 1; char <= characterCount; char++) {
        content += `#### キャラクター${char}\n`;
        content += `テストセリフ${chapter}-${char}\n`;
      }
    }
    
    return content;
  }

  static createFileList(prefix = 'test', count = 5, extension = 'storyboard') {
    return Array.from({ length: count }, (_, i) => 
      `${prefix}-${i + 1}.${extension}`
    );
  }

  static createAppConfig(overrides = {}) {
    return {
      enabledPlugins: ['storyboard'],
      vault: {
        path: '/test/vault',
        adapter: 'memory'
      },
      ...overrides
    };
  }
}

// テストスイート管理
export class TestSuiteManager {
  constructor() {
    this.suites = new Map();
    this.globalSetup = [];
    this.globalTeardown = [];
  }

  addSuite(name, suite) {
    this.suites.set(name, suite);
  }

  addGlobalSetup(fn) {
    this.globalSetup.push(fn);
  }

  addGlobalTeardown(fn) {
    this.globalTeardown.push(fn);
  }

  async runGlobalSetup() {
    for (const fn of this.globalSetup) {
      await fn();
    }
  }

  async runGlobalTeardown() {
    for (const fn of this.globalTeardown) {
      await fn();
    }
  }

  async runSuite(name) {
    const suite = this.suites.get(name);
    if (!suite) {
      throw new Error(`テストスイート '${name}' が見つかりません`);
    }

    await this.runGlobalSetup();
    try {
      await suite.run();
    } finally {
      await this.runGlobalTeardown();
    }
  }

  async runAllSuites() {
    await this.runGlobalSetup();
    try {
      for (const [name, suite] of this.suites) {
        console.log(`実行中: ${name}`);
        await suite.run();
      }
    } finally {
      await this.runGlobalTeardown();
    }
  }
}

// テスト用ユーティリティ関数
export function createTestId() {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isRunningInCI() {
  return !!(process.env.CI || process.env.GITHUB_ACTIONS || process.env.TRAVIS);
}

export function skipIfCI(testFn) {
  return isRunningInCI() ? test.skip : testFn;
}

export function skipIfNotCI(testFn) {
  return isRunningInCI() ? testFn : test.skip;
}

// パフォーマンステスト用
export async function measurePerformance(fn, label = 'test') {
  const start = process.hrtime.bigint();
  const memStart = process.memoryUsage();
  
  const result = await fn();
  
  const end = process.hrtime.bigint();
  const memEnd = process.memoryUsage();
  
  const duration = Number(end - start) / 1000000; // ナノ秒をミリ秒に変換
  const memDiff = {
    heapUsed: memEnd.heapUsed - memStart.heapUsed,
    heapTotal: memEnd.heapTotal - memStart.heapTotal,
  };
  
  console.log(`Performance [${label}]: ${duration.toFixed(2)}ms, Memory: ${Math.round(memDiff.heapUsed / 1024)}KB`);
  
  return {
    result,
    duration,
    memory: memDiff
  };
}

// エクスポートのデフォルト設定
export default TEST_CONFIG; 