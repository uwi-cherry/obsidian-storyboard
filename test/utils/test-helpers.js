import assert from 'node:assert/strict';

/**
 * テストヘルパーユーティリティ
 */

/**
 * 非同期関数がエラーをスローすることをテストする
 */
export async function assertThrows(fn, expectedError) {
  let thrownError = null;
  try {
    await fn();
  } catch (error) {
    thrownError = error;
  }

  assert(thrownError !== null, 'Expected function to throw an error, but it did not');
  
  if (expectedError) {
    if (typeof expectedError === 'string') {
      assert(thrownError.message.includes(expectedError), 
        `Expected error message to include "${expectedError}", but got "${thrownError.message}"`);
    } else if (expectedError instanceof RegExp) {
      assert(expectedError.test(thrownError.message), 
        `Expected error message to match ${expectedError}, but got "${thrownError.message}"`);
    } else if (typeof expectedError === 'function') {
      assert(thrownError instanceof expectedError, 
        `Expected error to be instance of ${expectedError.name}, but got ${thrownError.constructor.name}`);
    }
  }

  return thrownError;
}

/**
 * 非同期関数がエラーをスローしないことをテストする
 */
export async function assertDoesNotThrow(fn) {
  try {
    return await fn();
  } catch (error) {
    assert.fail(`Expected function not to throw, but it threw: ${error.message}`);
  }
}

/**
 * 実行時間をテストする
 */
export async function assertExecutionTime(fn, maxMs, message = '') {
  const start = Date.now();
  await fn();
  const duration = Date.now() - start;
  
  assert(duration <= maxMs, 
    `${message} Expected execution time <= ${maxMs}ms, but took ${duration}ms`);
}

/**
 * オブジェクトが特定のプロパティを持つことをテストする
 */
export function assertHasProperties(obj, properties, message = '') {
  for (const prop of properties) {
    assert(prop in obj, `${message} Expected object to have property "${prop}"`);
  }
}

/**
 * 配列に特定の要素が含まれることをテストする
 */
export function assertArrayContains(array, expected, message = '') {
  assert(Array.isArray(array), `${message} Expected array, but got ${typeof array}`);
  
  if (Array.isArray(expected)) {
    for (const item of expected) {
      assert(array.includes(item), `${message} Expected array to contain "${item}"`);
    }
  } else {
    assert(array.includes(expected), `${message} Expected array to contain "${expected}"`);
  }
}

/**
 * 文字列が特定のパターンにマッチすることをテストする
 */
export function assertStringMatches(actual, pattern, message = '') {
  if (typeof pattern === 'string') {
    assert(actual.includes(pattern), 
      `${message} Expected string to include "${pattern}", but got "${actual}"`);
  } else if (pattern instanceof RegExp) {
    assert(pattern.test(actual), 
      `${message} Expected string to match ${pattern}, but got "${actual}"`);
  }
}

/**
 * 関数呼び出しの結果をキャッシュしてテストで再利用
 */
export class TestCache {
  constructor() {
    this.cache = new Map();
  }

  async getOrCreate(key, factory) {
    if (!this.cache.has(key)) {
      this.cache.set(key, await factory());
    }
    return this.cache.get(key);
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    return this.cache.delete(key);
  }
}

/**
 * テスト用のタイマーモック
 */
export class MockTimer {
  constructor() {
    this.time = 0;
    this.timers = [];
  }

  setTimeout(callback, delay) {
    const id = this.timers.length;
    this.timers.push({
      id,
      callback,
      triggerTime: this.time + delay,
      type: 'timeout'
    });
    return id;
  }

  clearTimeout(id) {
    this.timers = this.timers.filter(timer => timer.id !== id);
  }

  tick(ms) {
    this.time += ms;
    const triggeredTimers = this.timers.filter(timer => timer.triggerTime <= this.time);
    
    for (const timer of triggeredTimers) {
      timer.callback();
      if (timer.type === 'timeout') {
        this.clearTimeout(timer.id);
      }
    }
  }

  reset() {
    this.time = 0;
    this.timers = [];
  }
}

/**
 * テストスイート用のセットアップとティアダウン
 */
export class TestSuite {
  constructor(name) {
    this.name = name;
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
    this.beforeAllHooks = [];
    this.afterAllHooks = [];
  }

  beforeEach(fn) {
    this.beforeEachHooks.push(fn);
  }

  afterEach(fn) {
    this.afterEachHooks.push(fn);
  }

  beforeAll(fn) {
    this.beforeAllHooks.push(fn);
  }

  afterAll(fn) {
    this.afterAllHooks.push(fn);
  }

  async runBeforeAll() {
    for (const hook of this.beforeAllHooks) {
      await hook();
    }
  }

  async runAfterAll() {
    for (const hook of this.afterAllHooks) {
      await hook();
    }
  }

  async runBeforeEach() {
    for (const hook of this.beforeEachHooks) {
      await hook();
    }
  }

  async runAfterEach() {
    for (const hook of this.afterEachHooks) {
      await hook();
    }
  }
}

export default {
  assertThrows,
  assertDoesNotThrow,
  assertExecutionTime,
  assertHasProperties,
  assertArrayContains,
  assertStringMatches,
  TestCache,
  MockTimer,
  TestSuite
}; 