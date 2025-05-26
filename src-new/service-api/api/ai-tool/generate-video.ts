import { App, TFile, normalizePath } from 'obsidian';

export async function generateVideoToAssets(
  prompt: string,
  apiKey: string,
  provider: 'fal' | 'replicate',
  app: App,
  fileName?: string,
): Promise<TFile> {
  const endpoint =
    provider === 'fal'
      ? 'https://api.fal.ai/v1/videos/generations'
      : 'https://api.example.com/v1/videos/generations';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: provider === 'fal' ? `Bearer ${apiKey}` : `Token ${apiKey}`,
    },
    body: JSON.stringify({ prompt, n: 1, response_format: 'b64_json' }),
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
  }
  let i = 1;
  while (app.vault.getAbstractFileByPath(fullPath)) {
    fullPath = `${folder}/${Date.now()}_${i}.${ext}`;
    i++;
  }
  const videoFile: TFile = await app.vault.createBinary(fullPath, bin);
  return videoFile;
}
