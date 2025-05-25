import { Tool } from '../../core/tool';
import { usePainterHistoryStore } from '../../../obsidian-api/zustand/store/painter-history-store';
import { useLayersStore } from '../../../obsidian-api/zustand/storage/layers-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';

namespace Internal {
  export interface UndoPainterInput {
    // パラメータは不要（グローバルストアを使用）
  }

  export const UNDO_PAINTER_METADATA = {
    name: 'undo_painter',
    description: 'Undo current painter view',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  } as const;

  export async function executeUndoPainter(args: UndoPainterInput): Promise<string> {
    const historyStore = usePainterHistoryStore.getState();
    
    if (!historyStore.canUndo()) {
      return 'no-undo-available';
    }
    
    const snapshot = historyStore.undo();
    if (snapshot) {
      // レイヤーストアを更新
      useLayersStore.getState().setLayers(snapshot.layers);
      useCurrentLayerIndexStore.getState().setCurrentLayerIndex(snapshot.currentLayerIndex);
      
      return 'undo-success';
    }
    
    return 'undo-failed';
  }
}

export const undoPainterTool: Tool<Internal.UndoPainterInput> = {
  name: 'undo_painter',
  description: 'Undo current painter view',
  parameters: Internal.UNDO_PAINTER_METADATA.parameters,
  execute: Internal.executeUndoPainter
};
