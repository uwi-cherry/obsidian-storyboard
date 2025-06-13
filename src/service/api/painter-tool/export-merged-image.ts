import { Tool } from '../../core/tool';
import { App, normalizePath, TFile } from 'obsidian';
import { Layer } from '../../../types/painter-types';
import { useExportSettingsStore } from '../../../store/export-settings-store';

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

  if (src && 'data' in src && src.data instanceof Uint8ClampedArray) {
    try {
      const imageData = new ImageData(src.data, canvas.width, canvas.height);
      ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  } else if (src && 'getContext' in src && typeof src.getContext === 'function') {
    try {
      ctx.drawImage(src as HTMLCanvasElement, 0, 0);
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
  export interface ExportMergedImageInput {
    app: App;
    layers: Layer[];
    customFolderPath: string;
    previewCanvas: HTMLCanvasElement;
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
        layers: { type: 'array', description: 'Layer data' },
        fileName: { type: 'string', description: 'File name', nullable: true }
      },
      required: ['app', 'layers']
    }
  } as const;

  function dataUrlToUint8Array(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(',')[1];
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  }

  export async function executeExportMergedImage(args: ExportMergedImageInput): Promise<string> {
    const { app, customFolderPath, previewCanvas } = args;

    const dataUrl = previewCanvas.toDataURL('image/png');
    const bin = dataUrlToUint8Array(dataUrl);

    const folder = normalizePath(customFolderPath);
    try {
      if (!app.vault.getAbstractFileByPath(folder)) await app.vault.createFolder(folder);
    } catch {
      /* ignore */
    }
    
    const ext = 'png';
    let baseName = `merged-${Date.now()}.${ext}`;
    let fullPath = normalizePath(`${folder}/${baseName}`);
    let i = 1;
    while (app.vault.getAbstractFileByPath(fullPath)) {
      fullPath = `${folder}/merged-${Date.now()}_${i}.${ext}`;
      i++;
    }
    
    const imageFile: TFile = await app.vault.createBinary(fullPath, bin);
    const result: ExportMergedImageOutput = {
      filePath: imageFile.path,
      message: `画像を書き出しました: ${imageFile.path}`
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

