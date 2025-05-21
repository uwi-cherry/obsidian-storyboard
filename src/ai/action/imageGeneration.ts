import { App, TFile, normalizePath } from 'obsidian';

/**
 * 指定したプロンプトから OpenAI 画像生成 API を使って画像を生成し、
 * アセットフォルダへ保存した TFile を返す。
 * @param prompt 画像生成プロンプト
 * @param apiKey OpenAI API キー
 * @param app Obsidian アプリケーションインスタンス
 * @param fileName 保存するファイル名（省略可）
 */
export async function generateImageToAssets(
  prompt: string,
  apiKey: string,
  app: App,
  fileName?: string,
): Promise<TFile> {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ prompt, n: 1, size: '1024x1024', response_format: 'b64_json' }),
  });
  if (!res.ok) throw new Error(`OpenAI 画像生成APIエラー: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json as string | undefined;
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
