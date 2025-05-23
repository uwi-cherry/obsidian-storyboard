import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import * as agPsd from 'ag-psd';
import { Layer } from '../../../obsidian-api/painter/painter-types';

namespace Internal {
  export interface SavePainterFileInput {
    app: App;
    file: TFile;
    layers: Layer[];
  }

  export const SAVE_PAINTER_FILE_METADATA = {
    name: 'save_painter_file',
    description: 'Save PSD file',
    parameters: {
      type: 'object',
      properties: {
        app: { type: 'object', description: 'Obsidian app instance' },
        file: { type: 'object', description: 'Target file' },
        layers: { type: 'array', description: 'Layer data' }
      },
      required: ['app', 'file', 'layers']
    }
  } as const;

  export async function executeSavePainterFile(args: SavePainterFileInput): Promise<string> {
    const { app, file, layers } = args;
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
        ctx.globalCompositeOperation = blend as GlobalCompositeOperation;
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
    } as agPsd.Psd;
    const buffer = agPsd.writePsd(psdData, { generateThumbnail: false });
    await app.vault.modifyBinary(file, buffer);
    return 'saved';
  }
}

export const savePainterFileTool: Tool<Internal.SavePainterFileInput> = {
  name: 'save_painter_file',
  description: 'Save PSD file',
  parameters: Internal.SAVE_PAINTER_FILE_METADATA.parameters,
  execute: Internal.executeSavePainterFile
};
