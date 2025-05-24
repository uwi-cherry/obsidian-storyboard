import { Tool } from '../../core/tool';
import { Layer } from '../../../types/painter-types';

namespace Internal {
  export interface DuplicateLayerInput {
    view: any;
    index: number;
  }

  export const DUPLICATE_LAYER_METADATA = {
    name: 'duplicate_layer',
    description: 'Duplicate layer in painter view',
    parameters: {
      type: 'object',
      properties: {
        view: { type: 'object', description: 'Painter view instance' },
        index: { type: 'number', description: 'Layer index to duplicate' }
      },
      required: ['view', 'index']
    }
  } as const;

  export async function executeDuplicateLayer(args: DuplicateLayerInput): Promise<string> {
    const { view, index } = args;
    if (!Array.isArray(view.layers) || index < 0 || index >= view.layers.length) return 'no-op';
    
    const layerToDuplicate = view.layers[index];
    const newCanvas = document.createElement('canvas');
    newCanvas.width = layerToDuplicate.canvas.width;
    newCanvas.height = layerToDuplicate.canvas.height;
    
    const newCtx = newCanvas.getContext('2d');
    if (newCtx) {
      newCtx.drawImage(layerToDuplicate.canvas, 0, 0);
    }
    
    const duplicatedLayer: Layer = {
      ...layerToDuplicate,
      name: `${layerToDuplicate.name} コピー`,
      canvas: newCanvas
    };
    
    const newLayers = [...view.layers];
    newLayers.splice(index + 1, 0, duplicatedLayer);
    
    view.layers = newLayers;
    view.currentLayerIndex = index + 1;
    view.setLayers?.(newLayers);
    view.setCurrentLayerIndex?.(index + 1);
    view.saveHistory?.();
    
    return 'layer_duplicated';
  }
}

export const duplicateLayerTool: Tool<Internal.DuplicateLayerInput> = {
  name: 'duplicate_layer',
  description: 'Duplicate layer in painter view',
  parameters: Internal.DUPLICATE_LAYER_METADATA.parameters,
  execute: Internal.executeDuplicateLayer
}; 