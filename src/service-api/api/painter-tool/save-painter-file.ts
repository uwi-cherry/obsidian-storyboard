import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import * as agPsd from 'ag-psd';
import { Layer } from '../../../types/painter-types';

function ensureCanvas(layer: Layer, width: number, height: number): HTMLCanvasElement {
  if (typeof HTMLCanvasElement !== 'undefined' && layer.canvas instanceof HTMLCanvasElement) {
    return layer.canvas;
  }
  
  if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
    return layer.canvas as HTMLCanvasElement;
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = layer.canvas?.width ?? width;
  canvas.height = layer.canvas?.height ?? height;
  
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    layer.canvas = canvas;
    return canvas;
  }
  
  const src = layer.canvas as HTMLCanvasElement | { data?: Uint8ClampedArray };
  
  if (src?.data && src.data instanceof Uint8ClampedArray) {
    try {
      const imageData = new ImageData(src.data, canvas.width, canvas.height);
      ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  } else if (src && typeof src.getContext === 'function') {
    try {
      ctx.drawImage(src, 0, 0);
    } catch (error) {
      console.error(error);
    }
  } else {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  layer.canvas = canvas;
  return canvas;
}

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
    
    const first = ensureCanvas(layers[0], layers[0].canvas?.width || 800, layers[0].canvas?.height || 600);
    const width = first.width;
    const height = first.height;
    
    const composite = document.createElement('canvas');
    composite.width = width;
    composite.height = height;
    const ctx = composite.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');
    
    ctx.clearRect(0, 0, width, height);
    
    for (const layer of layers) {
      if (layer.visible && layer.canvas) {
        try {
          ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1;
          const blend = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode;
          ctx.globalCompositeOperation = blend as GlobalCompositeOperation;
          
          const canvas = ensureCanvas(layer, width, height);
        if (canvas instanceof HTMLCanvasElement) {
          ctx.drawImage(canvas, 0, 0);
        } else {
        }
      } catch (error) {
        console.error(error);
      }
      }
    }
    
    const psdData = {
      width,
      height,
      children: layers.map(l => {
        const c = ensureCanvas(l, width, height);
        return {
          name: l.name,
          canvas: c,
          hidden: !l.visible,
          opacity: l.opacity,
          blendMode: l.blendMode,
          clipping: l.clippingMask || false,
          left: 0,
          top: 0
        };
      }),
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
