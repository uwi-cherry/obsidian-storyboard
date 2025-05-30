import { Tool } from '../../core/tool';
import { App, TFile, normalizePath } from 'obsidian';
import { Layer } from '../../../types/painter-types';

namespace Internal {
  export interface ExportMergedImageInput {
    app: App;
    file: TFile;
    layers: Layer[];
  }

  export interface ExportMergedImageOutput {
    filePath: string;
    message: string;
  }

  export const EXPORT_MERGED_IMAGE_METADATA = {
    name: 'export_merged_image',
    description: 'Export merged image as PNG',
    parameters: {
      type: 'object',
      properties: {
        app: { type: 'object', description: 'Obsidian app instance' },
        file: { type: 'object', description: 'Source PSD file' },
        layers: { type: 'array', description: 'Layer data' }
      },
      required: ['app', 'file', 'layers']
    }
  } as const;

  export async function executeExportMergedImage(args: ExportMergedImageInput): Promise<string> {
    const { app, file, layers } = args;

    if (!layers || layers.length === 0) {
      throw new Error('No layers to export');
    }

    const width = layers[0].canvas.width;
    const height = layers[0].canvas.height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');

    ctx.clearRect(0, 0, width, height);

    for (const layer of layers) {
      if (layer.visible && layer.canvas) {
        try {
          ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1;
          const blend = layer.blendMode === 'normal' ? 'source-over' : layer.blendMode;
          ctx.globalCompositeOperation = blend as GlobalCompositeOperation;
          ctx.drawImage(layer.canvas, 0, 0);
        } catch (error) {
          console.error(error);
        }
      }
    }

    const dataUrl = canvas.toDataURL('image/png');
    const bin = Uint8Array.from(atob(dataUrl.split(',')[1]), c => c.charCodeAt(0));

    const folder = file.parent?.path || '';
    const baseName = file.basename;
    const ext = 'png';
    let exportName = `${baseName}.${ext}`;
    let exportPath = folder ? `${folder}/${exportName}` : exportName;
    exportPath = normalizePath(exportPath);
    let counter = 1;
    while (app.vault.getAbstractFileByPath(exportPath)) {
      exportName = `${baseName}-${counter}.${ext}`;
      exportPath = folder ? `${folder}/${exportName}` : exportName;
      exportPath = normalizePath(exportPath);
      counter++;
    }

    const newFile = await app.vault.createBinary(exportPath, bin);
    const result: ExportMergedImageOutput = {
      filePath: newFile.path,
      message: `画像を書き出しました: ${newFile.path}`
    };

    return JSON.stringify(result);
  }
}

export const exportMergedImageTool: Tool<Internal.ExportMergedImageInput> = {
  name: 'export_merged_image',
  description: 'Export merged image as PNG',
  parameters: Internal.EXPORT_MERGED_IMAGE_METADATA.parameters,
  execute: Internal.executeExportMergedImage
};
