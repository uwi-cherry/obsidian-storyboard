import { Tool } from '../../core/tool';
import { GLOBAL_VARIABLE_KEYS } from '../../../constants/constants';
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
    
    console.log('🔍 refresh_layers: ツール実行開始', { view: view ? 'あり' : 'なし' });
    
    if (!view) {
      console.log('🔍 refresh_layers: ビューがnullのため終了');
      return 'no-view';
    }

    try {
      // ビューからレイヤー情報を再取得
      const currentLayers = view.layers || [];
      const currentLayerIndex = view.currentLayerIndex || 0;

      console.log('🔍 refresh_layers: ビューから取得したデータ:', {
        layersCount: currentLayers.length,
        currentIndex: currentLayerIndex,
        hasApp: !!view.app
      });

      // zustandストアを更新して通知
      useLayersStore.getState().setLayers(currentLayers);
      useCurrentLayerIndexStore.getState().setCurrentLayerIndex(currentLayerIndex);

      console.log('🔍 refresh_layers: レイヤー表示をリフレッシュしました:', {
        layersCount: currentLayers.length,
        currentIndex: currentLayerIndex
      });

      // ビューの再描画を促す
      if (view.requestUpdate) {
        console.log('🔍 refresh_layers: ビューの再描画実行');
        view.requestUpdate();
      } else {
        console.log('🔍 refresh_layers: ビューにrequestUpdateメソッドがありません');
      }

      return 'layers_refreshed';
    } catch (error) {
      console.error('🔍 refresh_layers: レイヤーリフレッシュでエラーが発生しました:', error);
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