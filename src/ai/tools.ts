import { Tool } from '../agent-module/types';
import { App } from 'obsidian';
import { addLayerFromPrompt } from './action/addLayerFromPrompt';
import { generatePsdFromPrompt } from './action/generatePsdFromPrompt';
import { editImageToAssets } from './action/imageEdit';
import { generateVideoToAssets } from './action/videoGeneration';
import { getCurrentAttachments } from './chat';
import { loadSettings } from '../settings/settings';

/**
 * グローバルから Plugin インスタンスを取得
 */
function getPlugin(): { app: App } | null {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (window as any).__psdPainterPlugin ?? null;
}



export const aiTools: Tool[] = [
  {
    name: 'generate_psd_from_prompt',
    description: '与えられたプロンプトから画像を生成し、その画像を用いて PSD を作成します。',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: '画像生成用のテキストプロンプト',
        },
        file_name: {
          type: 'string',
          description: '保存する画像ファイル名 (例: my_image.png)。省略時は自動命名',
        },
      },
      required: ['prompt'],
    },
    async execute(args: { prompt: string; file_name?: string }) {
      const plugin = getPlugin();
      if (!plugin) throw new Error('Plugin インスタンスが見つかりませんでした');
      return await generatePsdFromPrompt(plugin as any, args.prompt, args.file_name);
    },
  },
  {
    name: 'add_layer_from_prompt',
    description: 'プロンプトから画像を生成し、現在開いている PSD にレイヤーとして追加します。PSD がなければ新規作成します。',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: '画像生成用のテキストプロンプト',
        },
        layer_name: {
          type: 'string',
          description: '追加するレイヤー名（省略可）',
        },
        file_name: {
          type: 'string',
          description: '保存ファイル名（省略可）',
        },
      },
      required: ['prompt'],
    },
    async execute(args: { prompt: string; layer_name?: string; file_name?: string }) {
      const plugin = getPlugin();
      if (!plugin) throw new Error('Plugin インスタンスが見つかりませんでした');
      return await addLayerFromPrompt(plugin as any, args.prompt, args.layer_name, args.file_name);
    },
  },
  {
    name: 'edit_image_from_attachments',
    description: 'チャットに添付された画像やマスク、参照画像を用いて画像編集を行い、アセットフォルダに保存します。',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: '編集内容を指示するプロンプト' },
        file_name: { type: 'string', description: '保存する画像ファイル名（省略可）' },
      },
      required: ['prompt'],
    },
    async execute(args: { prompt: string; file_name?: string }) {
      const plugin = getPlugin();
      if (!plugin) throw new Error('Plugin インスタンスが見つかりませんでした');
      const attachments = getCurrentAttachments() as Array<{ url: string; data?: string; type: string }>;
      const img = attachments.find(a => a.type === 'image')?.data;
      const mask = attachments.find(a => a.type === 'mask')?.data;
      const ref = attachments.find(a => a.type === 'reference')?.data;
      const { apiKey } = await loadSettings(plugin as any);
      if (!apiKey) throw new Error('OpenAI APIキーが設定されていません');
      const file = await editImageToAssets({
        prompt: args.prompt,
        apiKey,
        app: plugin.app,
        fileName: args.file_name,
        image: img,
        mask,
        reference: ref,
      });
      return `画像を生成しました: ${file.path}`;
    },
  },
  {
    name: 'generate_video_from_prompt',
    description: 'プロンプトから動画を生成し、アセットフォルダに保存します。',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: '動画生成用のテキストプロンプト' },
        file_name: { type: 'string', description: '保存する動画ファイル名（省略可）' },
      },
      required: ['prompt'],
    },
    async execute(args: { prompt: string; file_name?: string }) {
      const plugin = getPlugin();
      if (!plugin) throw new Error('Plugin インスタンスが見つかりませんでした');
      const { apiKey } = await loadSettings(plugin as any);
      if (!apiKey) throw new Error('OpenAI APIキーが設定されていません');
      const file = await generateVideoToAssets(args.prompt, apiKey, plugin.app, args.file_name);
      return `動画を生成しました: ${file.path}`;
    },
  },
];
