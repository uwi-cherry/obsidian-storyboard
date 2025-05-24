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
  
  // zustandストアからレイヤー情報を取得
  const storeLayersRaw = useLayersStore((state) => state.layers);
  const storeCurrentLayerIndex = useCurrentLayerIndexStore((state) => state.currentLayerIndex);
  
  const [layers, setLayers] = useState<any[]>([]);
  const [currentLayerIndex, setCurrentLayerIndex] = useState<number>(0);

  // zustandストアからレイヤー情報を同期
  useEffect(() => {
    console.log('🔍 PainterPage: zustandストアからレイヤー情報を同期中...', storeLayersRaw);
    setLayers(storeLayersRaw || []);
    setCurrentLayerIndex(storeCurrentLayerIndex || 0);
  }, [storeLayersRaw, storeCurrentLayerIndex]);

  // ローカル状態とストアの同期
  useEffect(() => {
    if (!app) return;
    useLayersStore.getState().setLayers(layers);
    useCurrentLayerIndexStore.getState().setCurrentLayerIndex(currentLayerIndex);
  }, [layers, currentLayerIndex, app]);

  return (
  <div className="flex w-full h-full overflow-hidden">
    <Toolbar tool={pointer.tool} onChange={(tool) => pointer.setTool(tool as PainterTool)} />
    <ToolProperties tool={pointer.tool} lineWidth={pointer.lineWidth} color={pointer.color} zoom={zoom} rotation={rotation} setLineWidth={pointer.setLineWidth} setColor={pointer.setColor} setZoom={setZoom} setRotation={setRotation} />   
    <CanvasContainer pointer={pointer} />    
  </div>);
}
