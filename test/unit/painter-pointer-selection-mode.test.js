import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';
import React from 'react';

const sourceFile = path.resolve('src-new/react/hooks/usePainterPointer.ts');
const tmpDir = fs.mkdtempSync(path.join(process.cwd(), 'test', 'tmp-pointer-'));
const tmpFile = path.join(tmpDir, 'usePainterPointer.mjs');

buildSync({
  entryPoints: [sourceFile],
  outfile: tmpFile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  external: ['react']
});

const { ReactCurrentDispatcher } = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

function withFakeDispatcher(fn) {
  const original = ReactCurrentDispatcher.current;
  const states = [];
  ReactCurrentDispatcher.current = {
    useState(initial) {
      const idx = states.length;
      const value = typeof initial === 'function' ? initial() : initial;
      states[idx] = value;
      const setter = (v) => {
        states[idx] = typeof v === 'function' ? v(states[idx]) : v;
      };
      return [states[idx], setter];
    }
  };
  try {
    return fn(states);
  } finally {
    ReactCurrentDispatcher.current = original;
  }
}

test('selectionMode が変更できる', async () => {
  const mod = await import(`file://${tmpFile}`);
  let pointer;
  withFakeDispatcher((states) => {
    pointer = mod.default();
    pointer.setSelectionMode('magic');
    assert.equal(states[3], 'magic');
  });
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
