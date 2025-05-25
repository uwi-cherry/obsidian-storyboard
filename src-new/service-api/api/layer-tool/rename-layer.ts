import { Tool } from '../../core/tool';
import { useLayersStore } from '../../../obsidian-api/zustand/store/layers-store';

namespace Internal {
  export interface RenameLayerInput {
    index: number;
    name: string;
  }

  export const RENAME_LAYER_METADATA = {
    name: 'rename_layer',
    description: 'Rename layer',
    parameters: {
      type: 'object',
      properties: {
        index: { type: 'number', description: 'Layer index' },
        name: { type: 'string', description: 'New layer name' }
      },
      required: ['index', 'name']
    }
  } as const;

  export async function executeRenameLayer(args: RenameLayerInput): Promise<string> {
    const { index, name } = args;
    const layers = useLayersStore.getState().layers;
    
    if (index < 0 || index >= layers.length) {
      return 'no-op';
    }
    
    useLayersStore.getState().renameLayer(index, name);
    
    return 'layer_renamed';
  }
}

export const renameLayerTool: Tool<Internal.RenameLayerInput> = {
  name: 'rename_layer',
  description: 'Rename layer',
  parameters: Internal.RENAME_LAYER_METADATA.parameters,
  execute: Internal.executeRenameLayer
}; 