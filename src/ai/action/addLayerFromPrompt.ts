import MyPlugin from "main";
import { App, TFile } from "obsidian";
import { PainterView } from "src/painter/view/painter-obsidian-view";
import { loadSettings } from "src/settings/settings";
import { generateImageToAssets } from "src/ai/action/imageGeneration";


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

  const imageFile: TFile = await generateImageToAssets(prompt, apiKey, app, fileName);

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