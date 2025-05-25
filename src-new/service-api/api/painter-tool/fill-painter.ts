import { Tool } from '../../core/tool';
import { useLayersStore } from '../../../obsidian-api/zustand/store/layers-store';
import { usePainterHistoryStore } from '../../../obsidian-api/zustand/store/painter-history-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';

interface Rect { x: number; y: number; width: number; height: number; }

namespace Internal {
  export interface FillPainterInput {
    color: string;
    rect?: Rect;
  }

  export const FILL_PAINTER_METADATA = {
    name: 'fill_painter',
    description: 'Fill area on all layers',
    parameters: {
      type: 'object',
      properties: {
        color: { type: 'string', description: 'fill color' },
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
      required: ['color']
    }
  } as const;

  export async function executeFillPainter(args: FillPainterInput): Promise<string> {
    const { color, rect } = args;
    const layersStore = useLayersStore.getState();
    const historyStore = usePainterHistoryStore.getState();
    const currentStore = useCurrentLayerIndexStore.getState();

    const layers = layersStore.layers;
    if (!layers || layers.length === 0) return 'no-op';

    historyStore.saveHistory(layers, currentStore.currentLayerIndex);

    for (const layer of layers) {
      const ctx = layer.canvas.getContext('2d');
      if (!ctx) continue;
      ctx.fillStyle = color;
      if (rect) {
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      } else {
        ctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
      }
    }

    layersStore.setLayers([...layers]);
    return 'filled';
  }
}

export const fillPainterTool: Tool<Internal.FillPainterInput> = {
  name: 'fill_painter',
  description: 'Fill area on all layers',
  parameters: Internal.FILL_PAINTER_METADATA.parameters,
  execute: Internal.executeFillPainter
};
