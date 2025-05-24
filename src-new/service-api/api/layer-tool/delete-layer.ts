import { Tool } from '../../core/tool';
import { GLOBAL_VARIABLE_KEYS } from '../../../constants/constants';
import { useLayersStore } from '../../../obsidian-api/zustand/store/layers-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';

namespace Internal {
  export interface DeleteLayerInput {
    view: any;
    index: number;
  }

  export const DELETE_LAYER_METADATA = {
    name: 'delete_layer',
    description: 'Delete layer from painter view',
    parameters: {
      type: 'object',
      properties: {
        view: { type: 'object', description: 'Painter view instance' },
        index: { type: 'number', description: 'Layer index to delete' }
      },
      required: ['view', 'index']
    }
  } as const;

  export async function executeDeleteLayer(args: DeleteLayerInput): Promise<string> {
    const { view, index } = args;
    if (!Array.isArray(view.layers) || view.layers.length <= 1 || index < 0 || index >= view.layers.length) return 'no-op';
    
    const newLayers = [...view.layers];
    newLayers.splice(index, 1);
    
    let newCurrentIndex = view.currentLayerIndex;
    if (newCurrentIndex >= newLayers.length) {
      newCurrentIndex = newLayers.length - 1;
    }
    
    view.layers = newLayers;
    view.currentLayerIndex = newCurrentIndex;
    view.setLayers?.(newLayers);
    view.setCurrentLayerIndex?.(newCurrentIndex);
    view.saveHistory?.();

    // zustand ストアを更新
    useLayersStore.getState().setLayers(newLayers);
    useCurrentLayerIndexStore.getState().setCurrentLayerIndex(newCurrentIndex);
    
    return 'layer_deleted';
  }
}

export const deleteLayerTool: Tool<Internal.DeleteLayerInput> = {
  name: 'delete_layer',
  description: 'Delete layer from painter view',
  parameters: Internal.DELETE_LAYER_METADATA.parameters,
  execute: Internal.executeDeleteLayer
};
