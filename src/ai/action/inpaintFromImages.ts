import MyPlugin from "main";
import { App, TFile, normalizePath } from "obsidian";
import { PainterView } from "src/painter/view/painter-obsidian-view";
import { loadSettings } from "src/settings/settings";

/**
 * 指定した画像とマスクを使ってインペイントし、結果画像をPSDにレイヤーとして追加する。
 * @param plugin プラグインインスタンス
 * @param image インペイント元画像 File
 * @param mask マスク画像 File
 * @param prompt DALL·E 用プロンプト
 * @param layerName レイヤー名（省略可）
 * @param fileName 保存する画像ファイル名（省略可）
 */
export async function inpaintFromImages(
  plugin: MyPlugin,
  image: File,
  mask: File,
  prompt: string,
  layerName?: string,
  fileName?: string,
): Promise<string> {
  const app: App = plugin.app;
  const { apiKey } = await loadSettings(plugin);
  if (!apiKey) throw new Error('OpenAI APIキーが設定されていません');

  const form = new FormData();
  form.append('image', image, 'image.png');
  form.append('mask', mask, 'mask.png');
  form.append('prompt', prompt);
  form.append('n', '1');
  form.append('size', '1024x1024');
  form.append('response_format', 'b64_json');

  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });
  if (!res.ok) throw new Error(`OpenAI 画像編集APIエラー: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json as string | undefined;
  if (!b64) throw new Error('画像データが取得できませんでした');

  const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));

  const storyboardDir = app.workspace.getActiveFile()?.parent?.path || '';
  const folder = storyboardDir ? normalizePath(`${storyboardDir}/assets`) : 'assets';
  const ext = 'png';
  let baseName = fileName ?? `inpainted-${Date.now()}.${ext}`;
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
  const resultFile: TFile = await app.vault.createBinary(fullPath, bin);

  const view = app.workspace.getActiveViewOfType(PainterView);
  if (view) {
    const name = layerName ?? resultFile.basename;
    view.createNewLayer(name, resultFile);
    return `インペイント画像をレイヤー "${name}" として追加しました: ${fullPath}`;
  }
  return `PSDファイルが開かれていません。`;
}
