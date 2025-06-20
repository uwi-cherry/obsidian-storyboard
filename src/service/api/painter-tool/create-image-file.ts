import { Tool } from '../../core/tool';
import { App, normalizePath, TFile } from 'obsidian';
import { useLayersStore } from '../../../storage/layers-store';

namespace Internal {
  export interface CreateImageFileInput {
    app: App;
    customFolderPath: string;
    fileName?: string;
  }

  export interface CreateImageFileOutput {
    filePath: string;
    message: string;
  }

  export const CREATE_IMAGE_FILE_METADATA = {
    name: 'create_image_file',
    description: 'Create image file from merged canvas',
    parameters: {
      type: 'object',
      properties: {
        app: { type: 'object', description: 'Obsidian app instance' },
        customFolderPath: { type: 'string', description: 'Custom folder path' },
        fileName: { type: 'string', description: 'File name without extension', nullable: true }
      },
      required: ['app', 'customFolderPath']
    }
  } as const;

  function dataUrlToUint8Array(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(',')[1];
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  }

  export async function executeCreateImageFile(args: CreateImageFileInput): Promise<string> {
    const { app, customFolderPath, fileName } = args;

    const { mergedCanvas } = useLayersStore.getState();
    if (!mergedCanvas) {
      throw new Error('No merged canvas available');
    }

    const dataUrl = mergedCanvas.toDataURL('image/png');
    const bin = dataUrlToUint8Array(dataUrl);

    const folder = normalizePath(customFolderPath);
    try {
      if (!app.vault.getAbstractFileByPath(folder)) await app.vault.createFolder(folder);
    } catch {
      /* ignore */
    }
    
    const ext = 'png';
    const baseName = fileName ? `${fileName}.${ext}` : `${Date.now()}.${ext}`;
    let fullPath = normalizePath(`${folder}/${baseName}`);
    let i = 1;
    while (app.vault.getAbstractFileByPath(fullPath)) {
      const nameWithoutExt = fileName || Date.now().toString();
      fullPath = `${folder}/${nameWithoutExt}_${i}.${ext}`;
      i++;
    }
    
    const imageFile: TFile = await app.vault.createBinary(fullPath, bin);
    const result: CreateImageFileOutput = {
      filePath: imageFile.path,
      message: `画像を書き出しました: ${imageFile.path}`
    };
    return JSON.stringify(result);
  }
}

export const createImageFileTool: Tool<Internal.CreateImageFileInput> = {
  name: 'create_image_file',
  description: 'Create image file from merged canvas',
  parameters: Internal.CREATE_IMAGE_FILE_METADATA.parameters,
  execute: Internal.executeCreateImageFile
};

