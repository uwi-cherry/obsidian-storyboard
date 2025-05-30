import { useLayersStore } from 'src/storage/layers-store';
import { useCurrentLayerIndexStore } from 'src/store/current-layer-index-store';
import { usePainterHistoryStore } from 'src/store/painter-history-store';
import { Tool } from '../../core/tool';

namespace Internal {
  export interface RedoPainterInput {
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
      useLayersStore.getState().updateLayers(snapshot.layers);
      useCurrentLayerIndexStore.getState().setCurrentLayerIndex(snapshot.currentLayerIndex);
      
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
