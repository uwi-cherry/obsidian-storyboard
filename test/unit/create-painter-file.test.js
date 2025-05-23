import test from 'node:test';
import assert from 'node:assert/strict';
import sinon from 'sinon';
import { createMockApp, createMockTFile } from '../utils/obsidian-mock.js';

// ag-psd をスタブするオブジェクト
const agPsd = {
  writePsd: sinon.stub()
};

// 簡易キャンバスモック
function setupDom(width = 100, height = 100) {
  const original = {
    document: global.document,
    Image: global.Image,
    URL: global.URL
  };

  global.document = {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () => ({
        fillStyle: '',
        fillRect: () => {},
        drawImage: () => {}
      })
    })
  };

  global.__imageWidth = width;
  global.__imageHeight = height;

  global.Image = class {
    constructor() {
      this.width = global.__imageWidth;
      this.height = global.__imageHeight;
      this.onload = null;
      this.onerror = null;
    }
    set src(value) {
      if (this.onload) this.onload();
    }
  };

  global.URL = {
    createObjectURL: () => 'blob:dummy',
    revokeObjectURL: () => {}
  };

  return original;
}

function restoreDom(original) {
  global.document = original.document;
  global.Image = original.Image;
  global.URL = original.URL;
}

const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

async function executeCreatePainterFile({ app, imageFile }) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');

  if (imageFile) {
    const data = await app.vault.readBinary(imageFile);
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    const img = await new Promise((resolve) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => resolve(im);
      im.src = url;
    });
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
  } else {
    canvas.width = DEFAULT_CANVAS_WIDTH;
    canvas.height = DEFAULT_CANVAS_HEIGHT;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const psdData = {
    width: canvas.width,
    height: canvas.height,
    children: [
      {
        name: imageFile ? imageFile.basename : 'Background',
        hidden: false,
        opacity: 1,
        blendMode: 'normal',
        canvas,
        left: 0,
        top: 0
      }
    ],
    canvas
  };

  const buffer = agPsd.writePsd(psdData, { generateThumbnail: false });

  let counter = 1;
  let fileName = `untitled-${counter}.psd`;
  while (app.vault.getAbstractFileByPath(fileName)) {
    counter++;
    fileName = `untitled-${counter}.psd`;
  }

  const file = await app.vault.createBinary(fileName, buffer);

  const result = {
    filePath: file.path,
    message: `PSDファイル「${fileName}」を作成しました`
  };

  return JSON.stringify(result);
}

test.describe('Create Painter File Tool', () => {
  let mockApp;
  let domBackup;

  test.beforeEach(() => {
    mockApp = createMockApp();
    domBackup = setupDom();
  });

  test.afterEach(() => {
    agPsd.writePsd.reset();
    sinon.restore();
    restoreDom(domBackup);
    mockApp.reset();
  });

  test('imageFileなしでPSDを作成', async () => {
    const buffer = new Uint8Array([1, 2, 3]);
    agPsd.writePsd.reset();
    agPsd.writePsd.returns(buffer);
    const createBinary = sinon.stub().resolves(createMockTFile('untitled-1.psd'));
    mockApp.vault.createBinary = createBinary;

    const result = await executeCreatePainterFile({ app: mockApp });
    const parsed = JSON.parse(result);

    assert.equal(parsed.filePath, 'untitled-1.psd');
    assert(createBinary.calledWith('untitled-1.psd', buffer));
    const psdArg = agPsd.writePsd.firstCall.args[0];
    assert.equal(psdArg.width, DEFAULT_CANVAS_WIDTH);
    assert.equal(psdArg.height, DEFAULT_CANVAS_HEIGHT);
    assert.equal(psdArg.children[0].name, 'Background');
  });

  test('imageFileありでPSDを作成', async () => {
    domBackup = setupDom(50, 40);
    const imageFile = createMockTFile('sample.png');
    const imageData = new Uint8Array([9, 8, 7]);
    agPsd.writePsd.reset();
    agPsd.writePsd.returns(imageData);
    mockApp.vault.readBinary = sinon.stub().resolves(imageData);
    const createBinary = sinon.stub().resolves(createMockTFile('untitled-1.psd'));
    mockApp.vault.createBinary = createBinary;

    const result = await executeCreatePainterFile({ app: mockApp, imageFile });
    const parsed = JSON.parse(result);

    assert.equal(parsed.filePath, 'untitled-1.psd');
    assert(mockApp.vault.readBinary.calledWith(imageFile));
    assert(createBinary.calledWith('untitled-1.psd', imageData));
    const psdArg = agPsd.writePsd.firstCall.args[0];
    assert.equal(psdArg.width, 50);
    assert.equal(psdArg.height, 40);
    assert.equal(psdArg.children[0].name, 'sample');
  });
});
