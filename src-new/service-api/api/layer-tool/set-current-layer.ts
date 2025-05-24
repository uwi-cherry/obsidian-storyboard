import { Tool } from '../../core/tool';

namespace Internal {
  export interface SetCurrentLayerInput {
    view: any;
    index: number;
  }

  export const SET_CURRENT_LAYER_METADATA = {
    name: 'set_current_layer',
    description: 'Set current layer index in painter view',
    parameters: {
      type: 'object',
      properties: {
        view: { type: 'object', description: 'Painter view instance' },
        index: { type: 'number', description: 'Layer index to set as current' }
      },
      required: ['view', 'index']
    }
  } as const;

  export async function executeSetCurrentLayer(args: SetCurrentLayerInput): Promise<string> {
    const { view, index } = args;
    if (!Array.isArray(view.layers) || index < 0 || index >= view.layers.length) return 'no-op';
    
    view.currentLayerIndex = index;
    view.setCurrentLayerIndex?.(index);
    
    return 'current_layer_set';
  }
}

export const setCurrentLayerTool: Tool<Internal.SetCurrentLayerInput> = {
  name: 'set_current_layer',
  description: 'Set current layer index in painter view',
  parameters: Internal.SET_CURRENT_LAYER_METADATA.parameters,
  execute: Internal.executeSetCurrentLayer
}; 