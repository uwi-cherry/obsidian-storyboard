import { App, TFile, normalizePath } from 'obsidian';

/**
 * 指定したプロンプトから Replicate API を使って画像を生成し、
 * アセットフォルダへ保存した TFile を返す。
 * @param prompt 画像生成プロンプト
 * @param apiKey Replicate API キー
 * @param app Obsidian アプリケーションインスタンス
 * @param fileName 保存するファイル名（省略可）
 */
export async function generateImageToAssets(
  prompt: string,
  apiKey: string,
  provider: 'fal' | 'replicate',
  app: App,
  fileName?: string,
): Promise<TFile> {
  const endpoint =
    provider === 'fal'
      ? 'https://api.fal.ai/v1/predictions'
      : 'https://api.replicate.com/v1/predictions';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: provider === 'fal' ? `Bearer ${apiKey}` : `Token ${apiKey}`,
    },
    body: JSON.stringify({
      version: 'stable-diffusion',
      input: { prompt },
    }),
  });
  if (!res.ok) throw new Error(`${provider} API エラー: ${res.status} ${await res.text()}`);
  const prediction = await res.json();

  // 完了するまでポーリング（簡易実装）
  let output: string | undefined;
  for (;;) {
    const check = await fetch(`${endpoint}/${prediction.id}`, {
      headers: { Authorization: provider === 'fal' ? `Bearer ${apiKey}` : `Token ${apiKey}` },
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
    // フォルダが既に存在する場合は無視
  }
  let i = 1;
  while (app.vault.getAbstractFileByPath(fullPath)) {
    fullPath = `${folder}/${Date.now()}_${i}.${ext}`;
    i++;
  }
  const imageFile: TFile = await app.vault.createBinary(fullPath, bin);
  return imageFile;
}
