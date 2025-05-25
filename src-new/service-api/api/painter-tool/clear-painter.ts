import { Tool } from '../../core/tool';
import { useLayersStore } from '../../../obsidian-api/zustand/store/layers-store';
import { usePainterHistoryStore } from '../../../obsidian-api/zustand/store/painter-history-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';

interface Rect { x: number; y: number; width: number; height: number; }

namespace Internal {
  export interface ClearPainterInput {
    rect?: Rect;
  }

  export const CLEAR_PAINTER_METADATA = {
    name: 'clear_painter',
    description: 'Clear area on all layers',
    parameters: {
      type: 'object',
      properties: {
        rect: {
          type: 'object',
          nullable: true,
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' }
          },
          required: ['x','y','width','height']
        }
      },
      required: []
    }
  } as const;

  export async function executeClearPainter(args: ClearPainterInput): Promise<string> {
    const { rect } = args;
    const layersStore = useLayersStore.getState();
    const historyStore = usePainterHistoryStore.getState();
    const currentStore = useCurrentLayerIndexStore.getState();

    const layers = layersStore.layers;
    if (!layers || layers.length === 0) return 'no-op';

    historyStore.saveHistory(layers, currentStore.currentLayerIndex);

    for (const layer of layers) {
      const ctx = layer.canvas.getContext('2d');
      if (!ctx) continue;
      if (rect) {
        ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
      } else {
        ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
      }
    }

    layersStore.setLayers([...layers]);
    return 'cleared';
  }
}

export const clearPainterTool: Tool<Internal.ClearPainterInput> = {
  name: 'clear_painter',
  description: 'Clear area on all layers',
  parameters: Internal.CLEAR_PAINTER_METADATA.parameters,
  execute: Internal.executeClearPainter
};
