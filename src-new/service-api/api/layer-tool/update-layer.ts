import { Tool } from '../../core/tool';
import { Layer } from '../../../types/painter-types';
import { GLOBAL_VARIABLE_KEYS } from '../../../constants/constants';
import { useLayersStore } from '../../../obsidian-api/zustand/store/layers-store';

namespace Internal {
  export interface UpdateLayerInput {
    view: any;
    index: number;
    updates: Partial<Layer>;
  }

  export const UPDATE_LAYER_METADATA = {
    name: 'update_layer',
    description: 'Update layer properties in painter view',
    parameters: {
      type: 'object',
      properties: {
        view: { type: 'object', description: 'Painter view instance' },
        index: { type: 'number', description: 'Layer index' },
        updates: { type: 'object', description: 'Layer property updates' }
      },
      required: ['view', 'index', 'updates']
    }
  } as const;

  export async function executeUpdateLayer(args: UpdateLayerInput): Promise<string> {
    const { view, index, updates } = args;
    if (!Array.isArray(view.layers) || index < 0 || index >= view.layers.length) return 'no-op';
    
    const newLayers = [...view.layers];
    newLayers[index] = { ...newLayers[index], ...updates };
    
    view.layers = newLayers;
    view.setLayers?.(newLayers);
    view.saveHistory?.();

    // zustand ストアを更新
    useLayersStore.getState().setLayers(newLayers);
    
    return 'layer_updated';
  }
}

export const updateLayerTool: Tool<Internal.UpdateLayerInput> = {
  name: 'update_layer',
  description: 'Update layer properties in painter view',
  parameters: Internal.UPDATE_LAYER_METADATA.parameters,
  execute: Internal.executeUpdateLayer
}; 