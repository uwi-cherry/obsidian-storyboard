import { Tool } from '../../core/tool';
import { useLayersStore } from '../../../obsidian-api/zustand/store/layers-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';

namespace Internal {
  export interface RefreshLayersInput {
    view: any;
  }

  export const REFRESH_LAYERS_METADATA = {
    name: 'refresh_layers',
    description: 'Refresh layer display when PSD file is opened or storyboard row is selected',
    parameters: {
      type: 'object',
      properties: {
        view: { type: 'object', description: 'Painter view instance' }
      },
      required: ['view']
    }
  } as const;

  export async function executeRefreshLayers(args: RefreshLayersInput): Promise<string> {
    const { view } = args;
    
    
    if (!view) {
      return 'no-view';
    }

    try {
      const currentLayers = view.layers || [];
      const currentLayerIndex = view.currentLayerIndex || 0;


      useLayersStore.getState().setLayers(currentLayers);
      useCurrentLayerIndexStore.getState().setCurrentLayerIndex(currentLayerIndex);


      if (view.requestUpdate) {
        view.requestUpdate();
      } else {
      }

      return 'layers_refreshed';
    } catch (error) {
      return 'refresh_failed';
    }
  }
}

export const refreshLayersTool: Tool<Internal.RefreshLayersInput> = {
  name: 'refresh_layers',
  description: 'Refresh layer display when PSD file is opened or storyboard row is selected',
  parameters: Internal.REFRESH_LAYERS_METADATA.parameters,
  execute: Internal.executeRefreshLayers
}; 