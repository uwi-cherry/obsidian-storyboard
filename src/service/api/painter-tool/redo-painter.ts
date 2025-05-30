import { Tool } from '../../core/tool';
import { usePainterHistoryStore } from '../../../utils/store/painter-history-store';
import { useLayersStore } from '../../../utils/storage/layers-store';
import { useCurrentLayerIndexStore } from '../../../utils/store/current-layer-index-store';

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
