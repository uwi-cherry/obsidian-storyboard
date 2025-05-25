import { Tool } from '../../core/tool';
import { useLayersStore } from '../../../obsidian-api/zustand/storage/layers-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';
import { usePainterHistoryStore } from '../../../obsidian-api/zustand/store/painter-history-store';

namespace Internal {
  export interface RemoveLayerInput {
    index: number;
  }

  export const REMOVE_LAYER_METADATA = {
    name: 'remove_layer',
    description: 'Remove layer at specified index',
    parameters: {
      type: 'object',
      properties: {
        index: { type: 'number', description: 'Layer index to remove' }
      },
      required: ['index']
    }
  } as const;

  export async function executeRemoveLayer(args: RemoveLayerInput): Promise<string> {
    const { index } = args;
    const layersStore = useLayersStore.getState();
    const currentLayerIndexStore = useCurrentLayerIndexStore.getState();
    const historyStore = usePainterHistoryStore.getState();
    
    const layers = layersStore.layers;
    const currentLayerIndex = currentLayerIndexStore.currentLayerIndex;
    
    if (layers.length <= 1 || index < 0 || index >= layers.length) {
      return 'no-op';
    }
    
    // 操作前の状態を履歴に保存
    historyStore.saveHistory(layers, currentLayerIndex);
    
    // レイヤーを削除
    layersStore.removeLayer(index);
    
    // 現在のレイヤーインデックスを調整
    let newCurrentIndex = currentLayerIndex;
    if (newCurrentIndex >= layers.length - 1) {
      newCurrentIndex = layers.length - 2; // 削除後の長さに合わせる
    }
    currentLayerIndexStore.setCurrentLayerIndex(newCurrentIndex);
    
    
    return 'layer_removed';
  }
}

export const removeLayerTool: Tool<Internal.RemoveLayerInput> = {
  name: 'remove_layer',
  description: 'Remove layer at specified index',
  parameters: Internal.REMOVE_LAYER_METADATA.parameters,
  execute: Internal.executeRemoveLayer
}; 