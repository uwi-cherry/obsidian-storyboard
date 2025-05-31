import { Tool } from '../../core/tool';
import { App, TFile, normalizePath } from 'obsidian';

namespace Internal {
  function b64ToUint8Array(b64: string): Uint8Array {
    const data = b64.includes(',') ? b64.split(',')[1] : b64;
    return Uint8Array.from(atob(data), c => c.charCodeAt(0));
  }

  function b64ToFile(b64: string, name: string): File {
    return new File([b64ToUint8Array(b64)], name, { type: 'image/png' });
  }

  export interface InpaintImageInput {
    prompt: string;
    apiKey: string;
    app: App;
    fileName?: string;
    image?: string;
    mask?: string;
    reference?: string;
  }

  export interface InpaintImageOutput {
    filePath: string;
    message: string;
  }

  export const INPAINT_IMAGE_METADATA = {
    name: 'inpaint_image',
    description: 'Edit image with attachments and save to assets',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt text' },
        apiKey: { type: 'string', description: 'API key' },
        app: { type: 'object', description: 'Obsidian app instance' },
        fileName: { type: 'string', description: 'File name', nullable: true },
        image: { type: 'string', description: 'Base64 image', nullable: true },
        mask: { type: 'string', description: 'Base64 mask', nullable: true },
        reference: { type: 'string', description: 'Reference image', nullable: true }
      },
      required: ['prompt', 'apiKey', 'app']
    }
  } as const;

  export async function executeInpaintImage(args: InpaintImageInput): Promise<string> {
    const { prompt, apiKey, app, fileName, image, mask, reference } = args;
    const form = new FormData();
    form.append('prompt', prompt);
    form.append('n', '1');
    form.append('size', '1024x1024');
    form.append('response_format', 'b64_json');
    if (image) form.append('image', b64ToFile(image, 'image.png'));
    if (mask) form.append('mask', b64ToFile(mask, 'mask.png'));
    if (reference) form.append('reference_image', b64ToFile(reference, 'ref.png'));

    const endpoint = 'https://api.fal.ai/v1/predictions';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form
    });
    if (!res.ok) throw new Error(`fal.ai API エラー: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const b64 = data?.output?.[0] as string | undefined;
    if (!b64) throw new Error('画像データが取得できませんでした');

    const bin = b64ToUint8Array(b64);
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
    const result: InpaintImageOutput = {
      filePath: imageFile.path,
      message: `画像を生成しました: ${imageFile.path}`
    };
    return JSON.stringify(result);
  }
}

export const inpaintImageTool: Tool<Internal.InpaintImageInput> = {
  name: 'inpaint_image',
  description: 'Edit image with attachments and save to assets',
  parameters: Internal.INPAINT_IMAGE_METADATA.parameters,
  execute: Internal.executeInpaintImage
};
