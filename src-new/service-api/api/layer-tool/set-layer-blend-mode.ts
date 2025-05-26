import { Tool } from '../../core/tool';
import { useLayersStore } from '../../../zustand/storage/layers-store';

namespace Internal {
  export interface SetLayerBlendModeInput {
    index: number;
    blendMode: string;
  }

  export const SET_LAYER_BLEND_MODE_METADATA = {
    name: 'set_layer_blend_mode',
    description: 'Set layer blend mode',
    parameters: {
      type: 'object',
      properties: {
        index: { type: 'number', description: 'Layer index' },
        blendMode: { type: 'string', description: 'Blend mode (normal, multiply, screen, etc.)' }
      },
      required: ['index', 'blendMode']
    }
  } as const;

  export async function executeSetLayerBlendMode(args: SetLayerBlendModeInput): Promise<string> {
    const { index, blendMode } = args;
    const layers = useLayersStore.getState().layers;
    
    if (index < 0 || index >= layers.length) {
      return 'no-op';
    }
    
    useLayersStore.getState().setLayerBlendMode(index, blendMode);
    
    return 'layer_blend_mode_set';
  }
}

export const setLayerBlendModeTool: Tool<Internal.SetLayerBlendModeInput> = {
  name: 'set_layer_blend_mode',
  description: 'Set layer blend mode',
  parameters: Internal.SET_LAYER_BLEND_MODE_METADATA.parameters,
  execute: Internal.executeSetLayerBlendMode
}; 
