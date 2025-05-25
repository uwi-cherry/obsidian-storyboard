import test from 'node:test';
import assert from 'node:assert/strict';
import esmock from 'esmock';
import { buildSync } from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';
import { createMockApp, createMockTFile } from '../utils/obsidian-mock.js';

// TypeScriptソースを一時的にビルドしてESMとして読み込む
const sourceFile = path.resolve('src-new/service-api/api/painter-tool/load-painter-file.ts');
const tmpDir = fs.mkdtempSync(path.join(process.cwd(), 'test', 'tmp-load-painter-'));
const tmpFile = path.join(tmpDir, 'load-painter-file.mjs');
buildSync({
  entryPoints: [sourceFile],
  outfile: tmpFile,
  bundle: true,
  external: ['ag-psd'],
  format: 'esm',
  platform: 'node',
  sourcemap: 'inline'
});

// Canvasが存在しない環境向けにダミーを定義
global.HTMLCanvasElement = class {};

// テスト本体

test('loadPainterFileTool.execute の戻り値が期待通り', async () => {
  const psdMock = {
    width: 640,
    height: 480,
    children: [
      { name: 'Layer1', hidden: false, opacity: 1, blendMode: 'normal', canvas: {} },
      { name: 'Layer2', hidden: true, opacity: 0.5, blendMode: 'multiply', canvas: {} }
    ]
  };

  const { loadPainterFileTool } = await esmock(tmpFile, {
    'ag-psd': { readPsd: () => psdMock }
  });

  const app = createMockApp();
  app.vault.readBinary = async () => new Uint8Array([1, 2, 3]);
  const file = createMockTFile('dummy.psd');

  const resultJson = await loadPainterFileTool.execute({ app, file });
  const result = JSON.parse(resultJson);

  assert.equal(result.width, 640);
  assert.equal(result.height, 480);
  assert.equal(result.layers.length, 2);
  assert.equal(result.layers[0].name, 'Layer1');
  assert.equal(result.layers[1].blendMode, 'multiply');

  // 一時ファイルを削除
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
