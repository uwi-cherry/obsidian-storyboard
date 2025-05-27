import { Tool } from '../../core/tool';
import { useLayersStore } from '../../../zustand/storage/layers-store';

namespace Internal {
  export interface SetLayerOpacityInput {
    index: number;
    opacity: number;
  }

  export const SET_LAYER_OPACITY_METADATA = {
    name: 'set_layer_opacity',
    description: 'Set layer opacity',
    parameters: {
      type: 'object',
      properties: {
        index: { type: 'number', description: 'Layer index' },
        opacity: { type: 'number', description: 'Opacity value (0-1)' }
      },
      required: ['index', 'opacity']
    }
  } as const;

  export async function executeSetLayerOpacity(args: SetLayerOpacityInput): Promise<string> {
    const { index, opacity } = args;
    const layers = useLayersStore.getState().layers;
    
    if (index < 0 || index >= layers.length) {
      return 'no-op';
    }
    
    useLayersStore.getState().setLayerOpacity(index, opacity);
    
    return 'layer_opacity_set';
  }
}

export const setLayerOpacityTool: Tool<Internal.SetLayerOpacityInput> = {
  name: 'set_layer_opacity',
  description: 'Set layer opacity',
  parameters: Internal.SET_LAYER_OPACITY_METADATA.parameters,
  execute: Internal.executeSetLayerOpacity
}; 
