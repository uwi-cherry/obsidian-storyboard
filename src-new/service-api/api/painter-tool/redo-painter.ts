import { Tool } from '../../core/tool';
import { usePainterHistoryStore } from '../../../obsidian-api/zustand/store/painter-history-store';
import { useLayersStore } from '../../../obsidian-api/zustand/store/layers-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';
import { useSelectionStateStore } from '../../../obsidian-api/zustand/store/selection-state-store';

namespace Internal {
  export interface RedoPainterInput {
    // パラメータは不要（グローバルストアを使用）
  }

  export const REDO_PAINTER_METADATA = {
    name: 'redo_painter',
    description: 'Redo painter view',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  } as const;

  export async function executeRedoPainter(args: RedoPainterInput): Promise<string> {
    const historyStore = usePainterHistoryStore.getState();
    
    if (!historyStore.canRedo()) {
      return 'no-redo-available';
    }
    
    const snapshot = historyStore.redo();
    if (snapshot) {
      // レイヤーストアを更新
      useLayersStore.getState().setLayers(snapshot.layers);
      useCurrentLayerIndexStore.getState().setCurrentLayerIndex(snapshot.currentLayerIndex);
      useSelectionStateStore.getState().applySnapshot(snapshot.selectionState);
      
      console.log('🔄 Redo実行:', {
        layersCount: snapshot.layers.length,
        currentLayerIndex: snapshot.currentLayerIndex,
        timestamp: new Date(snapshot.timestamp).toLocaleTimeString()
      });
      
      return 'redo-success';
    }
    
    return 'redo-failed';
  }
}

export const redoPainterTool: Tool<Internal.RedoPainterInput> = {
  name: 'redo_painter',
  description: 'Redo painter view',
  parameters: Internal.REDO_PAINTER_METADATA.parameters,
  execute: Internal.executeRedoPainter
};
