import React, { useEffect, useState } from 'react';
import { t } from '../../../../constants/obsidian-i18n';
import { ADD_ICON_SVG, BUTTON_ICONS, TABLE_ICONS } from '../../../../constants/icons';
import { GLOBAL_VARIABLE_KEYS } from '../../../../constants/constants';
import { toolRegistry } from '../../../../service-api/core/tool-registry';

export default function LayerControls() {
  const [layers, setLayers] = useState<any[]>([]);
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
  const [globalVariableManager, setGlobalVariableManager] = useState<any>(null);
  const [painterView, setPainterView] = useState<any>(null);

  // GlobalVariableManagerを取得
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).app) {
      const app = (window as any).app;
      console.log('🔍 LayerControls: app:', app);
      console.log('🔍 LayerControls: app.plugins:', app.plugins);
      console.log('🔍 LayerControls: app.plugins.plugins:', app.plugins?.plugins);
      console.log('🔍 LayerControls: obsidian-storyboard plugin:', app.plugins?.plugins?.['obsidian-storyboard']);
      
      const manager = app.plugins?.plugins?.['obsidian-storyboard']?.globalVariableManager;
      console.log('🔍 LayerControls: GlobalVariableManager取得:', manager ? '成功' : '失敗');
      console.log('🔍 LayerControls: manager object:', manager);
      
      // 現在のglobal variableの値をチェック
      if (manager) {
        const currentLayers = manager.getVariable(GLOBAL_VARIABLE_KEYS.LAYERS);
        const currentLayerIndex = manager.getVariable(GLOBAL_VARIABLE_KEYS.CURRENT_LAYER_INDEX);
        const currentPainterView = manager.getVariable(GLOBAL_VARIABLE_KEYS.PAINTER_VIEW);
        
        console.log('🔍 LayerControls: 現在のグローバル変数:', {
          layers: currentLayers,
          layerIndex: currentLayerIndex,
          painterView: currentPainterView ? 'あり' : 'なし'
        });
      }
      
      setGlobalVariableManager(manager);
    }
  }, []);

  // レイヤー情報とペインタービューを監視
  useEffect(() => {
    if (!globalVariableManager) return;

    console.log('🔍 LayerControls: グローバル変数監視を開始');

    const unsubscribeLayers = globalVariableManager.subscribe(GLOBAL_VARIABLE_KEYS.LAYERS, (layersData: any[]) => {
      console.log('🔍 LayerControls: レイヤーデータ更新:', layersData);
      setLayers(layersData || []);
    });

    const unsubscribeIndex = globalVariableManager.subscribe(GLOBAL_VARIABLE_KEYS.CURRENT_LAYER_INDEX, (index: number) => {
      console.log('🔍 LayerControls: 現在のレイヤーインデックス更新:', index);
      setCurrentLayerIndex(index || 0);
    });

    const unsubscribeView = globalVariableManager.subscribe(GLOBAL_VARIABLE_KEYS.PAINTER_VIEW, (view: any) => {
      console.log('🔍 LayerControls: ペインタービュー更新:', view ? 'あり' : 'なし');
      setPainterView(view);
    });

    return () => {
      unsubscribeLayers();
      unsubscribeIndex();
      unsubscribeView();
    };
  }, [globalVariableManager]);

  // ストーリーボード行選択とPSDファイルを開いた時のリフレッシュ処理
  useEffect(() => {
    if (!globalVariableManager) return;

    console.log('🔍 LayerControls: リフレッシュ監視を開始');

    // ストーリーボード行選択時のリフレッシュ
    const unsubscribeSelectedRow = globalVariableManager.subscribe(GLOBAL_VARIABLE_KEYS.SELECTED_ROW_INDEX, (index: any) => {
      console.log('🔍 LayerControls: 行選択通知受信:', index);
      refreshLayerDisplay();
    });

    // PSDファイルを開いた時のリフレッシュ
    const unsubscribeCurrentFile = globalVariableManager.subscribe(GLOBAL_VARIABLE_KEYS.CURRENT_FILE, (file: any) => {
      console.log('🔍 LayerControls: ファイル変更通知受信:', file);
      if (file && file.path && file.path.endsWith('.psd')) {
        console.log('🔍 LayerControls: PSDファイルが開かれました、リフレッシュ実行');
        refreshLayerDisplay();
      }
    });

    return () => {
      unsubscribeSelectedRow();
      unsubscribeCurrentFile();
    };
  }, [globalVariableManager]);

  // レイヤー表示のリフレッシュ処理
  const refreshLayerDisplay = async () => {
    console.log('🔍 LayerControls: refreshLayerDisplay実行開始');
    let currentView = painterView;
    
    // painterViewがない場合はglobal-variable-managerから取得を試行
    if (!currentView && globalVariableManager) {
      currentView = globalVariableManager.getVariable(GLOBAL_VARIABLE_KEYS.PAINTER_VIEW);
      console.log('🔍 LayerControls: GlobalVariableManagerからビュー取得:', currentView ? 'あり' : 'なし');
    }
    
    if (!currentView) {
      console.log('🔍 LayerControls: ペインタービューが見つからないため、レイヤーリフレッシュをスキップします');
      return;
    }

    try {
      console.log('🔍 LayerControls: refresh_layersツール実行中...');
      // サービスAPIからレイヤー情報を再取得
      await toolRegistry.executeTool('refresh_layers', {
        view: currentView
      });
      
      console.log('🔍 LayerControls: レイヤー表示のリフレッシュが完了しました');
    } catch (error) {
      console.error('🔍 LayerControls: レイヤー表示のリフレッシュに失敗しました:', error);
    }
  };

  const addBlankLayer = async () => {
    if (!painterView) return;
    
    try {
      await toolRegistry.executeTool('add_layer', {
        view: painterView,
        name: `レイヤー ${layers.length + 1}`
      });
      
      // GlobalVariableManagerが自動的に更新を通知するので、
      // ここでは明示的に状態を更新する必要はありません
    } catch (error) {
      console.error('レイヤー追加に失敗しました:', error);
    }
  };

  const deleteCurrentLayer = async () => {
    if (!painterView || layers.length <= 1) return;
    
    try {
      await toolRegistry.executeTool('delete_layer', {
        view: painterView,
        index: currentLayerIndex
      });
    } catch (error) {
      console.error('レイヤー削除に失敗しました:', error);
    }
  };

  const toggleVisibility = async (index: number) => {
    if (!painterView) return;
    
    try {
      const layer = layers[index];
      await toolRegistry.executeTool('update_layer', {
        view: painterView,
        index,
        updates: { visible: !layer.visible }
      });
    } catch (error) {
      console.error('レイヤー表示切り替えに失敗しました:', error);
    }
  };

  const renameLayer = async (index: number) => {
    if (!painterView) return;
    
    const newName = prompt(t('ENTER_LAYER_NAME') || 'レイヤー名を入力', layers[index].name);
    if (newName && newName !== layers[index].name) {
      try {
        await toolRegistry.executeTool('update_layer', {
          view: painterView,
          index,
          updates: { name: newName }
        });
      } catch (error) {
        console.error('レイヤー名変更に失敗しました:', error);
      }
    }
  };

  const changeOpacity = async (opacity: number) => {
    if (!painterView) return;
    
    try {
      await toolRegistry.executeTool('update_layer', {
        view: painterView,
        index: currentLayerIndex,
        updates: { opacity: opacity / 100 }
      });
    } catch (error) {
      console.error('不透明度変更に失敗しました:', error);
    }
  };

  const changeBlendMode = async (blendMode: string) => {
    if (!painterView) return;
    
    try {
      await toolRegistry.executeTool('update_layer', {
        view: painterView,
        index: currentLayerIndex,
        updates: { blendMode }
      });
    } catch (error) {
      console.error('ブレンドモード変更に失敗しました:', error);
    }
  };

  const selectLayer = async (index: number) => {
    if (!painterView) return;
    
    try {
      await toolRegistry.executeTool('set_current_layer', {
        view: painterView,
        index
      });
    } catch (error) {
      console.error('レイヤー選択に失敗しました:', error);
    }
  };

  if (layers.length === 0) {
    return (
      <div className="p-2 border-b border-modifier-border">
        <div className="text-text-muted text-sm">
          レイヤーがありません
        </div>
        <div className="text-text-muted text-xs mt-1">
          デバッグ情報:
          <br />• GlobalVariableManager: {globalVariableManager ? '利用可能' : '利用不可'}
          <br />• PainterView: {painterView ? '利用可能' : '利用不可'}
          <br />• Layers配列: {JSON.stringify(layers)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 border-b border-modifier-border">
      <div className="text-text-normal text-sm mb-2 pb-1 border-b border-modifier-border">
        {t('LAYERS') || 'レイヤー'}
      </div>

      {/* レイヤー操作ボタン */}
      <div className="flex items-center gap-2 mb-2">
        <button
          className="p-1 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
          onClick={addBlankLayer}
          title={t('NEW_LAYER') || '新しいレイヤー'}
          dangerouslySetInnerHTML={{ __html: ADD_ICON_SVG }}
        />
        <button
          className="p-1 bg-primary border border-modifier-border text-text-normal rounded cursor-pointer hover:bg-modifier-hover flex items-center justify-center"
          onClick={deleteCurrentLayer}
          title={t('DELETE_LAYER') || 'レイヤーを削除'}
          dangerouslySetInnerHTML={{ __html: TABLE_ICONS.delete }}
        />
      </div>

      {/* 不透明度とブレンドモード */}
      {layers[currentLayerIndex] && (
        <div className="flex items-center gap-2 mb-2">
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round((layers[currentLayerIndex]?.opacity ?? 1) * 100)}
            onChange={e => changeOpacity(parseInt(e.target.value, 10))}
            className="flex-1 h-1 bg-modifier-border rounded outline-none"
          />
          <select
            value={layers[currentLayerIndex]?.blendMode || 'normal'}
            onChange={e => changeBlendMode(e.target.value)}
            className="p-1 border border-modifier-border rounded bg-primary text-xs"
          >
            {[
              'normal',
              'multiply',
              'screen',
              'overlay',
              'darken',
              'lighten',
              'color-dodge',
              'color-burn',
              'hard-light',
              'soft-light',
              'difference',
              'exclusion'
            ].map(mode => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
        </div>
      )}

      {/* レイヤーリスト */}
      <div className="space-y-1">
        {layers.map((layer, idx) => (
          <div
            key={idx}
            className={`p-2 bg-primary rounded cursor-pointer flex items-center gap-2 relative select-none hover:bg-modifier-hover ${idx === currentLayerIndex ? 'ring-2 ring-accent' : ''}`}
            onClick={() => selectLayer(idx)}
          >
            <div
              className={`w-4 h-4 border border-modifier-border rounded relative cursor-pointer ${layer.visible ? 'bg-accent' : 'bg-transparent'}`}
              onClick={e => {
                e.stopPropagation();
                toggleVisibility(idx);
              }}
            />
            <div
              className="text-text-normal text-sm flex-1"
              onDoubleClick={() => renameLayer(idx)}
            >
              {layer.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 