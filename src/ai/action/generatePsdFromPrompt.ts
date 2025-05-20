import MyPlugin from "main";
import { App, TFile } from "obsidian";
import { createPsd } from "src/painter/painter-files";
import { loadSettings } from "src/settings/settings";

/**
 * プロンプトから画像を生成し、その画像を用いて PSD を作成するアクション。
 * @param plugin プラグインインスタンス（設定取得用）
 * @param prompt DALL·E 用プロンプト
 * @param fileName 保存する画像ファイル名（省略可）
 */
export async function generatePsdFromPrompt(
  plugin: MyPlugin,
  prompt: string,
  fileName?: string,
): Promise<string> {
  const app: App = plugin.app;
  // OpenAI API キー
  const { apiKey } = await loadSettings(plugin);
  if (!apiKey) throw new Error('OpenAI APIキーが設定されていません');

  // 画像生成
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

  // base64 → Uint8Array
  const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));

  // Vault 保存
  const folder = 'Assets';
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

  // ストーリーボードのディレクトリを取得
  const storyboardPath = app.workspace.getActiveFile()?.parent?.path || '';
  
  // PSD 作成
  await createPsd(app, imageFile, prompt, false, storyboardPath);
  return `プロンプト "${prompt}" から画像を生成し、PSD を作成しました: ${fullPath}`;
} 