import { Tool } from '../../core/tool';
import { useLayersStore } from '../../../obsidian-api/zustand/storage/layers-store';

namespace Internal {
  export interface ToggleLayerVisibilityInput {
    index: number;
  }

  export const TOGGLE_LAYER_VISIBILITY_METADATA = {
    name: 'toggle_layer_visibility',
    description: 'Toggle layer visibility',
    parameters: {
      type: 'object',
      properties: {
        index: { type: 'number', description: 'Layer index' }
      },
      required: ['index']
    }
  } as const;

  export async function executeToggleLayerVisibility(args: ToggleLayerVisibilityInput): Promise<string> {
    const { index } = args;
    const layers = useLayersStore.getState().layers;
    
    if (index < 0 || index >= layers.length) {
      return 'no-op';
    }
    
    useLayersStore.getState().toggleLayerVisibility(index);
    
    return 'layer_visibility_toggled';
  }
}

export const toggleLayerVisibilityTool: Tool<Internal.ToggleLayerVisibilityInput> = {
  name: 'toggle_layer_visibility',
  description: 'Toggle layer visibility',
  parameters: Internal.TOGGLE_LAYER_VISIBILITY_METADATA.parameters,
  execute: Internal.executeToggleLayerVisibility
}; 
