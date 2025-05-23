import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockApp } from '../utils/obsidian-mock.js';
import { TestDataFactory } from '../test-config.js';
import ts from 'typescript';
import { readFile } from 'fs/promises';

async function importTool() {
  const source = await readFile(new URL('../../src-new/service-api/api/storyboard-tool/load-storyboard-data.ts', import.meta.url), 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const dataUrl = 'data:text/javascript;base64,' + Buffer.from(transpiled).toString('base64');
  return await import(dataUrl);
}

const { loadStoryboardDataTool } = await importTool();

test.describe('Load Storyboard Data Tool', () => {
  let mockApp;

  test.beforeEach(() => {
    mockApp = createMockApp();
  });

  test.afterEach(() => {
    mockApp.reset();
  });

  test('サンプルMarkdownを正しく解析する', async () => {
    const sampleContent = TestDataFactory.createStoryboardContent(2, 1);
    const file = await mockApp.vault.create('sample.storyboard', sampleContent);

    const result = await loadStoryboardDataTool.execute({ app: mockApp, file });
    const data = JSON.parse(result);

    assert.ok(Array.isArray(data.characters));
    assert.ok(data.characters.length > 0);
    assert.equal(data.characters[0].name, 'キャラクター1');
    assert.equal(data.chapters.length, 1);
    assert.equal(data.chapters[0].frames.length, 2);
    assert.equal(data.chapters[0].frames[0].speaker, 'キャラクター1');
  });

  test('空のファイルでは空データが返る', async () => {
    const file = await mockApp.vault.create('empty.storyboard', '');
    const result = await loadStoryboardDataTool.execute({ app: mockApp, file });
    const data = JSON.parse(result);

    assert.equal(data.characters.length, 0);
    assert.equal(data.chapters.length, 1);
    assert.equal(data.chapters[0].frames.length, 1);
    assert.equal(data.chapters[0].frames[0].speaker, '');
  });

  test('初期サンプル内容では空データが返る', async () => {
    const sampleContent = `### キャラクター\n#### 太郎\n- 説明\n  - 主人公。高校生。\n#### 花子\n- 説明\n  - ヒロイン。転校生。\n### 第1章\n#### 太郎\nあ、新しい転校生だ\n#### 花子\nはじめまして、田中花子です\n#### 太郎\nよろしく。僕は山田太郎だよ`;
    const file = await mockApp.vault.create('initial.storyboard', sampleContent);
    const result = await loadStoryboardDataTool.execute({ app: mockApp, file });
    const data = JSON.parse(result);

    assert.equal(data.characters.length, 0);
    assert.equal(data.chapters.length, 1);
    assert.equal(data.chapters[0].frames.length, 1);
    assert.equal(data.chapters[0].frames[0].speaker, '');
  });
});
