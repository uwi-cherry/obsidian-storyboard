import React, { useEffect, useState } from 'react';
import Toolbar from './components/Toolbar';
import ToolProperties from './components/ToolProperties';
import CanvasContainer from './components/CanvasContainer';
import usePainterPointer, { PainterTool } from '../../hooks/usePainterPointer';
import { useLayersStore } from '../../../obsidian-api/zustand/store/layers-store';
import { useCurrentLayerIndexStore } from '../../../obsidian-api/zustand/store/current-layer-index-store';
import { useCurrentPsdFileStore } from '../../../obsidian-api/zustand/store/current-psd-file-store';

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

  // PSDファイルが開かれた時に selectedFrame を設定
  useEffect(() => {
    console.log('🔍 PainterPage: useEffect発火 - view:', view, 'app:', app);
    console.log('🔍 PainterPage: view.file:', view?.file);
    console.log('🔍 PainterPage: view.file詳細:', view?.file ? {
      name: view.file.name,
      path: view.file.path,
      extension: view.file.extension
    } : 'ファイルなし');
    
    if (!view?.file || !app) {
      console.log('🔍 PainterPage: 条件不一致でリターン');
      return;
    }
    
    console.log('🔍 PainterPage: ファイル変化検知:', {
      file: view.file,
      extension: view.file.extension,
      path: view.file.path
    });
    
    if (view.file.extension === 'psd') {
      console.log('🔍 PainterPage: PSDファイルが開かれました:', view.file.path);
      
      // current-psd-file-storeを更新
      useCurrentPsdFileStore.getState().setCurrentPsdFile(view.file);
      console.log('🔍 PainterPage: current-psd-file-storeを設定しました:', view.file.path);
    } else {
      console.log('🔍 PainterPage: PSDファイルではありません:', view.file.extension);
      useCurrentPsdFileStore.getState().clearCurrentPsdFile();
    }
  }, [view, app, view?.file, view?.file?.path]);

  // zustandストアからレイヤー情報を同期
  useEffect(() => {
    console.log('🔍 PainterPage: zustandストアからレイヤー情報を同期中...', storeLayersRaw);
    setLayers(storeLayersRaw || []);
    setCurrentLayerIndex(storeCurrentLayerIndex || 0);
  }, [storeLayersRaw, storeCurrentLayerIndex]);

  return (
  <div className="flex w-full h-full overflow-hidden">
    <Toolbar tool={pointer.tool} onChange={(tool) => pointer.setTool(tool as PainterTool)} />
    <ToolProperties tool={pointer.tool} lineWidth={pointer.lineWidth} color={pointer.color} zoom={zoom} rotation={rotation} setLineWidth={pointer.setLineWidth} setColor={pointer.setColor} setZoom={setZoom} setRotation={setRotation} />   
    <CanvasContainer pointer={pointer} />    
  </div>);
}
