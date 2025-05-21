import MyPlugin from "main";
import { App, TFile, normalizePath } from "obsidian";
import { PainterView } from "src/painter/view/painter-obsidian-view";
import { loadSettings } from "src/settings/settings";


/**
 * プロンプトから画像を生成し、アクティブな PSD に新規レイヤーとして追加するアクション。
 * PSD が開かれていない場合は新規 PSD を作成してそこへ追加。
 * @param plugin プラグインインスタンス
 * @param prompt 画像生成プロンプト
 * @param layerName レイヤー名（省略可）
 * @param fileName 保存する画像ファイル名（省略可）
 */
export async function addLayerFromPrompt(
  plugin: MyPlugin,
  prompt: string,
  layerName?: string,
  fileName?: string,
): Promise<string> {
  const app: App = plugin.app;
  // API キー
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

  const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));

  // 保存先フォルダ（ストーリーボードと同階層の assets フォルダ）
  const activeDir = app.workspace.getActiveFile()?.parent?.path || '';
  const folder = normalizePath(`${activeDir}/assets`);
  const ext = 'png';
  let baseName = fileName ?? `generated-${Date.now()}.${ext}`;
  if (!baseName.endsWith(`.${ext}`)) baseName += `.${ext}`;
  let fullPath = `${folder}/${baseName}`;
  try {
    if (!app.vault.getAbstractFileByPath(folder)) await app.vault.createFolder(folder);
  } catch (error) {
    console.error('Failed to create folder:', error);
  }
  let i = 1;
  while (app.vault.getAbstractFileByPath(fullPath)) {
    fullPath = `${folder}/${Date.now()}_${i}.${ext}`;
    i++;
  }
  const imageFile: TFile = await app.vault.createBinary(fullPath, bin);

  // 既存 PSD ビュー取得
  const view = app.workspace.getActiveViewOfType(PainterView);

  if (view) {
    // レイヤー名が無ければファイル basename
    const name = layerName ?? imageFile.basename;
    view.createNewLayer(name, imageFile);
    return `プロンプト "${prompt}" から画像を生成し、レイヤー "${name}" を追加しました。`;
  }
  // 開いていない場合はエラー
  return `PSDファイルが開かれていません。`;
} 