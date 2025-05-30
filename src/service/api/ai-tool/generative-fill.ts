import { Tool } from '../../core/tool';
import { App, TFile } from 'obsidian';
import { toolRegistry } from '../../core/tool-registry';
import { useLayersStore } from 'src/storage/layers-store';
import { useCurrentLayerIndexStore } from 'src/store/current-layer-index-store';
import { usePainterHistoryStore } from 'src/store/painter-history-store';

namespace Internal {
  export interface GenerativeFillInput {
    prompt: string;
    apiKey: string;
    provider: 'fal' | 'replicate';
    app: App;
    image: string;
    mask: string;
    width: number;
    height: number;
  }

  export interface GenerativeFillOutput {
    filePath: string;
    message: string;
  }

  export const GENERATIVE_FILL_METADATA = {
    name: 'generative_fill',
    description: 'Generatively fill selected area using AI',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt text' },
        apiKey: { type: 'string', description: 'API key' },
        provider: { type: 'string', description: 'Service provider' },
        app: { type: 'object', description: 'Obsidian app instance' },
        image: { type: 'string', description: 'Base64 image' },
        mask: { type: 'string', description: 'Base64 mask' },
        width: { type: 'number', description: 'Canvas width' },
        height: { type: 'number', description: 'Canvas height' }
      },
      required: ['prompt', 'apiKey', 'provider', 'app', 'image', 'mask', 'width', 'height']
    }
  } as const;

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  export async function executeGenerativeFill(args: GenerativeFillInput): Promise<string> {
    const { prompt, apiKey, provider, app, image, mask, width, height } = args;

    const inpaintResultStr = await toolRegistry.executeTool('inpaint_image', {
      prompt,
      apiKey,
      provider,
      app,
      image,
      mask
    });
    const inpaintResult = JSON.parse(inpaintResultStr) as GenerativeFillOutput;

    const file = app.vault.getAbstractFileByPath(inpaintResult.filePath);
    if (!file || !(file instanceof TFile)) {
      throw new Error('生成画像ファイルが見つかりません');
    }
    const arrayBuffer = await app.vault.readBinary(file);
    const blob = new Blob([arrayBuffer]);
    const url = URL.createObjectURL(blob);
    const generatedImg = await loadImage(url);
    URL.revokeObjectURL(url);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');

    ctx.drawImage(generatedImg, 0, 0, width, height);

    const maskImg = await loadImage(mask);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(maskImg, 0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';

    const layer = { name: 'Generative Fill', visible: true, opacity: 1, blendMode: 'normal', canvas };

    const layersStore = useLayersStore.getState();
    const currentLayerIndexStore = useCurrentLayerIndexStore.getState();
    const historyStore = usePainterHistoryStore.getState();

    historyStore.saveHistory(layersStore.layers, currentLayerIndexStore.currentLayerIndex);
    layersStore.addLayer(layer);

    return JSON.stringify(inpaintResult);
  }
}

export const generativeFillTool: Tool<Internal.GenerativeFillInput> = {
  name: 'generative_fill',
  description: 'Generatively fill selected area using AI',
  parameters: Internal.GENERATIVE_FILL_METADATA.parameters,
  execute: Internal.executeGenerativeFill
};

