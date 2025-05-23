import { Tool } from '../../core/tool';

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
        index: { type: 'number', description: 'Layer index' }
      },
      required: ['view', 'index']
    }
  } as const;

  export async function executeDeleteLayer(args: DeleteLayerInput): Promise<string> {
    const { view, index } = args;
    if (!Array.isArray(view.layers) || view.layers.length <= index) return 'no-op';
    const newLayers = view.layers.slice();
    newLayers.splice(index, 1);
    if (newLayers.length === 0) return 'no-op';
    view.layers = newLayers;
    if (view.currentLayerIndex >= newLayers.length) {
      view.currentLayerIndex = newLayers.length - 1;
    }
    view.setLayers?.(newLayers);
    view.setCurrentLayerIndex?.(view.currentLayerIndex);
    view.saveHistory?.();
    return 'layer_deleted';
  }
}

export const deleteLayerTool: Tool<Internal.DeleteLayerInput> = {
  name: 'delete_layer',
  description: 'Delete layer from painter view',
  parameters: Internal.DELETE_LAYER_METADATA.parameters,
  execute: Internal.executeDeleteLayer
};
