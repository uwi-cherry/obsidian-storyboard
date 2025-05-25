import React, { useRef, useEffect, useState } from 'react';
import type { PainterPointer } from '../../../hooks/usePainterPointer';
import { useLayersStore } from '../../../../obsidian-api/zustand/store/layers-store';
import { useCurrentLayerIndexStore } from '../../../../obsidian-api/zustand/store/current-layer-index-store';
import { usePainterHistoryStore } from '../../../../obsidian-api/zustand/store/painter-history-store';
import useSelection, { SelectionMode } from '../../hooks/useSelection';

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CanvasProps {
  layers?: any[];
  currentLayerIndex?: number;
  setLayers?: (layers: any[]) => void;
  view?: any;
  pointer: PainterPointer;
  selectionMode?: SelectionMode;
  onSelectionStart?: () => void;
  onSelectionUpdate?: (rect: SelectionRect) => void;
  onSelectionEnd?: (rect: SelectionRect | undefined) => void;
}

export default function Canvas({
  layers = [],
  currentLayerIndex = 0,
  setLayers,
  view,
  pointer,
  selectionMode = 'rect',
  onSelectionStart,
  onSelectionUpdate,
  onSelectionEnd
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const {
    state: selectionState,
    setMode: setSelectionMode,
    onPointerDown: selectionPointerDown,
    onPointerMove: selectionPointerMove,
    onPointerUp: selectionPointerUp,
    draw: drawSelection,
    tick: selectionTick
  } = useSelection(canvasRef);

  useEffect(() => {
    setSelectionMode(selectionMode);
  }, [selectionMode, setSelectionMode]);

  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // キャンバスサイズをPSDサイズに合わせる
  useEffect(() => {
    if (view?._painterData?.canvasWidth && view?._painterData?.canvasHeight) {
      setCanvasSize({
        width: view._painterData.canvasWidth,
        height: view._painterData.canvasHeight
      });
    } else if (layers.length > 0 && layers[0].canvas) {
      setCanvasSize({
        width: layers[0].canvas.width || 800,
        height: layers[0].canvas.height || 600
      });
    }
  }, [view, layers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    
    if (layers && layers.length > 0) {
      layers.forEach((layer: any, index: number) => {
        if (layer.visible && layer.canvas) {
          console.log('🎨 Canvas: レイヤーを描画中:', layer.name, index);
          
          // レイヤーの不透明度を設定
          const originalAlpha = ctx.globalAlpha;
          ctx.globalAlpha = layer.opacity || 1;
          
          // ブレンドモードを設定（サポートされているもののみ）
          const originalCompositeOperation = ctx.globalCompositeOperation;
          if (layer.blendMode && layer.blendMode !== 'normal') {
            try {
              ctx.globalCompositeOperation = layer.blendMode;
            } catch (e) {
              console.warn('サポートされていないブレンドモード:', layer.blendMode);
            }
          }
          
          // レイヤーのキャンバスを描画
          try {
            ctx.drawImage(layer.canvas, 0, 0);
          } catch (error) {
            console.error('レイヤー描画エラー:', error, layer);
          }
          
          // 設定を元に戻す
          ctx.globalAlpha = originalAlpha;
          ctx.globalCompositeOperation = originalCompositeOperation;
        }
      });
    } else {
      console.log('🎨 Canvas: 描画するレイヤーがありません');
    }

    
    if (selectionState.hasSelection()) {
      drawSelection(ctx);
    }
  }, [layers, currentLayerIndex, selectionTick]);

  const getPointerPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { x, y };
  };

  const drawOnCurrentLayer = (fromPos: { x: number; y: number }, toPos: { x: number; y: number }) => {
    if (!layers[currentLayerIndex] || !layers[currentLayerIndex].canvas) return;

    const layerCanvas = layers[currentLayerIndex].canvas;
    const ctx = layerCanvas.getContext('2d');
    if (!ctx) return;

    if (pointer.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = pointer.color;
    }
    ctx.lineWidth = pointer.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(fromPos.x, fromPos.y);
    ctx.lineTo(toPos.x, toPos.y);
    ctx.stroke();

    // メインキャンバスを再描画
    const mainCanvas = canvasRef.current;
    if (mainCanvas) {
      const mainCtx = mainCanvas.getContext('2d');
      if (mainCtx) {
        mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
        layers.forEach((layer: any) => {
          if (layer.visible && layer.canvas) {
            const originalAlpha = mainCtx.globalAlpha;
            mainCtx.globalAlpha = layer.opacity || 1;
            mainCtx.drawImage(layer.canvas, 0, 0);
            mainCtx.globalAlpha = originalAlpha;
          }
        });
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const { x, y } = getPointerPos(e);

    const layersStore = useLayersStore.getState();
    const currentLayerIndexStore = useCurrentLayerIndexStore.getState();
    const historyStore = usePainterHistoryStore.getState();

    if (pointer.tool === 'selection') {
      selectionPointerDown(x, y);
      const rect = selectionState.getBoundingRect();
      if (rect) onSelectionUpdate?.(rect);
      onSelectionStart?.();
    } else if (pointer.tool === 'brush' || pointer.tool === 'eraser') {
      // 操作前の状態を履歴に保存
      historyStore.saveHistory(layersStore.layers, currentLayerIndexStore.currentLayerIndex);
      drawingRef.current = true;
      lastPosRef.current = { x, y };
      drawOnCurrentLayer({ x, y }, { x, y });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const { x, y } = getPointerPos(e);

    if (pointer.tool === 'selection') {
      selectionPointerMove(x, y);
      const rect = selectionState.getBoundingRect();
      if (rect) onSelectionUpdate?.(rect);
    } else if ((pointer.tool === 'brush' || pointer.tool === 'eraser') && drawingRef.current && lastPosRef.current) {
      drawOnCurrentLayer(lastPosRef.current, { x, y });
      lastPosRef.current = { x, y };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointer.tool === 'selection') {
      const valid = selectionPointerUp();
      if (valid) {
        const rect = selectionState.getBoundingRect();
        if (rect) onSelectionEnd?.(rect);
      } else {
        onSelectionUpdate?.(undefined as any);
        onSelectionEnd?.(undefined);
      }
    } else if (pointer.tool === 'brush' || pointer.tool === 'eraser') {
      drawingRef.current = false;
      lastPosRef.current = null;
      // 描画結果をzustandストアに反映
      const layersStore = useLayersStore.getState();
      layersStore.setLayers([...layers]);
    }
  };

  return (
    <div className="flex flex-1 w-full h-full bg-background overflow-hidden relative">
      <div className="flex items-center justify-center w-full h-full">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border border-modifier-border max-w-full max-h-full"
          style={{ 
            display: 'block',
            objectFit: 'contain'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>
    </div>
  );
}
