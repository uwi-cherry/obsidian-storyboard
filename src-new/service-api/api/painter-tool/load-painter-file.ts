import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import * as agPsd from 'ag-psd';
import { Layer } from '../../../types/painter-types';

function toCanvas(obj: any, width: number, height: number): HTMLCanvasElement {
  // DOM環境でない場合はダミーのキャンバスオブジェクトを返す
  if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
    return obj as HTMLCanvasElement;
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  // ag-psdから取得したキャンバスデータがある場合
  if (
    obj &&
    obj.canvas &&
    typeof HTMLCanvasElement !== 'undefined' &&
    obj.canvas instanceof HTMLCanvasElement
  ) {
    // 既存のキャンバスからデータをコピー
    ctx.drawImage(obj.canvas, 0, 0);
  } else if (obj && obj.canvas && obj.canvas.data) {
    // ImageDataとしてデータがある場合
    try {
      const imageData = new ImageData(
        new Uint8ClampedArray(obj.canvas.data), 
        obj.canvas.width || width, 
        obj.canvas.height || height
      );
      ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      console.warn('ImageData作成エラー:', error);
    }
  } else if (obj && obj.data) {
    // 直接データがある場合
    try {
      const imageData = new ImageData(
        new Uint8ClampedArray(obj.data), 
        obj.width || width, 
        obj.height || height
      );
      ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      console.warn('ImageData作成エラー:', error);
    }
  } else {
    // データがない場合は白い背景で初期化
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
    psdLayer: any,
    defaultWidth: number,
    defaultHeight: number
  ): { canvas: HTMLCanvasElement; width: number; height: number } {
    const layerWidth = psdLayer.canvas?.width || psdLayer.width || defaultWidth;
    const layerHeight = psdLayer.canvas?.height || psdLayer.height || defaultHeight;
    
    console.log('🔍 convertPsdLayerToCanvas: レイヤー情報:', {
      name: psdLayer.name,
      hasCanvas: !!psdLayer.canvas,
      hasCanvasData: !!(psdLayer.canvas && psdLayer.canvas.data),
      width: layerWidth,
      height: layerHeight
    });
    
    return { canvas: toCanvas(psdLayer, layerWidth, layerHeight), width: layerWidth, height: layerHeight };
  }

  export async function executeLoadPainterFile(args: LoadPainterFileInput): Promise<string> {
    const { app, file } = args;
    
    try {
      const buffer = await app.vault.readBinary(file);
      const psd = agPsd.readPsd(buffer);
      
      console.log('🔍 PSD読み込み結果:', {
        width: psd.width,
        height: psd.height,
        childrenCount: psd.children?.length || 0
      });
      
      const layers: any[] = (psd.children || []).map((layer: any, index: number) => {
        console.log(`🔍 レイヤー ${index}:`, {
          name: layer.name,
          visible: !layer.hidden,
          opacity: layer.opacity,
          blendMode: layer.blendMode,
          hasCanvas: !!layer.canvas,
          canvasType: typeof layer.canvas
        });
        
        const converted = convertPsdLayerToCanvas(layer, psd.width, psd.height);
        const canvas = converted.canvas;
        const isDom = typeof HTMLCanvasElement !== 'undefined';
        console.log(
          '🔍 作成されたCanvas:',
          isDom && canvas instanceof HTMLCanvasElement ? 'HTMLCanvasElement' : typeof canvas
        );

        let canvasDataUrl = '';
        if (isDom && canvas instanceof HTMLCanvasElement) {
          try {
            canvasDataUrl = canvas.toDataURL('image/png');
            console.log('🔍 DataURL作成成功、長さ:', canvasDataUrl.length);
          } catch (error) {
            console.warn('🔍 DataURL作成エラー:', error);
          }
        }

        return {
          name: layer.name ?? `Layer ${index}`,
          visible: !layer.hidden,
          opacity: layer.opacity ?? 1,
          blendMode: layer.blendMode ?? 'normal',
          width: converted.width,
          height: converted.height,
          ...(isDom ? { canvasDataUrl } : { canvas: layer.canvas })
        };
      });
      
      const result = {
        width: psd.width,
        height: psd.height,
        layers
      };
      
      console.log('🔍 最終結果:', {
        width: result.width,
        height: result.height,
        layersCount: result.layers.length,
        firstLayerDataUrlLength: result.layers[0]?.canvasDataUrl?.length || 0
      });
      
      return JSON.stringify(result);
    } catch (error) {
      console.error('🔍 PSDファイル読み込みエラー:', error);
      throw error;
    }
  }
}

export const loadPainterFileTool: Tool<Internal.LoadPainterFileInput> = {
  name: 'load_painter_file',
  description: 'Load PSD file',
  parameters: Internal.LOAD_PAINTER_FILE_METADATA.parameters,
  execute: Internal.executeLoadPainterFile
};
