import { Tool } from '../../core/tool';
import { useLayersStore } from '../../../utils/storage/layers-store';

namespace Internal {
  export interface SetLayerClippingInput {
    index: number;
    clippingMask: boolean;
  }

  export const SET_LAYER_CLIPPING_METADATA = {
    name: 'set_layer_clipping',
    description: 'Set layer clipping mask',
    parameters: {
      type: 'object',
      properties: {
        index: { type: 'number', description: 'Layer index' },
        clippingMask: { type: 'boolean', description: 'Enable clipping' }
      },
      required: ['index', 'clippingMask']
    }
  } as const;

  export async function executeSetLayerClipping(args: SetLayerClippingInput): Promise<string> {
    const { index, clippingMask } = args;
    const layers = useLayersStore.getState().layers;

    if (index < 0 || index >= layers.length) {
      return 'no-op';
    }

    useLayersStore.getState().setLayerClippingMask(index, clippingMask);
    return 'layer_clipping_set';
  }
}

export const setLayerClippingTool: Tool<Internal.SetLayerClippingInput> = {
  name: 'set_layer_clipping',
  description: 'Set layer clipping mask',
  parameters: Internal.SET_LAYER_CLIPPING_METADATA.parameters,
  execute: Internal.executeSetLayerClipping
};
