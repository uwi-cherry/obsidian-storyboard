import { Tool } from '../../core/tool';
import { useLayersStore } from '../../../obsidian-api/zustand/store/layers-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';
import { usePainterHistoryStore } from '../../../obsidian-api/zustand/store/painter-history-store';

namespace Internal {
  export interface ApplySelectionTransformInput {
    canvas: HTMLCanvasElement;
    rect: { x: number; y: number; width: number; height: number };
    offsetX: number;
    offsetY: number;
    scale: number;
    rotation: number; // radians
    zoom: number;
  }

  export const APPLY_SELECTION_TRANSFORM_METADATA = {
    name: 'apply_selection_transform',
    description: 'Apply transformed selection to current layer',
    parameters: {
      type: 'object',
      properties: {
        canvas: { type: 'object' },
        rect: { type: 'object' },
        offsetX: { type: 'number' },
        offsetY: { type: 'number' },
        scale: { type: 'number' },
        rotation: { type: 'number' },
        zoom: { type: 'number' }
      },
      required: ['canvas', 'rect']
    }
  } as const;

  export async function executeApplySelectionTransform(
    args: ApplySelectionTransformInput
  ): Promise<string> {
    const { canvas, rect, offsetX, offsetY, scale, rotation, zoom } = args;

    const layersStore = useLayersStore.getState();
    const currentLayerIndexStore = useCurrentLayerIndexStore.getState();
    const historyStore = usePainterHistoryStore.getState();

    const layers = layersStore.layers;
    const currentLayerIndex = currentLayerIndexStore.currentLayerIndex;
    const layer = layers[currentLayerIndex];
    if (!layer) return 'no-layer';

    const ctx = layer.canvas.getContext('2d');
    if (!ctx) return 'no-context';

    // save history before applying
    historyStore.saveHistory(layers, currentLayerIndex);

    ctx.save();
    ctx.translate(
      rect.x + rect.width / 2 + offsetX / (zoom / 100),
      rect.y + rect.height / 2 + offsetY / (zoom / 100)
    );
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.drawImage(canvas, -rect.width / 2, -rect.height / 2);
    ctx.restore();

    // trigger update
    layersStore.setLayers([...layers]);

    return 'applied';
  }
}

export const applySelectionTransformTool: Tool<Internal.ApplySelectionTransformInput> = {
  name: 'apply_selection_transform',
  description: 'Apply transformed selection to current layer',
  parameters: Internal.APPLY_SELECTION_TRANSFORM_METADATA.parameters,
  execute: Internal.executeApplySelectionTransform
};
