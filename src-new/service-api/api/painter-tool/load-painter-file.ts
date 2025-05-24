import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import * as agPsd from 'ag-psd';
import { Layer } from '../../../types/painter-types';

function toCanvas(obj: any, width: number, height: number): HTMLCanvasElement {
  if (typeof HTMLCanvasElement !== 'undefined' && obj instanceof HTMLCanvasElement) return obj;
  if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') return obj as HTMLCanvasElement;
  const canvas = document.createElement('canvas');
  canvas.width = obj?.width ?? width;
  canvas.height = obj?.height ?? height;
  const ctx = canvas.getContext('2d');
  if (ctx && obj?.data) {
    const imageData = new ImageData(new Uint8ClampedArray(obj.data), canvas.width, canvas.height);
    ctx.putImageData(imageData, 0, 0);
  }
  return canvas;
}

namespace Internal {
  export interface LoadPainterFileInput {
    app: App;
    file: TFile;
  }

  export const LOAD_PAINTER_FILE_METADATA = {
    name: 'load_painter_file',
    description: 'Load PSD file',
    parameters: {
      type: 'object',
      properties: {
        app: { type: 'object', description: 'Obsidian app instance' },
        file: { type: 'object', description: 'Target file' }
      },
      required: ['app', 'file']
    }
  } as const;

  function convertPsdLayerToCanvas(psdLayer: any): HTMLCanvasElement {
    return toCanvas(
      psdLayer.canvas ?? {},
      psdLayer.canvas?.width || 800,
      psdLayer.canvas?.height || 600
    );
  }

  export async function executeLoadPainterFile(args: LoadPainterFileInput): Promise<string> {
    const { app, file } = args;
    const buffer = await app.vault.readBinary(file);
    const psd = agPsd.readPsd(buffer);
    const layers: Layer[] = (psd.children || []).map((layer: any) => ({
      name: layer.name ?? '',
      visible: !layer.hidden,
      opacity: layer.opacity,
      blendMode: layer.blendMode,
      canvas: convertPsdLayerToCanvas(layer)
    }));
    const result = {
      width: psd.width,
      height: psd.height,
      layers
    };
    return JSON.stringify(result);
  }
}

export const loadPainterFileTool: Tool<Internal.LoadPainterFileInput> = {
  name: 'load_painter_file',
  description: 'Load PSD file',
  parameters: Internal.LOAD_PAINTER_FILE_METADATA.parameters,
  execute: Internal.executeLoadPainterFile
};
