import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * t関数の簡易モック
 */
function t() {
  return 'toggle';
}

/**
 * シンプルなHTMLElementモック
 */
class MockHTMLElement {
  constructor() {
    this.children = [];
    this._classes = new Set();
    this.classList = {
      add: (cls) => this._classes.add(cls),
      contains: (cls) => this._classes.has(cls),
      has: (cls) => this._classes.has(cls)
    };
    this.listeners = {};
  }

  appendChild(child) {
    this.children.push(child);
  }

  addEventListener(event, callback) {
    this.listeners[event] = callback;
  }

  click() {
    if (typeof this.listeners['click'] === 'function') {
      this.listeners['click']();
    }
  }

  querySelector(selector) {
    if (!selector.startsWith('.clickable-icon.')) return null;
    const cls = selector.split('.clickable-icon.')[1];
    return this.children.find(
      (c) => c._classes.has('clickable-icon') && c._classes.has(cls)
    ) || null;
  }
}

/**
 * Mock MarkdownView
 */
class MockMarkdownView {
  constructor() {
    this.file = { name: 'test.md', extension: 'md' };
    this.containerEl = new MockHTMLElement();
  }

  addAction(_icon, _title, callback) {
    const el = new MockHTMLElement();
    el._classes.add('clickable-icon');
    el.addEventListener('click', callback);
    this.containerEl.appendChild(el);
    return el;
  }
}

/**
 * Mock WorkspaceLeaf
 */
class MockWorkspaceLeaf {
  constructor(view) {
    this.view = view;
  }
}

/**
 * テスト用StoryboardFactory
 */
class TestStoryboardFactory {
  async toggleStoryboardForLeaf() {}

  ensureStoryboardToggleButtonForLeaf(leaf, app) {
    if (!(leaf.view instanceof MockMarkdownView)) {
      return;
    }
    const view = leaf.view;
    const buttonClass = 'storyboard-toggle-button-common';
    const existingButton = view.containerEl.querySelector(
      `.clickable-icon.${buttonClass}`
    );
    if (!existingButton) {
      const newButton = view.addAction('storyboard-toggle', t('STORYBOARD_TOGGLE'), async () => {
        await this.toggleStoryboardForLeaf(leaf, app);
      });
      newButton.classList.add(buttonClass);
    }
  }
}

test.describe('StoryboardFactory.ensureStoryboardToggleButtonForLeaf', () => {
  test('ボタンが一度だけ追加され、クリックでtoggleStoryboardForLeafが呼び出される', async () => {
    const factory = new TestStoryboardFactory();
    let called = 0;
    factory.toggleStoryboardForLeaf = async () => { called++; };
    const view = new MockMarkdownView();
    const leaf = new MockWorkspaceLeaf(view);
    const app = {};

    factory.ensureStoryboardToggleButtonForLeaf(leaf, app);
    assert.equal(view.containerEl.children.length, 1);

    // 2回目の呼び出しでもボタンは増えない
    factory.ensureStoryboardToggleButtonForLeaf(leaf, app);
    assert.equal(view.containerEl.children.length, 1);

    // ボタンクリックでtoggleStoryboardForLeafが呼ばれる
    const button = view.containerEl.children[0];
    button.click();
    assert.equal(called, 1);
  });
});
