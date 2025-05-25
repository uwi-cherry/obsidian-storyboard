import test from 'node:test';
import assert from 'node:assert/strict';
import esmock from 'esmock';
import { buildSync } from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';
import { createMockApp, createMockTFile } from '../utils/obsidian-mock.js';

// HTMLCanvasElement が未定義の環境でもテストできるようにダミーを設定
global.HTMLCanvasElement = class {};

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

  const expected = {
    width: 640,
    height: 480,
    layers: [
      { name: 'Layer1', visible: true, opacity: 1, blendMode: 'normal', canvasDataUrl: '', width: 640, height: 480 },
      { name: 'Layer2', visible: false, opacity: 0.5, blendMode: 'multiply', canvasDataUrl: '', width: 640, height: 480 }
    ]
  };

  assert.deepEqual(result, expected);

  // 一時ファイルを削除
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
