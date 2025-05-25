import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import * as agPsd from 'ag-psd';

namespace Internal {
  
  export interface GenerateThumbnailInput {
    app: App;
    file: TFile;
  }

  export interface GenerateThumbnailOutput {
    thumbnailData: string | null;
    message: string;
  }

  export const GENERATE_THUMBNAIL_METADATA = {
    name: 'generate_thumbnail',
    description: 'Generate thumbnail from PSD file',
    parameters: {
      type: 'object',
      properties: {
        app: { type: 'object', description: 'Obsidian app instance' },
        file: { type: 'object', description: 'PSD file to generate thumbnail from' }
      },
      required: ['app', 'file']
    }
  } as const;

  export async function executeGenerateThumbnail(args: GenerateThumbnailInput): Promise<string> {
    const { app, file } = args;

    try {
      const buffer = await app.vault.readBinary(file);
      const psdData = agPsd.readPsd(buffer);

      if (!psdData.imageResources?.thumbnail) {
        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = psdData.width;
        compositeCanvas.height = psdData.height;
        const ctx = compositeCanvas.getContext('2d');
        if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');
        ctx.clearRect(0, 0, psdData.width, psdData.height);

        const layers = [...(psdData.children || [])].reverse();
        for (const layer of layers) {
          if (!layer.hidden) {
            ctx.globalAlpha = layer.opacity ?? 1;
            const blend = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode;
            ctx.globalCompositeOperation = blend as GlobalCompositeOperation;
            if (layer.canvas) {
              ctx.drawImage(layer.canvas, 0, 0);
            }
          }
        }

        const thumbnailCanvas = document.createElement('canvas');
        const thumbnailSize = 512;
        const scale = Math.min(thumbnailSize / psdData.width, thumbnailSize / psdData.height);
        thumbnailCanvas.width = psdData.width * scale;
        thumbnailCanvas.height = psdData.height * scale;
        const thumbnailCtx = thumbnailCanvas.getContext('2d');
        if (!thumbnailCtx) throw new Error('2Dコンテキストの取得に失敗しました');
        thumbnailCtx.drawImage(compositeCanvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

        const result: GenerateThumbnailOutput = {
          thumbnailData: thumbnailCanvas.toDataURL('image/jpeg', 0.8),
          message: 'サムネイル生成に成功しました'
        };
        return JSON.stringify(result);
      } else if (psdData.imageResources.thumbnail instanceof HTMLCanvasElement) {
        const result: GenerateThumbnailOutput = {
          thumbnailData: psdData.imageResources.thumbnail.toDataURL('image/jpeg'),
          message: 'サムネイル取得に成功しました'
        };
        return JSON.stringify(result);
      }

      const result: GenerateThumbnailOutput = {
        thumbnailData: null,
        message: 'サムネイルが見つかりませんでした'
      };
      return JSON.stringify(result);
    } catch (error) {
      const result: GenerateThumbnailOutput = {
        thumbnailData: null,
        message: 'サムネイル生成に失敗しました: ' + (error as Error).message
      };
      return JSON.stringify(result);
    }
  }
}

export const generateThumbnailTool: Tool<Internal.GenerateThumbnailInput> = {
  name: 'generate_thumbnail',
  description: 'Generate thumbnail from PSD file',
  parameters: Internal.GENERATE_THUMBNAIL_METADATA.parameters,
  execute: Internal.executeGenerateThumbnail
}; 
