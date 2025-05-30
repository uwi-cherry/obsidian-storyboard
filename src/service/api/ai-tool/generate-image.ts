import { Tool } from '../../core/tool';
import { App, TFile, normalizePath } from 'obsidian';

namespace Internal {
  export interface GenerateImageInput {
    prompt: string;
    apiKey: string;
    provider: 'fal' | 'replicate';
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
        provider: { type: 'string', description: 'Service provider' },
        app: { type: 'object', description: 'Obsidian app instance' },
        fileName: { type: 'string', description: 'File name', nullable: true }
      },
      required: ['prompt', 'apiKey', 'provider', 'app']
    }
  } as const;

  export async function executeGenerateImage(args: GenerateImageInput): Promise<string> {
    const { prompt, apiKey, provider, app, fileName } = args;
    const endpoint = provider === 'fal'
      ? 'https://api.fal.ai/v1/predictions'
      : 'https://api.replicate.com/v1/predictions';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: provider === 'fal' ? `Bearer ${apiKey}` : `Token ${apiKey}`
      },
      body: JSON.stringify({ version: 'stable-diffusion', input: { prompt } })
    });
    if (!res.ok) throw new Error(`${provider} API エラー: ${res.status} ${await res.text()}`);
    const prediction = await res.json();

    let output: string | undefined;
    for (;;) {
      const check = await fetch(`${endpoint}/${prediction.id}`, {
        headers: { Authorization: provider === 'fal' ? `Bearer ${apiKey}` : `Token ${apiKey}` }
      });
      const status = await check.json();
      if (status.status === 'succeeded') {
        output = status.output[0];
        break;
      } else if (status.status === 'failed') {
        throw new Error('画像生成に失敗しました');
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    const b64 = output as string | undefined;
    if (!b64) throw new Error('画像データが取得できませんでした');
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));

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
