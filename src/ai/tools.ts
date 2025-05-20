import { Tool } from '../agent-module/types';
import { App } from 'obsidian';
import { addLayerFromPrompt } from './action/addLayerFromPrompt';
import { generatePsdFromPrompt } from './action/generatePsdFromPrompt';

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
]; 