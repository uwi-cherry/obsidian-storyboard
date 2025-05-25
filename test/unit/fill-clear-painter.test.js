import test from 'node:test';
import assert from 'node:assert/strict';
import sinon from 'sinon';

function createStore() {
  const layersState = { layers: [], setLayers(l) { this.layers = l; } };
  const currentState = { currentLayerIndex: 0 };
  const historyState = { history: [], saveHistory(layers, idx) { this.history.push({ layers, idx }); } };
  return {
    layersStore: { getState: () => layersState },
    currentStore: { getState: () => currentState },
    historyStore: { getState: () => historyState }
  };
}

function createLayer() {
  const ctx = { fillRect: sinon.stub(), clearRect: sinon.stub() };
  const canvas = { width: 100, height: 100, getContext: sinon.stub().returns(ctx) };
  return { name: 'layer', visible: true, opacity: 1, blendMode: 'normal', canvas, ctx };
}

async function executeFill({ color, rect }, stores) {
  const { layersStore, historyStore, currentStore } = stores;
  const layers = layersStore.getState().layers;
  if (!layers.length) return 'no-op';
  historyStore.getState().saveHistory(layers, currentStore.getState().currentLayerIndex);
  for (const layer of layers) {
    const ctx = layer.canvas.getContext('2d');
    if (!ctx) continue;
    ctx.fillStyle = color;
    if (rect) ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    else ctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
  }
  layersStore.getState().setLayers([...layers]);
  return 'filled';
}

async function executeClear({ rect }, stores) {
  const { layersStore, historyStore, currentStore } = stores;
  const layers = layersStore.getState().layers;
  if (!layers.length) return 'no-op';
  historyStore.getState().saveHistory(layers, currentStore.getState().currentLayerIndex);
  for (const layer of layers) {
    const ctx = layer.canvas.getContext('2d');
    if (!ctx) continue;
    if (rect) ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
    else ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
  }
  layersStore.getState().setLayers([...layers]);
  return 'cleared';
}

test('塗りつぶしツールで全レイヤーが更新される', async () => {
  const stores = createStore();
  const l1 = createLayer();
  const l2 = createLayer();
  stores.layersStore.getState().setLayers([l1, l2]);
  const rect = { x: 5, y: 6, width: 20, height: 10 };
  await executeFill({ color: '#fff', rect }, stores);
  assert(l1.ctx.fillRect.calledWith(rect.x, rect.y, rect.width, rect.height));
  assert(l2.ctx.fillRect.calledWith(rect.x, rect.y, rect.width, rect.height));
  assert.equal(stores.historyStore.getState().history.length, 1);
});

test('クリアツールで選択範囲無しの場合全体がクリアされる', async () => {
  const stores = createStore();
  const l1 = createLayer();
  const l2 = createLayer();
  stores.layersStore.getState().setLayers([l1, l2]);
  await executeClear({}, stores);
  assert(l1.ctx.clearRect.calledWith(0, 0, l1.canvas.width, l1.canvas.height));
  assert(l2.ctx.clearRect.calledWith(0, 0, l2.canvas.width, l2.canvas.height));
  assert.equal(stores.historyStore.getState().history.length, 1);
});
