import React, { useEffect, useState } from 'react';
import Toolbar from './components/Toolbar';
import ToolProperties from './components/ToolProperties';
import CanvasContainer from './components/CanvasContainer';
import usePainterPointer, { PainterTool } from '../../hooks/usePainterPointer';
import { GLOBAL_VARIABLE_KEYS } from '../../../constants/constants';
import { toolRegistry } from '../../../service-api/core/tool-registry';

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
  const [layers, setLayers] = useState<any[]>([]);
  const [currentLayerIndex, setCurrentLayerIndex] = useState<number>(0);

  useEffect(() => {
    if (view && app) {
      console.log('🔍 PainterPage: useEffect実行 - view:', view, 'app:', app);

      const globalVariableManager = app.plugins?.plugins?.['obsidian-storyboard']?.globalVariableManager;
      console.log('🔍 PainterPage: globalVariableManager:', globalVariableManager);

      // ファイルからPSDデータを読み込む
      const loadPainterData = async () => {
        console.log('🔍 PainterPage: loadPainterData開始');
        console.log('🔍 PainterPage: view.file:', view.file);
        console.log('🔍 PainterPage: toolRegistry:', toolRegistry);
        
        if (view.file) {
          try {
            console.log('🔍 PainterPage: PSDファイルを読み込み中...', view.file.path);
            const result = await toolRegistry.executeTool('load_painter_file', {
              app,
              file: view.file
            });
            const psdData = JSON.parse(result);
            
            console.log('🔍 PainterPage: PSDデータ読み込み完了:', psdData);
            
            // Reactのstateにレイヤーデータを設定
            setLayers(psdData.layers || []);
            setCurrentLayerIndex(0);
            
            // GlobalVariableManagerにも設定
            if (globalVariableManager) {
              globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.LAYERS, psdData.layers || []);
              globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.CURRENT_LAYER_INDEX, 0);
            }
            
          } catch (error) {
            console.error('🔍 PainterPage: PSDファイル読み込みエラー:', error);
            // 読み込みに失敗した場合は初期化ツールを使用
            try {
              await toolRegistry.executeTool('initialize_painter_data', { view });
              // 初期化されたデータを取得
              if (globalVariableManager) {
                const initLayers = globalVariableManager.getVariable(GLOBAL_VARIABLE_KEYS.LAYERS) || [];
                setLayers(initLayers);
                setCurrentLayerIndex(0);
              }
            } catch (initError) {
              console.error('🔍 PainterPage: 初期化エラー:', initError);
            }
          }
        } else {
          console.error('🔍 PainterPage: ファイルが見つかりません');
        }
      };

      if (globalVariableManager) {
        console.log('🔍 PainterPage: GlobalVariableManagerに情報を設定中...');

        // まずファイルデータを読み込む
        loadPainterData().then(() => {
          // ペインタービューをGlobalVariableManagerに登録
          globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.PAINTER_VIEW, view);

          console.log('🔍 PainterPage: レイヤー設定完了:', {
            layersCount: layers.length,
            currentIndex: currentLayerIndex
          });
                });
      } else {
        console.log('🔍 PainterPage: GlobalVariableManagerが見つかりません');
      }
    }
  }, [view, app]);

  // レイヤー情報が変更された時にGlobalVariableManagerを更新
  useEffect(() => {
    if (app) {
      const globalVariableManager = app.plugins?.plugins?.['obsidian-storyboard']?.globalVariableManager;
      if (globalVariableManager) {
        globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.LAYERS, layers);
        globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.CURRENT_LAYER_INDEX, currentLayerIndex);

        console.log('🔍 PainterPage: レイヤー情報更新:', {
          layersCount: layers.length,
          currentIndex: currentLayerIndex
        });
      }
    }
  }, [layers, currentLayerIndex, app]);

  return (
  <div className="flex flex-1 overflow-hidden">
    <Toolbar tool={pointer.tool} onChange={(tool) => pointer.setTool(tool as PainterTool)} />     
    <ToolProperties tool={pointer.tool} lineWidth={pointer.lineWidth} color={pointer.color} zoom={zoom} rotation={rotation} setLineWidth={pointer.setLineWidth} setColor={pointer.setColor} setZoom={setZoom} setRotation={setRotation} />   
    <CanvasContainer pointer={pointer} />    
  </div>);
}
