import { Tool } from '../../core/tool';
import { App, TFile, normalizePath } from 'obsidian';

namespace Internal {
  export interface GenerateVideoInput {
    prompt: string;
    apiKey: string;
    provider: 'fal' | 'replicate';
    app: App;
    fileName?: string;
  }

  export interface GenerateVideoOutput {
    filePath: string;
    message: string;
  }

  export const GENERATE_VIDEO_METADATA = {
    name: 'generate_video',
    description: 'Generate video via AI and save to assets',
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

  export async function executeGenerateVideo(args: GenerateVideoInput): Promise<string> {
    const { prompt, apiKey, provider, app, fileName } = args;
    const endpoint = provider === 'fal'
      ? 'https://api.fal.ai/v1/videos/generations'
      : 'https://api.example.com/v1/videos/generations';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: provider === 'fal' ? `Bearer ${apiKey}` : `Token ${apiKey}`
      },
      body: JSON.stringify({ prompt, n: 1, response_format: 'b64_json' })
    });
    if (!res.ok) throw new Error(`${provider} 動画生成APIエラー: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json as string | undefined;
    if (!b64) throw new Error('動画データが取得できませんでした');
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));

    const activeDir = app.workspace.getActiveFile()?.parent?.path || '';
    const folder = normalizePath(`${activeDir}/assets`);
    const ext = 'mp4';
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
    const videoFile: TFile = await app.vault.createBinary(fullPath, bin);
    const result: GenerateVideoOutput = {
      filePath: videoFile.path,
      message: `動画を生成しました: ${videoFile.path}`
    };
    return JSON.stringify(result);
  }
}

export const generateVideoTool: Tool<Internal.GenerateVideoInput> = {
  name: 'generate_video',
  description: 'Generate video via AI and save to assets',
  parameters: Internal.GENERATE_VIDEO_METADATA.parameters,
  execute: Internal.executeGenerateVideo
};
