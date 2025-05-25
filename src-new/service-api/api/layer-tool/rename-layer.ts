import { Tool } from '../../core/tool';
import { useLayersStore } from '../../../obsidian-api/zustand/store/layers-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';
import { usePainterHistoryStore } from '../../../obsidian-api/zustand/store/painter-history-store';

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
    const layersStore = useLayersStore.getState();
    const currentLayerIndexStore = useCurrentLayerIndexStore.getState();
    const historyStore = usePainterHistoryStore.getState();
    
    const layers = layersStore.layers;
    
    if (index < 0 || index >= layers.length) {
      return 'no-op';
    }
    
    // 操作前の状態を履歴に保存
    historyStore.saveHistory(layers, currentLayerIndexStore.currentLayerIndex);
    
    layersStore.renameLayer(index, name);
    
    console.log('📝 レイヤー名変更:', index, '->', name, '- 履歴保存済み');
    
    return 'layer_renamed';
  }
}

export const renameLayerTool: Tool<Internal.RenameLayerInput> = {
  name: 'rename_layer',
  description: 'Rename layer',
  parameters: Internal.RENAME_LAYER_METADATA.parameters,
  execute: Internal.executeRenameLayer
}; 