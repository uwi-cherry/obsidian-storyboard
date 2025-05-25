import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';

// Create entry file that re-exports required modules
const tmpDir = fs.mkdtempSync(path.join(process.cwd(), 'test', 'tmp-undo-redo-'));
const entryFile = path.join(tmpDir, 'entry.ts');
fs.writeFileSync(entryFile, `
export { usePainterHistoryStore } from '../../src-new/obsidian-api/zustand/store/painter-history-store';
export { useLayersStore } from '../../src-new/obsidian-api/zustand/store/layers-store';
export { useCurrentLayerIndexStore } from '../../src-new/obsidian-api/zustand/store/current-layer-index-store';
export { useSelectionStateStore } from '../../src-new/obsidian-api/zustand/store/selection-state-store';
export { undoPainterTool } from '../../src-new/service-api/api/painter-tool/undo-painter';
export { redoPainterTool } from '../../src-new/service-api/api/painter-tool/redo-painter';
`);
const outFile = path.join(tmpDir, 'bundle.mjs');
buildSync({ entryPoints: [entryFile], outfile: outFile, bundle: true, format: 'esm', platform: 'node' });

const mod = await import(outFile);
const { usePainterHistoryStore, useLayersStore, useCurrentLayerIndexStore, useSelectionStateStore, undoPainterTool, redoPainterTool } = mod;

function createCanvas() {
  return { width: 100, height: 100, getContext: () => ({ drawImage: () => {} }) };
}

test('Undo/Redo で選択状態が復元される', async () => {
  const originalDocument = global.document;
  const originalCanvasCtor = global.HTMLCanvasElement;
  global.document = { createElement: () => createCanvas() };
  global.HTMLCanvasElement = function() {};

  const layerA = { name: 'A', visible: true, opacity: 1, blendMode: 'normal', canvas: createCanvas() };
  const layerB = { name: 'B', visible: true, opacity: 1, blendMode: 'normal', canvas: createCanvas() };

  useLayersStore.getState().setLayers([layerA]);
  useCurrentLayerIndexStore.getState().setCurrentLayerIndex(0);
  useSelectionStateStore.getState().setSelectionRect({ x: 1, y: 2, width: 10, height: 10 });
  usePainterHistoryStore.getState().saveHistory([layerA], 0);

  useLayersStore.getState().setLayers([layerB]);
  useSelectionStateStore.getState().setSelectionRect({ x: 5, y: 6, width: 20, height: 20 });
  usePainterHistoryStore.getState().saveHistory([layerB], 0);

  await undoPainterTool.execute({});
  assert.equal(useLayersStore.getState().layers[0].name, 'A');
  assert.deepEqual(useSelectionStateStore.getState().selectionRect, { x: 1, y: 2, width: 10, height: 10 });

  await redoPainterTool.execute({});
  assert.equal(useLayersStore.getState().layers[0].name, 'B');
  assert.deepEqual(useSelectionStateStore.getState().selectionRect, { x: 5, y: 6, width: 20, height: 20 });

  fs.rmSync(tmpDir, { recursive: true, force: true });
  global.document = originalDocument;
  if (originalCanvasCtor === undefined) {
    delete global.HTMLCanvasElement;
  } else {
    global.HTMLCanvasElement = originalCanvasCtor;
  }
});
