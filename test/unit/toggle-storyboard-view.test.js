import test from 'node:test';
import assert from 'node:assert/strict';
import sinon from 'sinon';
import { createMockApp } from '../utils/obsidian-mock.js';

class MarkdownView {
  constructor(file) {
    this.file = file;
  }
}

class WorkspaceLeaf {
  constructor(view) {
    this.view = view;
  }
}

async function executeToggleStoryboardView({ app, leaf, factory }) {
  if (!(leaf.view instanceof MarkdownView)) {
    return 'マークダウンビューではありません';
  }

  const view = leaf.view;
  const file = view.file;
  if (!file) {
    return 'ファイルがありません';
  }

  const currentMode = factory.getCurrentViewMode(leaf);

  if (currentMode === 'markdown') {
    if (file.extension !== 'storyboard') {
      const baseName = file.basename;
      let counter = 0;
      let newPath = `${baseName}.storyboard`;
      while (app.vault.getAbstractFileByPath(newPath) &&
             app.vault.getAbstractFileByPath(newPath) !== file) {
        counter += 1;
        newPath = `${baseName}-${counter}.storyboard`;
      }
      if (newPath !== file.path) {
        await app.vault.rename(file, newPath);
      }
    }
    await factory.switchToStoryboardViewMode(leaf, app);
    return 'ストーリーボードビューに切り替えました';
  } else {
    if (file.extension === 'storyboard') {
      const baseName = file.basename;
      let counter = 0;
      let newPath = `${baseName}.md`;
      while (app.vault.getAbstractFileByPath(newPath) &&
             app.vault.getAbstractFileByPath(newPath) !== file) {
        counter += 1;
        newPath = `${baseName}-${counter}.md`;
      }
      if (newPath !== file.path) {
        await app.vault.rename(file, newPath);
      }
    }
    factory.switchToMarkdownViewMode(leaf);
    return 'マークダウンビューに切り替えました';
  }
}

test.describe('Toggle Storyboard View Tool', () => {
  let app;

  test.beforeEach(() => {
    app = createMockApp();
  });

  test.afterEach(() => {
    sinon.restore();
    app.reset();
  });

  test('markdown -> storyboard への切り替え', async () => {
    const file = await app.vault.create('sample.md', '');
    const view = new MarkdownView(file);
    const leaf = new WorkspaceLeaf(view);

    const factory = {
      getCurrentViewMode: sinon.stub().returns('markdown'),
      switchToStoryboardViewMode: sinon.stub().resolves(),
      switchToMarkdownViewMode: sinon.stub()
    };

    const renameSpy = sinon.spy(app.vault, 'rename');

    const result = await executeToggleStoryboardView({ app, leaf, factory });

    assert.equal(result, 'ストーリーボードビューに切り替えました');
    assert.equal(renameSpy.callCount, 1);
    assert.equal(renameSpy.firstCall.args[1], 'sample.storyboard');
    assert.equal(factory.switchToStoryboardViewMode.callCount, 1);
  });

  test('storyboard -> markdown への切り替え', async () => {
    const file = await app.vault.create('sample.storyboard', '');
    file.extension = 'storyboard';
    const view = new MarkdownView(file);
    const leaf = new WorkspaceLeaf(view);

    const factory = {
      getCurrentViewMode: sinon.stub().returns('storyboard'),
      switchToStoryboardViewMode: sinon.stub().resolves(),
      switchToMarkdownViewMode: sinon.stub()
    };

    const renameSpy = sinon.spy(app.vault, 'rename');

    const result = await executeToggleStoryboardView({ app, leaf, factory });

    assert.equal(result, 'マークダウンビューに切り替えました');
    assert.equal(renameSpy.callCount, 1);
    assert.equal(renameSpy.firstCall.args[1], 'sample.md');
    assert.equal(factory.switchToMarkdownViewMode.callCount, 1);
  });
});
