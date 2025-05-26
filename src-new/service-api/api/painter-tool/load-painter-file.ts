import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import * as agPsd from 'ag-psd';
import { Layer, PsdLayerData } from '../../../types/painter-types';

function toCanvas(obj: agPsd.Layer | { canvas?: HTMLCanvasElement; data?: Uint8ClampedArray }, width: number, height: number): HTMLCanvasElement {
  if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
    return obj as HTMLCanvasElement;
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  if (
    obj &&
    obj.canvas &&
    typeof HTMLCanvasElement !== 'undefined' &&
    obj.canvas instanceof HTMLCanvasElement
  ) {
    ctx.drawImage(obj.canvas, 0, 0);
  } else if (obj && obj.canvas && obj.canvas.data) {
    try {
      const imageData = new ImageData(
        new Uint8ClampedArray(obj.canvas.data), 
        obj.canvas.width || width, 
        obj.canvas.height || height
      );
      ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      console.error(error);
    }
  } else if (obj && obj.data) {
    try {
      const imageData = new ImageData(
        new Uint8ClampedArray(obj.data), 
        obj.width || width, 
        obj.height || height
      );
      ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      console.error(error);
    }
  } else {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
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

  function convertPsdLayerToCanvas(
    psdLayer: agPsd.Layer,
    defaultWidth: number,
    defaultHeight: number
  ): { canvas: HTMLCanvasElement; width: number; height: number } {
    const layerWidth = psdLayer.canvas?.width || psdLayer.width || defaultWidth;
    const layerHeight = psdLayer.canvas?.height || psdLayer.height || defaultHeight;
    
        
    return { canvas: toCanvas(psdLayer, layerWidth, layerHeight), width: layerWidth, height: layerHeight };
  }

export async function executeLoadPainterFile(args: LoadPainterFileInput): Promise<string> {
    const { app, file } = args;

    const buffer = await app.vault.readBinary(file);
    const psd = agPsd.readPsd(buffer);
      
            
      const layers: PsdLayerData[] = (psd.children || []).map((layer: agPsd.Layer, index: number) => {
                
        const converted = convertPsdLayerToCanvas(layer, psd.width, psd.height);
        const canvas = converted.canvas;
        const isDom = typeof HTMLCanvasElement !== 'undefined';
        
        let canvasDataUrl = '';
          if (isDom && canvas instanceof HTMLCanvasElement) {
          try {
            canvasDataUrl = canvas.toDataURL('image/png');
          } catch (error) {
            console.error(error);
          }
        }

        return {
          name: layer.name ?? `Layer ${index}`,
          visible: !layer.hidden,
          opacity: layer.opacity !== undefined ? layer.opacity : 1,
          blendMode: layer.blendMode ?? 'normal',
          clippingMask: layer.clipping ?? false,
          width: psd.width,
          height: psd.height,
          ...(isDom ? { canvasDataUrl } : { canvas: layer.canvas })
        };
      });
      
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
