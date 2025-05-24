import { Tool } from '../../core/tool';
import { GLOBAL_VARIABLE_KEYS } from '../../../constants/constants';

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
    
    if (!view) return 'no-view';

    try {
      // ビューからレイヤー情報を再取得
      const currentLayers = view.layers || [];
      const currentLayerIndex = view.currentLayerIndex || 0;

      // GlobalVariableManagerを更新して通知
      if (view.app && typeof window !== 'undefined') {
        const globalVariableManager = view.app.plugins?.plugins?.['obsidian-storyboard']?.globalVariableManager;
        if (globalVariableManager) {
          // レイヤー情報を更新
          globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.LAYERS, currentLayers);
          globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.CURRENT_LAYER_INDEX, currentLayerIndex);
          
          console.log('レイヤー表示をリフレッシュしました:', {
            layersCount: currentLayers.length,
            currentIndex: currentLayerIndex
          });
        }
      }

      // ビューの再描画を促す
      if (view.requestUpdate) {
        view.requestUpdate();
      }

      return 'layers_refreshed';
    } catch (error) {
      console.error('レイヤーリフレッシュでエラーが発生しました:', error);
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