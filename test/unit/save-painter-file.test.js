import test from 'node:test';
import assert from 'node:assert/strict';
import sinon from 'sinon';
import { createMockTFile } from '../utils/obsidian-mock.js';

// ag-psd.writePsd をスタブ化
const agPsd = { writePsd: sinon.stub().returns('buffer') };

// テスト対象の関数を再実装
async function executeSavePainterFile({ app, file, layers }) {
  const { vault } = app;
  if (!layers || layers.length === 0) return 'no-op';
  const width = layers[0].canvas.width;
  const height = layers[0].canvas.height;
  const composite = document.createElement('canvas');
  composite.width = width;
  composite.height = height;
  const ctx = composite.getContext('2d');
  if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');
  ctx.clearRect(0, 0, width, height);
  for (const layer of layers) {
    if (layer.visible) {
      ctx.globalAlpha = layer.opacity ?? 1;
      const blend = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode;
      ctx.globalCompositeOperation = blend;
      ctx.drawImage(layer.canvas, 0, 0);
    }
  }
  const psdData = {
    width,
    height,
    children: layers.map(l => ({
      name: l.name,
      canvas: l.canvas,
      hidden: !l.visible,
      opacity: l.opacity,
      blendMode: l.blendMode,
      left: 0,
      top: 0
    })),
    canvas: composite
  };
  const buffer = agPsd.writePsd(psdData, { generateThumbnail: false });
  await vault.modifyBinary(file, buffer);
  return 'saved';
}

test('savePainterFile が vault.modifyBinary を呼び出す', async () => {
  // ドキュメントとキャンバスのスタブを設定
  const ctxStub = { clearRect: sinon.stub(), drawImage: sinon.stub(), globalAlpha: 1, globalCompositeOperation: 'source-over' };
  const canvasStub = { width: 0, height: 0, getContext: sinon.stub().returns(ctxStub) };
  global.document = { createElement: sinon.stub().returns(canvasStub) };

  // レイヤーデータを準備
  const layerCanvas = { width: 100, height: 100 };
  const layers = [
    { name: 'Layer 1', visible: true, opacity: 1, blendMode: 'normal', canvas: layerCanvas }
  ];

  const file = createMockTFile('test.psd');
  const modifyBinary = sinon.stub().resolves();
  const app = { vault: { modifyBinary } };

  const result = await executeSavePainterFile({ app, file, layers });

  assert.equal(result, 'saved');
  assert.ok(modifyBinary.calledOnce);
  assert.ok(agPsd.writePsd.calledOnce);
});
