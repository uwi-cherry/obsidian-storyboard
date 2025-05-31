import { Tool } from '../../core/tool';
import { fal } from '@fal-ai/client';
import { useLayersStore } from 'src/storage/layers-store';
import { useCurrentLayerIndexStore } from 'src/store/current-layer-index-store';
import { usePainterHistoryStore } from 'src/store/painter-history-store';

namespace Internal {
  export interface FluxMultiLayerInput {
    prompt: string;
    apiKey: string;
    imageUrls: string[];
  }

  export const FLUX_MULTI_LAYER_METADATA = {
    name: 'flux_multi_layer',
    description: 'Generate image via FLUX and add as layer',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt text' },
        apiKey: { type: 'string', description: 'API key' },
        imageUrls: { type: 'array', description: 'Images for prompt' }
      },
      required: ['prompt', 'apiKey']
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

  export async function executeFluxMultiLayer(args: FluxMultiLayerInput): Promise<string> {
    const { prompt, apiKey, imageUrls } = args;

    fal.config({ credentials: apiKey });
    const result = await fal.subscribe('fal-ai/flux-pro/kontext/max/multi', {
      input: { prompt, image_urls: imageUrls },
      logs: false
    });

    const url = result.data?.images?.[0]?.url;
    if (!url) throw new Error('画像生成に失敗しました');

    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const blob = new Blob([buf]);
    const tmp = URL.createObjectURL(blob);
    const img = await loadImage(tmp);
    URL.revokeObjectURL(tmp);

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2Dコンテキストの取得に失敗しました');
    ctx.drawImage(img, 0, 0);

    const layer = { name: 'Flux Image', visible: true, opacity: 1, blendMode: 'normal', canvas };

    const layersStore = useLayersStore.getState();
    const currentLayerIndexStore = useCurrentLayerIndexStore.getState();
    const historyStore = usePainterHistoryStore.getState();

    historyStore.saveHistory(layersStore.layers, currentLayerIndexStore.currentLayerIndex);
    layersStore.addLayer(layer);

    return JSON.stringify({ url });
  }
}

export const fluxMultiLayerTool: Tool<Internal.FluxMultiLayerInput> = {
  name: 'flux_multi_layer',
  description: 'Generate image via FLUX and add as layer',
  parameters: Internal.FLUX_MULTI_LAYER_METADATA.parameters,
  execute: Internal.executeFluxMultiLayer
};
