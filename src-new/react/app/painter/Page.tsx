import React, { useEffect, useState } from 'react';
import Toolbar from './components/Toolbar';
import ToolProperties from './components/ToolProperties';
import CanvasContainer from './components/CanvasContainer';
import usePainterPointer, { PainterTool } from '../../hooks/usePainterPointer';
import { GLOBAL_VARIABLE_KEYS } from '../../../constants/constants';

interface PainterPageProps {
  view?: any;
  app?: any;
}

export default function PainterPage({ view, app }: PainterPageProps) {
  if (!view) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-primary text-text-normal">
        Painter ビューが見つかりません
      </div>
    );
  }
  const pointer = usePainterPointer();
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    if (view && app) {
      console.log('🔍 PainterPage: useEffect実行 - view:', view, 'app:', app);
      console.log('🔍 PainterPage: app.plugins:', app.plugins);
      console.log('🔍 PainterPage: app.plugins.plugins:', app.plugins?.plugins);
      console.log('🔍 PainterPage: obsidian-storyboard plugin:', app.plugins?.plugins?.['obsidian-storyboard']);

      const globalVariableManager = app.plugins?.plugins?.['obsidian-storyboard']?.globalVariableManager;
      console.log('🔍 PainterPage: globalVariableManager:', globalVariableManager);

      // ファイルからPSDデータを読み込む
      const loadPainterData = async () => {
        if (view.file && globalVariableManager?.toolRegistry) {
          try {
            console.log('🔍 PainterPage: PSDファイルを読み込み中...', view.file.path);
            const result = await globalVariableManager.toolRegistry.executeTool('load_painter_file', {
              app,
              file: view.file
            });
            const psdData = JSON.parse(result);
            
            console.log('🔍 PainterPage: PSDデータ読み込み完了:', psdData);
            
            // ビューにレイヤーデータを設定
            view.layers = psdData.layers || [];
            view.currentLayerIndex = 0;
            
            // GlobalVariableManagerにも設定
            globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.LAYERS, view.layers);
            globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.CURRENT_LAYER_INDEX, view.currentLayerIndex);
            
          } catch (error) {
            console.error('🔍 PainterPage: PSDファイル読み込みエラー:', error);
            // 読み込みに失敗した場合は初期化ツールを使用
            await globalVariableManager.toolRegistry.executeTool('initialize_painter_data', { view });
          }
        } else if (globalVariableManager?.toolRegistry) {
          // ファイルがない場合は初期化
          await globalVariableManager.toolRegistry.executeTool('initialize_painter_data', { view });
        }
      };

      if (globalVariableManager) {
        console.log('🔍 PainterPage: GlobalVariableManagerに情報を設定中...');

        // まずファイルデータを読み込む
        loadPainterData().then(() => {
          // ペインタービューをGlobalVariableManagerに登録
          globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.PAINTER_VIEW, view);

          // 現在のレイヤー情報もGlobalVariableManagerに登録
          const currentLayers = view.layers || [];
          const currentLayerIndex = view.currentLayerIndex || 0;

          console.log('🔍 PainterPage: view.layers:', view.layers);
          console.log('🔍 PainterPage: view.currentLayerIndex:', view.currentLayerIndex);

          globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.LAYERS, currentLayers);
          globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.CURRENT_LAYER_INDEX, currentLayerIndex);

          console.log('🔍 PainterPage: GlobalVariableManager設定完了:', {
            layersCount: currentLayers.length,
            currentIndex: currentLayerIndex
          });
        });

        // レイヤー変更の監視を設定
        const updateGlobalLayers = () => {
          const updatedLayers = view.layers || [];
          const updatedLayerIndex = view.currentLayerIndex || 0;

          globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.LAYERS, updatedLayers);
          globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.CURRENT_LAYER_INDEX, updatedLayerIndex);

          console.log('🔍 PainterPage: レイヤー情報更新:', {
            layersCount: updatedLayers.length,
            currentIndex: updatedLayerIndex
          });
        };

        // ビューにレイヤー変更のコールバックを設定
        if (view.setLayers) {
          const originalSetLayers = view.setLayers;
          view.setLayers = (layers: any) => {
            originalSetLayers(layers);
            setTimeout(updateGlobalLayers, 0); // 次のティックで実行
          };
        }

        if (view.setCurrentLayerIndex) {
          const originalSetCurrentLayerIndex = view.setCurrentLayerIndex;
          view.setCurrentLayerIndex = (index: number) => {
            originalSetCurrentLayerIndex(index);
            setTimeout(updateGlobalLayers, 0); // 次のティックで実行
          };
        }
      } else {
        console.log('🔍 PainterPage: GlobalVariableManagerが見つかりません');
      }
    }
  }, [view, app]);

  return (
  <div className="flex flex-1 overflow-hidden">
    <Toolbar tool={pointer.tool} onChange={(tool) => pointer.setTool(tool as PainterTool)} />     
    <ToolProperties tool={pointer.tool} lineWidth={pointer.lineWidth} color={pointer.color} zoom={zoom} rotation={rotation} setLineWidth={pointer.setLineWidth} setColor={pointer.setColor} setZoom={setZoom} setRotation={setRotation} />   
    <CanvasContainer pointer={pointer} />    
  </div>);
}
