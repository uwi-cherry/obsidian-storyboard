import React, { useEffect, useState } from 'react';
import Toolbar from './components/Toolbar';
import ToolProperties from './components/ToolProperties';
import CanvasContainer from './components/CanvasContainer';
import usePainterPointer, { PainterTool } from '../../hooks/usePainterPointer';
import { toolRegistry } from '../../../service-api/core/tool-registry';
import { useLayersStore } from '../../../obsidian-api/zustand/store/layers-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';

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

  // ビューを開いた際の初期ロード処理
  useEffect(() => {
    if (!view || !app) return;

    console.log('🔍 PainterPage: useEffect実行 - view:', view, 'app:', app);

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

          setLayers(psdData.layers || []);
          setCurrentLayerIndex(0);

          useLayersStore.getState().setLayers(psdData.layers || []);
          useCurrentLayerIndexStore.getState().setCurrentLayerIndex(0);
        } catch (error) {
          console.error('🔍 PainterPage: PSDファイル読み込みエラー:', error);
          try {
            await toolRegistry.executeTool('initialize_painter_data', { view });
            const initLayers = useLayersStore.getState().layers || [];
            setLayers(initLayers);
            setCurrentLayerIndex(0);
          } catch (initError) {
            console.error('🔍 PainterPage: 初期化エラー:', initError);
          }
        }
      } else {
        console.error('🔍 PainterPage: ファイルが見つかりません');
      }
    };

    // ファイルは常に読み込む
    loadPainterData();
  }, [view, app]);

  // レイヤー変更時にzustandストアを更新
  useEffect(() => {
    if (!app) return;
    useLayersStore.getState().setLayers(layers);
    useCurrentLayerIndexStore
      .getState()
      .setCurrentLayerIndex(currentLayerIndex);
  }, [layers, currentLayerIndex, app]);

  return (
  <div className="flex flex-1 overflow-hidden">
    <Toolbar tool={pointer.tool} onChange={(tool) => pointer.setTool(tool as PainterTool)} />     
    <ToolProperties tool={pointer.tool} lineWidth={pointer.lineWidth} color={pointer.color} zoom={zoom} rotation={rotation} setLineWidth={pointer.setLineWidth} setColor={pointer.setColor} setZoom={setZoom} setRotation={setRotation} />   
    <CanvasContainer pointer={pointer} />    
  </div>);
}
