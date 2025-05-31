import { Tool } from '../../core/tool';
import { App, TFile, normalizePath } from 'obsidian';
import { fal } from '@fal-ai/client';

namespace Internal {
  export interface GenerateImageInput {
    prompt: string;
    apiKey: string;
    app: App;
    fileName?: string;
  }

  export interface GenerateImageOutput {
    filePath: string;
    message: string;
  }

  export const GENERATE_IMAGE_METADATA = {
    name: 'generate_image',
    description: 'Generate image via AI and save to assets',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt text' },
        apiKey: { type: 'string', description: 'API key' },
        app: { type: 'object', description: 'Obsidian app instance' },
        fileName: { type: 'string', description: 'File name', nullable: true }
      },
      required: ['prompt', 'apiKey', 'app']
    }
  } as const;

  export async function executeGenerateImage(args: GenerateImageInput): Promise<string> {
    const { prompt, apiKey, app, fileName } = args;
    fal.config({ credentials: apiKey });
    const result = await fal.subscribe('fal-ai/flux-pro/kontext/max/multi', {
      input: {
        prompt,
        sync_mode: true,
        num_images: 1,
        output_format: 'png'
      }
    });
    const imageInfo = result?.data?.images?.[0];
    if (!imageInfo?.url) throw new Error('画像データが取得できませんでした');
    const res = await fetch(imageInfo.url);
    if (!res.ok) throw new Error('画像の取得に失敗しました');
    const bin = new Uint8Array(await res.arrayBuffer());

    const activeDir = app.workspace.getActiveFile()?.parent?.path || '';
    const folder = normalizePath(`${activeDir}/assets`);
    const ext = 'png';
    let baseName = fileName ?? `generated-${Date.now()}.${ext}`;
    if (!baseName.endsWith(`.${ext}`)) baseName += `.${ext}`;
    let fullPath = `${folder}/${baseName}`;
    try {
      if (!app.vault.getAbstractFileByPath(folder)) await app.vault.createFolder(folder);
    } catch {
      /* ignore */
    }
    let i = 1;
    while (app.vault.getAbstractFileByPath(fullPath)) {
      fullPath = `${folder}/${Date.now()}_${i}.${ext}`;
      i++;
    }
    const imageFile: TFile = await app.vault.createBinary(fullPath, bin);
    const result: GenerateImageOutput = {
      filePath: imageFile.path,
      message: `画像を生成しました: ${imageFile.path}`
    };
    return JSON.stringify(result);
  }
}

export const generateImageTool: Tool<Internal.GenerateImageInput> = {
  name: 'generate_image',
  description: 'Generate image via AI and save to assets',
  parameters: Internal.GENERATE_IMAGE_METADATA.parameters,
  execute: Internal.executeGenerateImage
};
