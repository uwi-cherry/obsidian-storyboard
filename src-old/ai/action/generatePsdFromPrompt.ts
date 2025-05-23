import MyPlugin from "main";
import { App, TFile } from "obsidian";
import { createPsd } from "src/painter/painter-files";
import { loadSettings } from "src/settings/settings";
import { generateImageToAssets } from "src/ai/action/imageGeneration";

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
  // API キー
  const { provider, falApiKey, replicateApiKey } = await loadSettings(plugin);
  const apiKey = provider === 'fal' ? falApiKey : replicateApiKey;
  if (!apiKey) throw new Error(`${provider} APIキーが設定されていません`);

  const imageFile: TFile = await generateImageToAssets(prompt, apiKey, provider, app, fileName);

  // ストーリーボードのディレクトリを取得
  const storyboardPath = app.workspace.getActiveFile()?.parent?.path || '';
  
  // PSD 作成
  await createPsd(app, imageFile, prompt, false, storyboardPath);
  return `プロンプト "${prompt}" から画像を生成し、PSD を作成しました: ${imageFile.path}`;
}
