import { useLayersStore } from 'src/storage/layers-store';
import { useCurrentLayerIndexStore } from 'src/store/current-layer-index-store';
import { usePainterHistoryStore } from 'src/store/painter-history-store';
import { Tool } from '../../core/tool';

namespace Internal {
  export interface UndoPainterInput {
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
      useLayersStore.getState().updateLayers(snapshot.layers);
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
