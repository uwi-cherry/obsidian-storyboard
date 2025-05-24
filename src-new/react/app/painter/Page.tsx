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
  const [layers, setLayers] = useState<any[]>(view?.layers || []);
  const [currentLayerIndex, setCurrentLayerIndex] = useState<number>(
    view?.currentLayerIndex || 0
  );

  useEffect(() => {
    if (view && app) {
      console.log('🔍 PainterPage: useEffect実行 - view:', view, 'app:', app);
      console.log('🔍 PainterPage: app.plugins:', app.plugins);
      console.log('🔍 PainterPage: app.plugins.plugins:', app.plugins?.plugins);
      console.log('🔍 PainterPage: obsidian-storyboard plugin:', app.plugins?.plugins?.['obsidian-storyboard']);

      const globalVariableManager = app.plugins?.plugins?.['obsidian-storyboard']?.globalVariableManager;
      console.log('🔍 PainterPage: globalVariableManager:', globalVariableManager);

      if (globalVariableManager) {
        console.log('🔍 PainterPage: GlobalVariableManagerに情報を設定中...');

        // ペインタービューをGlobalVariableManagerに登録
        globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.PAINTER_VIEW, view);

        // 現在のレイヤー情報もGlobalVariableManagerに登録
        const currentLayers = view.layers || [];
        const currentLayerIndex = view.currentLayerIndex || 0;

        console.log('🔍 PainterPage: view.layers:', view.layers);
        console.log('🔍 PainterPage: view.currentLayerIndex:', view.currentLayerIndex);

        globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.LAYERS, currentLayers);
        globalVariableManager.setVariable(GLOBAL_VARIABLE_KEYS.CURRENT_LAYER_INDEX, currentLayerIndex);
        setLayers(currentLayers);
        setCurrentLayerIndex(currentLayerIndex);
        console.log('🔍 PainterPage: GlobalVariableManager設定完了:', {
          layersCount: currentLayers.length,
          currentIndex: currentLayerIndex
        });

        // レイヤー変更の監視を設定
        const updateGlobalLayers = () => {
          const updatedLayers = view.layers || [];
          const updatedLayerIndex = view.currentLayerIndex || 0;

          globalVariableManager.setVariable(
            GLOBAL_VARIABLE_KEYS.LAYERS,
            updatedLayers
          );
          globalVariableManager.setVariable(
            GLOBAL_VARIABLE_KEYS.CURRENT_LAYER_INDEX,
            updatedLayerIndex
          );
          setLayers(updatedLayers);
          setCurrentLayerIndex(updatedLayerIndex);
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
      <Toolbar tool={pointer.tool} onChange={pointer.setTool} />
      <ToolProperties
        tool={pointer.tool}
        lineWidth={pointer.lineWidth}
        color={pointer.color}
        zoom={zoom}
        rotation={rotation}
        setLineWidth={pointer.setLineWidth}
        setColor={pointer.setColor}
        setZoom={setZoom}
        setRotation={setRotation}
      />
      <CanvasContainer
        pointer={pointer}
        layers={layers}
        currentLayerIndex={currentLayerIndex}
        setLayers={setLayers}
        view={view}
      />
    </div>
  );
}
