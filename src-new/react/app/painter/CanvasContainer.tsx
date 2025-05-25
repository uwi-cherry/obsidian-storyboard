import React, { useState } from 'react';
import { usePainterLayoutStore } from 'src-new/obsidian-api/zustand/storage/painter-layout-store';
import { PainterPointer } from 'src-new/react/hooks/usePainterPointer';
import ActionProperties from './features/ActionProperties';
import Canvas from './features/Canvas';
import ColorProperties from './features/ColorProperties';
import ToolProperties from './features/ToolProperties';

import TransformEditOverlay from './features/TransformEditOverlay';
import { useLayersStore } from 'src-new/obsidian-api/zustand/store/layers-store';
import { useCurrentLayerIndexStore } from 'src-new/obsidian-api/zustand/store/current-layer-index-store';
import { usePainterHistoryStore } from 'src-new/obsidian-api/zustand/store/painter-history-store';

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  pointer: PainterPointer;
  layers?: any[];
  currentLayerIndex?: number;
  view?: any;
  zoom: number;
  rotation: number;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
}

export default function CanvasContainer({ 
  pointer, 
  layers = [], 
  currentLayerIndex = 0, 
  view,
  zoom,
  rotation,
  setZoom,
  setRotation
}: Props) {
  const [selectionRect, setSelectionRect] = useState<SelectionRect | undefined>();
  const [menuMode, setMenuMode] = useState<'hidden' | 'global' | 'selection'>('global');
  const [menuPos, setMenuPos] = useState({ x: 8, y: 8 });
  const [editRect, setEditRect] = useState<SelectionRect | undefined>();
  
  const { layoutDirection } = usePainterLayoutStore();

  const handleSelectionStart = () => {
    setMenuMode('hidden');
  };

  const handleSelectionUpdate = (rect: SelectionRect | undefined) => {
    setSelectionRect(rect);
  };

  const handleSelectionEnd = (rect?: SelectionRect) => {
    if (rect) {
      setMenuPos({ x: rect.x, y: rect.y - 28 });
      setMenuMode('selection');
    } else {
      setMenuMode('global');
    }
  };

  const cancelSelection = () => {
    setSelectionRect(undefined);
    setMenuMode('global');
  };

  const startEdit = () => {
    let rect = selectionRect;
    if (!rect) {
      if (view?._canvas) {
        rect = { x: 0, y: 0, width: view._canvas.width, height: view._canvas.height };
      }
    }
    if (!rect) return;
    setEditRect(rect);
    setSelectionRect(undefined);
    setMenuMode('hidden');
  };

  const finishEdit = () => {
    setEditRect(undefined);
    setMenuMode('global');
  };

  const actionHandlers = {
    fill: () => {
      const layersStore = useLayersStore.getState();
      const currentLayerIndexStore = useCurrentLayerIndexStore.getState();
      const historyStore = usePainterHistoryStore.getState();

      const layers = layersStore.layers;
      const index = currentLayerIndexStore.currentLayerIndex;
      const layer = layers[index];
      if (!layer || !layer.canvas) return;

      // 履歴に現在の状態を保存
      historyStore.saveHistory(layers, index);

      const ctx = layer.canvas.getContext('2d');
      if (!ctx) return;

      const rect = selectionRect
        ? selectionRect
        : { x: 0, y: 0, width: layer.canvas.width, height: layer.canvas.height };

      ctx.fillStyle = pointer.color;
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

      layersStore.setLayers([...layers]);
    },
    clear: () => {
      const layersStore = useLayersStore.getState();
      const currentLayerIndexStore = useCurrentLayerIndexStore.getState();
      const historyStore = usePainterHistoryStore.getState();

      const layers = layersStore.layers;
      const index = currentLayerIndexStore.currentLayerIndex;
      const layer = layers[index];
      if (!layer || !layer.canvas) return;

      // 履歴に現在の状態を保存
      historyStore.saveHistory(layers, index);

      const ctx = layer.canvas.getContext('2d');
      if (!ctx) return;

      const rect = selectionRect
        ? selectionRect
        : { x: 0, y: 0, width: layer.canvas.width, height: layer.canvas.height };

      ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

      layersStore.setLayers([...layers]);
    },
    cancel: cancelSelection
  };

  const containerClass = layoutDirection === 'horizontal' 
    ? "flex flex-1 w-full h-full overflow-hidden"
    : "flex flex-col flex-1 w-full h-full overflow-hidden";

  const propertiesContainerClass = layoutDirection === 'horizontal' 
    ? "flex flex-col"
    : "flex flex-row border-b border-modifier-border";

  return (
    <div className={containerClass}>
      <div className={propertiesContainerClass}>
        <ToolProperties
          tool={pointer.tool}
          lineWidth={pointer.lineWidth}
          selectionMode={pointer.selectionMode}
          zoom={zoom}
          rotation={rotation}
          setLineWidth={pointer.setLineWidth}
          setSelectionMode={pointer.setSelectionMode}
          setZoom={setZoom}
          setRotation={setRotation}
          layoutDirection={layoutDirection}
        />
        
        <ColorProperties
          color={pointer.color}
          setColor={pointer.setColor}
          layoutDirection={layoutDirection}
        />
        
        <ActionProperties
          handlers={actionHandlers}
          mode={menuMode === 'selection' ? 'hidden' : 'global'}
          isFloating={false}
          layoutDirection={layoutDirection}
        />
      </div>
      
      <div className="flex flex-1 w-full h-full items-center justify-center overflow-auto bg-secondary relative">
        <Canvas
          pointer={pointer}
          layers={layers}
          currentLayerIndex={currentLayerIndex}
          view={view}
          selectionRect={selectionRect}
          onSelectionStart={handleSelectionStart}
          onSelectionUpdate={handleSelectionUpdate}
          onSelectionEnd={handleSelectionEnd}
        />
        
        {menuMode === 'selection' && (
          <ActionProperties
            handlers={actionHandlers}
            mode={menuMode}
            position={menuPos}
            isFloating={true}
          />
        )}

        {editRect && (
          <TransformEditOverlay
            rect={editRect}
            layers={layers}
            currentLayerIndex={currentLayerIndex}
            onFinish={finishEdit}
          />
        )}
      </div>
    </div>
  );
}
