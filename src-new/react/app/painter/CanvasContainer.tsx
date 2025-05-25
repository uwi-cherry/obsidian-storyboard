import React, { useState } from 'react';
import type { PainterView } from 'src-new/types/painter-types';
import { usePainterLayoutStore } from 'src-new/obsidian-api/zustand/storage/painter-layout-store';
import { PainterPointer } from 'src-new/react/hooks/usePainterPointer';
import useSelectionState, { SelectionState } from 'src-new/react/hooks/useSelectionState';
import ActionProperties from './features/ActionProperties';
import Canvas from './features/Canvas';
import { useRef } from 'react';
import ColorProperties from './features/ColorProperties';
import ToolProperties from './features/ToolProperties';

import TransformEditOverlay from './features/TransformEditOverlay';
import { useLayersStore } from 'src-new/obsidian-api/zustand/storage/layers-store';
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
  view?: PainterView;
  zoom: number;
  rotation: number;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
}

export default function CanvasContainer({
  pointer,
  view,
  zoom,
  rotation,
  setZoom,
  setRotation
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectionState: SelectionState = useSelectionState();
  const [, setSelectionVersion] = useState(0);
  const [menuMode, setMenuMode] = useState<'hidden' | 'global' | 'selection'>('global');
  const [menuPos, setMenuPos] = useState({ x: 8, y: 8 });
  const [editRect, setEditRect] = useState<SelectionRect | undefined>();
  
  const layers = useLayersStore((state) => state.layers);
  const currentLayerIndex = useCurrentLayerIndexStore((state) => state.currentLayerIndex);
  
  const { layoutDirection } = usePainterLayoutStore();

  const handleSelectionStart = () => {
    setMenuMode('hidden');
  };

  const handleSelectionUpdate = () => {
    setSelectionVersion(v => v + 1);
  };

  const handleSelectionEnd = () => {
    const rect = selectionState.getBoundingRect();
    if (rect) {
      setMenuPos({ x: rect.x, y: rect.y - 28 });
      setMenuMode('selection');
    } else {
      setMenuMode('global');
    }
  };

  const cancelSelection = () => {
    selectionState.reset();
    setSelectionVersion(v => v + 1);
    setMenuMode('global');
  };

  const startEdit = () => {
    const boundingRect = selectionState.getBoundingRect();
    let rect = boundingRect;
    if (!rect) {
      if (view?._canvas) {
        rect = { x: 0, y: 0, width: view._canvas.width, height: view._canvas.height };
      }
    }
    if (!rect) return;
    setEditRect(rect);
    selectionState.reset();
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

      historyStore.saveHistory(layers, index);

      const ctx = layer.canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();

      if (selectionState.mode === 'rect' && selectionState.selectionRect) {
        const rect = selectionState.selectionRect;
        ctx.fillStyle = pointer.color;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      } else if (selectionState.mode === 'lasso' && selectionState.lassoPoints.length > 2) {
        ctx.beginPath();
        ctx.moveTo(selectionState.lassoPoints[0].x, selectionState.lassoPoints[0].y);
        for (let i = 1; i < selectionState.lassoPoints.length; i++) {
          const p = selectionState.lassoPoints[i];
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.clip();
        
        const boundingRect = selectionState.getBoundingRect();
        if (boundingRect) {
          ctx.fillStyle = pointer.color;
          ctx.fillRect(boundingRect.x, boundingRect.y, boundingRect.width, boundingRect.height);
        }
      } else if (selectionState.mode === 'magic' && selectionState.magicClipPath) {
        ctx.clip(selectionState.magicClipPath);
        
        const boundingRect = selectionState.magicBounding;
        if (boundingRect) {
          ctx.fillStyle = pointer.color;
          ctx.fillRect(boundingRect.x, boundingRect.y, boundingRect.width, boundingRect.height);
        }
      } else {
        ctx.fillStyle = pointer.color;
        ctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
      }

      ctx.restore();
      layersStore.updateLayers([...layers]);
    },
    clear: () => {
      const layersStore = useLayersStore.getState();
      const currentLayerIndexStore = useCurrentLayerIndexStore.getState();
      const historyStore = usePainterHistoryStore.getState();

      const layers = layersStore.layers;
      const index = currentLayerIndexStore.currentLayerIndex;
      const layer = layers[index];
      if (!layer || !layer.canvas) return;

      historyStore.saveHistory(layers, index);

      const ctx = layer.canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();

      if (selectionState.mode === 'rect' && selectionState.selectionRect) {
        const rect = selectionState.selectionRect;
        ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
      } else if (selectionState.mode === 'lasso' && selectionState.lassoPoints.length > 2) {
        ctx.beginPath();
        ctx.moveTo(selectionState.lassoPoints[0].x, selectionState.lassoPoints[0].y);
        for (let i = 1; i < selectionState.lassoPoints.length; i++) {
          const p = selectionState.lassoPoints[i];
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.clip();
        
        const boundingRect = selectionState.getBoundingRect();
        if (boundingRect) {
          ctx.clearRect(boundingRect.x, boundingRect.y, boundingRect.width, boundingRect.height);
        }
      } else if (selectionState.mode === 'magic' && selectionState.magicClipPath) {
        ctx.clip(selectionState.magicClipPath);
        
        const boundingRect = selectionState.magicBounding;
        if (boundingRect) {
          ctx.clearRect(boundingRect.x, boundingRect.y, boundingRect.width, boundingRect.height);
        }
      } else {
        ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
      }

      ctx.restore();
      layersStore.updateLayers([...layers]);
    },
    edit: startEdit,
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
      
      <div className="flex flex-1 w-full h-full items-center justify-center overflow-auto bg-secondary relative" ref={containerRef}>
        <Canvas
          pointer={pointer}
          view={view}
          zoom={zoom}
          rotation={rotation}
          containerRef={containerRef}
          selectionState={selectionState}
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
