import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const sourceFile = path.resolve('src-new/react/hooks/useSelection.ts');
const tmpDir = fs.mkdtempSync(path.join(process.cwd(), 'test', 'tmp-selection-'));
const tmpFile = path.join(tmpDir, 'useSelection.mjs');

buildSync({
  entryPoints: [sourceFile],
  outfile: tmpFile,
  bundle: true,
  format: 'esm',
  platform: 'browser',
  sourcemap: 'inline'
});

global.Path2D = class { rect(){} moveTo(){} lineTo(){} };

test('computeMagicSelection でバウンディングボックスを取得', async () => {
  const mod = await import(tmpFile);
  const { computeMagicSelection } = mod;
  const canvas = {
    width: 2,
    height: 2,
    getContext: () => ({
      getImageData: () => ({
        data: new Uint8ClampedArray([
          255,0,0,255, 255,0,0,255,
          0,0,255,255, 0,0,255,255
        ])
      })
    })
  };
  const res = computeMagicSelection(canvas, 0, 0, 32);
  assert.deepEqual(res.bounding, { x:0, y:0, width:2, height:1 });
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
